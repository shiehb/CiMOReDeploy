import json
import logging
import os
import zipfile
from datetime import datetime, timedelta
from io import BytesIO
from uuid import uuid4

from django.conf import settings as django_settings
from django.contrib.auth import authenticate
from django.core.exceptions import ValidationError
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from django.db import transaction
from django.http import HttpResponse
from django.utils import timezone
from PIL import Image, ImageOps
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from .email_utils import (
    generate_temp_password, send_welcome_email,
    send_request_confirmation_email, send_notification_email,
    send_password_reset_email,
    validate_email_domain, DOMAIN_ERROR,
)
from .models import (
    School, MarketingRequest, RequestAttachment, CommunicationLog,
    Document, User, Notification, NotificationPreference, PasswordResetToken,
)
from .serializers import (
    SchoolSerializer, MarketingRequestSerializer, RequestAttachmentSerializer,
    CommunicationLogSerializer, DocumentSerializer, UserSerializer,
)
from .permissions import IsAdmin, IsAdminOrStaff

logger = logging.getLogger(__name__)

MAX_AVATAR_FILE_SIZE = 5 * 1024 * 1024
AVATAR_MAX_DIMENSION = 512
ALLOWED_AVATAR_CONTENT_TYPES = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
}


def optimize_avatar_image(uploaded_file):
    if uploaded_file.size > MAX_AVATAR_FILE_SIZE:
        raise ValidationError('Avatar must be 5MB or smaller.')

    content_type = uploaded_file.content_type
    ext = ALLOWED_AVATAR_CONTENT_TYPES.get(content_type)
    if not ext:
        raise ValidationError('Invalid image type. Please upload JPEG, PNG, or WebP.')

    try:
        image = Image.open(uploaded_file)
        image.verify()
    except Exception:
        raise ValidationError('Uploaded file must be a valid image.')

    uploaded_file.seek(0)
    image = Image.open(uploaded_file)
    image = ImageOps.exif_transpose(image)
    if image.mode in ('P', 'RGBA', 'LA'):
        image = image.convert('RGBA')
    else:
        image = image.convert('RGB')
    image.thumbnail((AVATAR_MAX_DIMENSION, AVATAR_MAX_DIMENSION), Image.LANCZOS)

    output = BytesIO()
    if ext == 'jpg':
        if image.mode != 'RGB':
            image = image.convert('RGB')
        image.save(output, format='JPEG', quality=75, optimize=True)
    elif ext == 'webp':
        image.save(output, format='WEBP', quality=80, optimize=True, method=6)
    else:
        image.save(output, format='PNG', optimize=True)

    uploaded_file.seek(0)
    output.seek(0)
    return ContentFile(output.read(), name=f"avatar-{uuid4().hex}.{ext}")


def replace_user_avatar(user, uploaded_file):
    new_avatar = optimize_avatar_image(uploaded_file)
    old_avatar_name = user.avatar.name if user.avatar else None
    user.avatar.save(new_avatar.name, new_avatar, save=False)
    return old_avatar_name


# ---------------------------------------------------------------------------
# AUTH
# ---------------------------------------------------------------------------

@api_view(['POST'])
@permission_classes([AllowAny])
def login_api(request):
    username = request.data.get('username')
    password = request.data.get('password')

    user = authenticate(username=username, password=password)
    if not user:
        return Response(
            {"error": "Invalid credentials. Please try again."},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    # Domain restriction — only @slc-sflu.edu.ph accounts may log in
    if '@' in str(username) and not str(username).lower().endswith('@slc-sflu.edu.ph'):
        return Response({"error": DOMAIN_ERROR}, status=status.HTTP_403_FORBIDDEN)

    if not user.is_active:
        return Response(
            {"error": "This account has been deactivated."},
            status=status.HTTP_403_FORBIDDEN,
        )

    # Reject login if the temporary password has passed its 24-hour window
    if user.must_change_password and user.temp_password_expires_at:
        if timezone.now() > user.temp_password_expires_at:
            return Response(
                {"error": "Your temporary password has expired. Please contact an administrator to reset your account."},
                status=status.HTTP_403_FORBIDDEN,
            )

    # Record first-login: clear the temp-password requirement before responding
    first_login = user.must_change_password
    update_fields = ['last_login']
    user.last_login = timezone.now()
    if first_login:
        user.must_change_password = False
        user.temp_password_expires_at = None
        update_fields += ['must_change_password', 'temp_password_expires_at']
    user.save(update_fields=update_fields)

    token, _ = Token.objects.get_or_create(user=user)
    user_data = UserSerializer(user, context={'request': request}).data

    return Response({
        "message": "Login successful",
        "token": token.key,
        "role": user.role,
        "fullName": f"{user.first_name} {user.last_name}".strip() or user.username,
        "username": user.username,
        "user_id": user.id,
        "last_login": user.last_login,
        "must_change_password": first_login,
        "avatar_url": user_data.get('avatar_url'),
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_api(request):
    request.user.auth_token.delete()
    return Response({"message": "Logged out successfully."})


# ---------------------------------------------------------------------------
# SELF-REGISTRATION  (Public)
# ---------------------------------------------------------------------------

@api_view(['POST'])
@permission_classes([AllowAny])
def register_api(request):
    first_name = request.data.get('first_name', '').strip()
    last_name  = request.data.get('last_name', '').strip()
    email      = request.data.get('email', '').strip().lower()
    department = request.data.get('department', '').strip()
    id_number  = request.data.get('id_number', '').strip()

    if not first_name or not last_name:
        return Response({"error": "First name and last name are required."}, status=status.HTTP_400_BAD_REQUEST)
    if not email:
        return Response({"error": "Email is required."}, status=status.HTTP_400_BAD_REQUEST)
    if not email.endswith('@slc-sflu.edu.ph'):
        return Response({"error": DOMAIN_ERROR}, status=status.HTTP_400_BAD_REQUEST)
    if User.objects.filter(username=email).exists():
        return Response({"error": "An account with this email already exists."}, status=status.HTTP_400_BAD_REQUEST)

    temp_password = generate_temp_password(
        first_name=first_name, last_name=last_name, username=email, email=email,
    )
    user = User(
        username=email, email=email,
        first_name=first_name, last_name=last_name,
        role='Collaborator', department=department, id_number=id_number,
        must_change_password=True,
        temp_password_expires_at=timezone.now() + timedelta(hours=24),
    )
    avatar_file = request.FILES.get('avatar')
    if avatar_file:
        try:
            optimize_avatar_image(avatar_file)
        except ValidationError as exc:
            return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

    user.set_password(temp_password)
    user.save()

    if avatar_file:
        try:
            old_avatar = replace_user_avatar(user, avatar_file)
            user.save(update_fields=['avatar'])
            if old_avatar and default_storage.exists(old_avatar):
                default_storage.delete(old_avatar)
        except Exception:
            logger.exception('Error saving registration avatar for user_id=%s', user.id)

    logger.info("Self-registration: user_id=%s email=%s at=%s", user.id, email, timezone.now().isoformat())

    full_name = f"{first_name} {last_name}"
    delivered = send_welcome_email(user_email=email, full_name=full_name, username=email, temp_password=temp_password)
    if not delivered:
        logger.error("Welcome email not delivered for registered user_id=%s", user.id)
    user.email_delivered = delivered
    user.save(update_fields=['email_delivered'])

    return Response({
        "message": "Account created successfully. Check your email for your temporary login password.",
        "email_delivered": delivered,
    }, status=status.HTTP_201_CREATED)


# ---------------------------------------------------------------------------
# USER PROFILE  (own account — any authenticated user)
# ---------------------------------------------------------------------------

@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def profile_api(request):
    user = request.user
    if request.method == 'GET':
        return Response(UserSerializer(user, context={'request': request}).data)

    new_password     = request.data.get('password', '').strip()
    current_password = request.data.get('current_password', '').strip()
    avatar_file      = request.FILES.get('avatar')

    if new_password:
        if not current_password or not user.check_password(current_password):
            return Response(
                {"error": "Current password is incorrect."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if len(new_password) < 8:
            return Response({"error": "Password must be at least 8 characters."}, status=status.HTTP_400_BAD_REQUEST)
        user.set_password(new_password)

    old_avatar_name = None
    if avatar_file:
        try:
            old_avatar_name = replace_user_avatar(user, avatar_file)
        except ValidationError as exc:
            return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception:
            logger.exception('Avatar processing failed for user_id=%s', user.id)
            return Response(
                {"error": "Failed to process the uploaded avatar image."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    update_fields = []
    if new_password:
        update_fields.append('password')
    if avatar_file:
        update_fields.append('avatar')

    try:
        if update_fields:
            user.save(update_fields=update_fields)
    except Exception:
        if avatar_file and user.avatar and default_storage.exists(user.avatar.name):
            default_storage.delete(user.avatar.name)
        logger.exception('Failed to save updated profile for user_id=%s', user.id)
        return Response(
            {"error": "Unable to update profile at this time."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    if old_avatar_name and old_avatar_name != user.avatar.name and default_storage.exists(old_avatar_name):
        default_storage.delete(old_avatar_name)

    response_data = UserSerializer(user, context={'request': request}).data
    if new_password:
        Token.objects.filter(user=user).delete()
        new_token = Token.objects.create(user=user)
        response_data['token'] = new_token.key
        logger.info("Password changed for user_id=%s", user.id)

    return Response(response_data)


# ---------------------------------------------------------------------------
# USER MANAGEMENT  (Admin only)
# ---------------------------------------------------------------------------

@api_view(['GET', 'POST'])
@permission_classes([IsAdmin])
def users_api(request):
    if request.method == 'GET':
        show_archived = request.query_params.get('archived', 'false').lower() == 'true'
        users = User.objects.filter(is_archived=show_archived).order_by('last_name', 'first_name')
        serializer = UserSerializer(users, many=True, context={'request': request})
        return Response(serializer.data)

    serializer = UserSerializer(data=request.data)
    if serializer.is_valid():
        user = User(**{
            k: v for k, v in serializer.validated_data.items() if k != 'password'
        })

        # Auto-generate a secure temporary password — never use a caller-supplied one
        temp_password = generate_temp_password(
            first_name=user.first_name,
            last_name=user.last_name,
            username=user.username,
            email=user.email,
        )
        user.set_password(temp_password)
        user.must_change_password = True
        user.temp_password_expires_at = timezone.now() + timedelta(hours=24)
        user.save()

        logger.info(
            "Account created: user_id=%s username=%s at=%s (admin=%s)",
            user.id, user.username, timezone.now().isoformat(), request.user.username,
        )

        # Send welcome email with retry; flag the account if delivery fails
        full_name = f"{user.first_name} {user.last_name}".strip() or user.username
        delivered = send_welcome_email(
            user_email=user.email,
            full_name=full_name,
            username=user.username,
            temp_password=temp_password,
        )
        if not delivered:
            logger.error(
                "Welcome email not delivered for user_id=%s — manual intervention required",
                user.id,
            )
        user.email_delivered = delivered
        user.save(update_fields=['email_delivered'])

        # Notify all admins that a new user was created
        _notify_role(
            ['Admin'],
            'New User Account Created',
            f"{full_name} ({user.role}) has been added to the system by {request.user.get_full_name() or request.user.username}.",
            notif_type='user',
            exclude_user=request.user,
        )

        return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAdmin])
def user_detail_api(request, user_id):
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        return Response(UserSerializer(user, context={'request': request}).data)

    if request.method == 'PUT':
        serializer = UserSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            if 'password' in request.data and request.data['password']:
                user.set_password(request.data['password'])
                user.save()
            serializer.save()
            if 'is_archived' in serializer.validated_data:
                if serializer.validated_data['is_archived']:
                    user.is_active = False
                else:
                    user.is_active = True
                user.save(update_fields=['is_active'])
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # DELETE — archive user instead of hard delete and deactivate their account
    user.is_archived = True
    user.is_active = False
    user.save(update_fields=['is_archived', 'is_active'])
    return Response({"message": "User archived."}, status=status.HTTP_200_OK)


# ---------------------------------------------------------------------------
# MARKETING REQUEST MANAGEMENT
#   - Collaborator: create own, view own, edit own (Pending only), cancel own
#   - Staff/Admin: view all, approve/reject/edit any
# ---------------------------------------------------------------------------

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def marketing_requests_api(request):
    user = request.user

    if request.method == 'GET':
        if user.role == 'Collaborator':
            qs = MarketingRequest.objects.filter(requester=user).order_by('-created_at')
        else:
            qs = MarketingRequest.objects.select_related('requester').order_by('-created_at')
        return Response(MarketingRequestSerializer(qs, many=True).data)

    # POST — any authenticated user can submit a request
    data = request.data.copy()
    data['requester'] = user.id
    serializer = MarketingRequestSerializer(data=data)
    if serializer.is_valid():
        instance = serializer.save()
        # Send confirmation email to the requester
        full_name = f"{user.first_name} {user.last_name}".strip() or user.username
        pref = str(instance.preferred_date) if instance.preferred_date else 'Not specified'
        send_request_confirmation_email(
            user_email=user.email,
            full_name=full_name,
            title=instance.title or instance.type,
            request_id=instance.id,
            request_type=instance.type,
            preferred_date=pref,
        )
        # Notify staff and admins about the new request
        req_label = instance.title or instance.type
        _notify_role(
            ['Admin', 'Staff'],
            'New Marketing Request Submitted',
            f"{full_name} submitted a new request: \"{req_label}\" (#{instance.id}).",
            notif_type='request',
            exclude_user=user,
        )
        return Response(MarketingRequestSerializer(instance).data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def marketing_request_detail_api(request, request_id):
    try:
        mr = MarketingRequest.objects.select_related('requester').get(id=request_id)
    except MarketingRequest.DoesNotExist:
        return Response({"error": "Request not found"}, status=status.HTTP_404_NOT_FOUND)

    user = request.user
    is_owner = mr.requester_id == user.id
    is_staff_or_admin = user.role in ('Admin', 'Staff')

    if not (is_owner or is_staff_or_admin):
        return Response({"error": "Forbidden."}, status=status.HTTP_403_FORBIDDEN)

    if request.method == 'GET':
        return Response(MarketingRequestSerializer(mr).data)

    if request.method == 'PUT':
        data = request.data.copy()

        if is_staff_or_admin:
            # Staff/Admin can update status, notes, reviewed_by, and outcome fields
            _ALLOWED = ('status', 'notes', 'type', 'description', 'accomplishment_date', 'involved_members')
            allowed = {k: data[k] for k in _ALLOWED if k in data}
            if 'status' in allowed:
                allowed['reviewed_by'] = user.id
        else:
            # Collaborator can only edit their own Pending request (cancel or update details)
            if mr.status != 'Pending':
                return Response(
                    {"error": "Only pending requests can be edited or cancelled."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            allowed = {k: data[k] for k in ('type', 'description', 'status') if k in data}
            # Collaborator may only set status to Cancelled
            if 'status' in allowed and allowed['status'] not in ('Cancelled',):
                return Response(
                    {"error": "Collaborators may only cancel their own requests."},
                    status=status.HTTP_403_FORBIDDEN,
                )

        serializer = MarketingRequestSerializer(mr, data=allowed, partial=True)
        if serializer.is_valid():
            prev_status = mr.status
            updated = serializer.save()
            new_status = updated.status
            # Notify the requester if status changed to a terminal state
            if is_staff_or_admin and new_status != prev_status and new_status in ('Approved', 'Rejected', 'Cancelled'):
                req_label = updated.title or updated.type
                reviewer_name = request.user.get_full_name() or request.user.username
                _notify(
                    updated.requester,
                    f'Your Request Has Been {new_status}',
                    f"Your request \"{req_label}\" (#{updated.id}) was {new_status.lower()} by {reviewer_name}.",
                    notif_type='request',
                )
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # DELETE — Staff/Admin only hard-delete; collaborator cannot delete
    if not is_staff_or_admin:
        return Response({"error": "Forbidden."}, status=status.HTTP_403_FORBIDDEN)
    mr.delete()
    return Response({"message": "Request deleted."}, status=status.HTTP_204_NO_CONTENT)


# ---------------------------------------------------------------------------
# REQUEST ATTACHMENTS
# ---------------------------------------------------------------------------

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def request_attachments_api(request, request_id):
    try:
        mr = MarketingRequest.objects.get(id=request_id)
    except MarketingRequest.DoesNotExist:
        return Response({"error": "Request not found."}, status=status.HTTP_404_NOT_FOUND)

    if mr.requester_id != request.user.id and request.user.role not in ('Admin', 'Staff'):
        return Response({"error": "Forbidden."}, status=status.HTTP_403_FORBIDDEN)

    file = request.FILES.get('file')
    if not file:
        return Response({"error": "No file provided."}, status=status.HTTP_400_BAD_REQUEST)

    attachment = RequestAttachment.objects.create(
        request=mr,
        file=file,
        original_name=file.name,
    )
    return Response(RequestAttachmentSerializer(attachment).data, status=status.HTTP_201_CREATED)


# ---------------------------------------------------------------------------
# COMMUNICATION LOGS
#   - All authenticated users can view and send
#   - Staff/Admin can update status
# ---------------------------------------------------------------------------

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def communication_logs_api(request):
    user = request.user

    if request.method == 'GET':
        if user.role == 'Collaborator':
            # Only logs related to their own requests
            qs = CommunicationLog.objects.filter(
                related_request__requester=user
            ).order_by('-created_at')
        else:
            qs = CommunicationLog.objects.select_related('related_request').order_by('-created_at')
        return Response(CommunicationLogSerializer(qs, many=True).data)

    serializer = CommunicationLogSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def communication_log_detail_api(request, log_id):
    try:
        log = CommunicationLog.objects.get(id=log_id)
    except CommunicationLog.DoesNotExist:
        return Response({"error": "Communication log not found"}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        return Response(CommunicationLogSerializer(log).data)

    # Only Staff/Admin can update log status
    if request.user.role not in ('Admin', 'Staff'):
        return Response({"error": "Forbidden."}, status=status.HTTP_403_FORBIDDEN)

    serializer = CommunicationLogSerializer(log, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ---------------------------------------------------------------------------
# TRAILBLAZING / SCHOOL MANAGEMENT  (Staff and Admin)
# ---------------------------------------------------------------------------

@api_view(['GET', 'POST'])
@permission_classes([IsAdminOrStaff])
def schools_api(request):
    if request.method == 'GET':
        show_archived = request.query_params.get('archived', 'false').lower() == 'true'
        qs = School.objects.filter(is_archived=show_archived).order_by('school_name')
        return Response(SchoolSerializer(qs, many=True).data)

    serializer = SchoolSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAdminOrStaff])
def school_detail_api(request, school_id):
    try:
        school = School.objects.get(id=school_id)
    except School.DoesNotExist:
        return Response({"error": "School not found"}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        return Response(SchoolSerializer(school).data)

    if request.method == 'PUT':
        serializer = SchoolSerializer(school, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # DELETE — archive instead of hard delete
    school.is_archived = True
    school.save(update_fields=['is_archived'])
    return Response({"message": "School archived."}, status=status.HTTP_200_OK)


# ---------------------------------------------------------------------------
# DASHBOARD SUMMARY  (All authenticated users)
# ---------------------------------------------------------------------------

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_api(request):
    from datetime import date, datetime

    today = date.today()

    total_requests = MarketingRequest.objects.count()
    pending_requests = MarketingRequest.objects.filter(status='Pending').count()
    schools_visited = School.objects.filter(is_archived=False, last_visited__isnull=False).count()
    documents_uploaded = Document.objects.count()

    # Last 6 months for the chart
    months = []
    for i in range(5, -1, -1):
        offset = today.month - i - 1
        month_num = offset % 12 + 1
        year = today.year + offset // 12
        months.append(date(year, month_num, 1))

    visits_raw = School.objects.filter(last_visited__isnull=False).values_list('last_visited', flat=True)
    visits_map = {}
    for d in visits_raw:
        key = f"{d.year}-{d.month:02d}"
        visits_map[key] = visits_map.get(key, 0) + 1

    chart_data = [
        {'name': m.strftime('%b'), 'visits': visits_map.get(f"{m.year}-{m.month:02d}", 0)}
        for m in months
    ]

    # Recent marketing requests (last 5)
    recent_requests = []
    for r in MarketingRequest.objects.select_related('requester').order_by('-created_at')[:5]:
        full_name = f"{r.requester.first_name} {r.requester.last_name}".strip() or r.requester.username
        recent_requests.append({
            'id': r.id,
            'type': r.type,
            'requester': full_name,
            'status': r.status,
            'date': r.created_at.strftime('%b %d, %Y'),
        })

    # Recent activity feed
    activity = []

    for mr in MarketingRequest.objects.select_related('requester').order_by('-created_at')[:3]:
        full_name = f"{mr.requester.first_name} {mr.requester.last_name}".strip() or mr.requester.username
        activity.append({
            'type': 'request',
            'title': 'New Marketing Request',
            'desc': f"{mr.type} by {full_name}",
            'time': mr.created_at.isoformat(),
        })

    for school in School.objects.filter(last_visited__isnull=False).order_by('-last_visited')[:2]:
        activity.append({
            'type': 'school',
            'title': 'School Visit Completed',
            'desc': school.school_name,
            'time': school.last_visited.isoformat(),
        })

    for doc in Document.objects.order_by('-updated_at')[:2]:
        activity.append({
            'type': 'doc',
            'title': f"Document {doc.status}",
            'desc': doc.title,
            'time': doc.updated_at.isoformat(),
        })

    for user in User.objects.order_by('-date_joined')[:1]:
        full_name = f"{user.first_name} {user.last_name}".strip() or user.username
        activity.append({
            'type': 'user',
            'title': 'New User Registered',
            'desc': f"{user.role} - {full_name}",
            'time': user.date_joined.isoformat(),
        })

    activity.sort(key=lambda x: x.get('time', '')[:10], reverse=True)

    return Response({
        'stats': {
            'total_requests': total_requests,
            'pending_requests': pending_requests,
            'schools_visited': schools_visited,
            'documents_uploaded': documents_uploaded,
        },
        'chart_data': chart_data,
        'recent_requests': recent_requests,
        'recent_activity': activity[:5],
    })


# ---------------------------------------------------------------------------
# DOCUMENT & REPORT MANAGEMENT  (Staff and Admin)
# ---------------------------------------------------------------------------

@api_view(['GET', 'POST'])
@permission_classes([IsAdminOrStaff])
def documents_api(request):
    if request.method == 'GET':
        qs = Document.objects.select_related('created_by').order_by('-created_at')
        return Response(DocumentSerializer(qs, many=True).data)

    data = request.data.copy()
    data['created_by'] = request.user.id
    serializer = DocumentSerializer(data=data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAdminOrStaff])
def document_detail_api(request, doc_id):
    try:
        doc = Document.objects.select_related('created_by').get(id=doc_id)
    except Document.DoesNotExist:
        return Response({"error": "Document not found"}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        return Response(DocumentSerializer(doc).data)

    if request.method == 'PUT':
        serializer = DocumentSerializer(doc, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # DELETE — only Admin can hard-delete documents
    if request.user.role != 'Admin':
        return Response({"error": "Only Admins can delete documents."}, status=status.HTTP_403_FORBIDDEN)
    doc.delete()
    return Response({"message": "Document deleted."}, status=status.HTTP_204_NO_CONTENT)


# ---------------------------------------------------------------------------
# BACKUP & RESTORE  (Admin only — ZIP archive downloaded to the client)
#
# ZIP layout:
#   data.json          — serialised DB records for selected models
#   media/<rel_path>   — every file in MEDIA_ROOT (avatars, attachments, …)
# ---------------------------------------------------------------------------

_BACKUP_MODELS = {
    'users': lambda: list(User.objects.values(
        'id', 'username', 'email', 'first_name', 'last_name',
        'role', 'is_active', 'department', 'id_number', 'date_joined',
    )),
    'schools':            lambda: list(School.objects.values()),
    'marketing_requests': lambda: list(MarketingRequest.objects.values()),
    'documents':          lambda: list(Document.objects.values()),
    'communication_logs': lambda: list(CommunicationLog.objects.values()),
}

MEDIA_ROOT = str(django_settings.MEDIA_ROOT)


def _build_zip(selected_models):
    """Return a BytesIO containing the complete backup ZIP."""
    payload = {
        'version': '1.0',
        'app': 'CIMOre',
        'created_at': datetime.now().isoformat(),
        'models_included': selected_models,
        'data': {},
    }
    for key in selected_models:
        if key in _BACKUP_MODELS:
            try:
                payload['data'][key] = _BACKUP_MODELS[key]()
            except Exception:
                logger.exception('Backup export error for model=%s', key)
                payload['data'][key] = []

    buf = BytesIO()
    with zipfile.ZipFile(buf, 'w', zipfile.ZIP_DEFLATED) as zf:
        # ── database records ──
        zf.writestr('data.json', json.dumps(payload, indent=2, default=str))

        # ── media files ──
        if os.path.isdir(MEDIA_ROOT):
            for dirpath, _, filenames in os.walk(MEDIA_ROOT):
                for fname in filenames:
                    abs_path = os.path.join(dirpath, fname)
                    # store as  media/<relative>  inside the ZIP
                    rel = os.path.relpath(abs_path, MEDIA_ROOT)
                    arcname = 'media/' + rel.replace(os.sep, '/')
                    zf.write(abs_path, arcname)

    buf.seek(0)
    return buf


@api_view(['POST'])
@permission_classes([IsAdmin])
def backup_api(request):
    selected = request.data.get('models', list(_BACKUP_MODELS.keys()))
    filename = os.path.basename(request.data.get('filename', '').strip())
    if not filename:
        filename = f"cimore_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    if not filename.endswith('.zip'):
        filename = filename.removesuffix('.json') + '.zip'

    buf = _build_zip(selected)
    logger.info('Backup ZIP generated: models=%s by user_id=%s', selected, request.user.id)

    response = HttpResponse(buf.read(), content_type='application/zip')
    response['Content-Disposition'] = f'attachment; filename="{filename}"'
    return response


def _restore_db(payload):
    """Import DB records from a parsed backup payload. Returns results dict."""
    data = payload.get('data', {})
    results = {}

    def _upsert(Model, key):
        created = 0
        rows = data.get(key, [])
        for obj in rows:
            obj = dict(obj)
            obj_id = obj.pop('id', None)
            if obj_id is None:
                continue
            _, was_created = Model.objects.get_or_create(id=obj_id, defaults=obj)
            if was_created:
                created += 1
        results[key] = f'{created} created, {len(rows) - created} already existed'

    with transaction.atomic():
        if 'schools' in data:
            _upsert(School, 'schools')
        if 'documents' in data:
            _upsert(Document, 'documents')
        if 'communication_logs' in data:
            _upsert(CommunicationLog, 'communication_logs')
        if 'marketing_requests' in data:
            _upsert(MarketingRequest, 'marketing_requests')
        if 'users' in data:
            created = 0
            rows = data['users']
            for obj in rows:
                username = obj.get('username', '')
                if not User.objects.filter(username=username).exists():
                    User.objects.create_user(
                        username=username,
                        email=obj.get('email', ''),
                        first_name=obj.get('first_name', ''),
                        last_name=obj.get('last_name', ''),
                        role=obj.get('role', 'Staff'),
                        department=obj.get('department', ''),
                        id_number=obj.get('id_number', ''),
                        is_active=obj.get('is_active', True),
                        password=User.objects.make_random_password(),
                        must_change_password=True,
                    )
                    created += 1
            results['users'] = f'{created} created, {len(rows) - created} already existed'

    return results


@api_view(['POST'])
@permission_classes([IsAdmin])
def restore_api(request):
    backup_file = request.FILES.get('backup_file')
    if not backup_file:
        return Response({'error': 'No backup file provided.'}, status=status.HTTP_400_BAD_REQUEST)

    fname_lower = backup_file.name.lower()
    files_restored = 0

    try:
        if fname_lower.endswith('.zip'):
            raw = backup_file.read()
            if not zipfile.is_zipfile(BytesIO(raw)):
                return Response({'error': 'File is not a valid ZIP archive.'}, status=status.HTTP_400_BAD_REQUEST)

            with zipfile.ZipFile(BytesIO(raw), 'r') as zf:
                names = zf.namelist()

                # ── restore database records ──
                if 'data.json' not in names:
                    return Response({'error': 'ZIP is missing data.json — not a CIMOre backup.'}, status=status.HTTP_400_BAD_REQUEST)
                payload = json.loads(zf.read('data.json').decode('utf-8'))

                # ── restore media files ──
                for name in names:
                    if name == 'data.json' or name.endswith('/'):
                        continue
                    if name.startswith('media/'):
                        rel = name[len('media/'):]
                        dest = os.path.join(MEDIA_ROOT, rel)
                        os.makedirs(os.path.dirname(dest), exist_ok=True)
                        if not os.path.exists(dest):          # never overwrite existing files
                            with zf.open(name) as src, open(dest, 'wb') as dst:
                                dst.write(src.read())
                            files_restored += 1

        elif fname_lower.endswith('.json'):
            # Legacy JSON-only backup (backward-compatible)
            payload = json.loads(backup_file.read().decode('utf-8'))

        else:
            return Response(
                {'error': 'Unsupported format. Upload a .zip (full backup) or .json (data-only backup).'},
                status=status.HTTP_400_BAD_REQUEST,
            )

    except (json.JSONDecodeError, KeyError):
        return Response({'error': 'Could not parse backup file.'}, status=status.HTTP_400_BAD_REQUEST)
    except Exception:
        logger.exception('Restore pre-processing failed')
        return Response({'error': 'Failed to read backup file.'}, status=status.HTTP_400_BAD_REQUEST)

    if payload.get('app') != 'CIMOre':
        return Response({'error': 'Incompatible backup (wrong app identifier).'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        results = _restore_db(payload)
    except Exception:
        logger.exception('Restore DB import failed')
        return Response(
            {'error': 'Database restore failed. No records were changed.'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    if files_restored:
        results['files'] = f'{files_restored} media file(s) restored'

    logger.info('Restore completed by user_id=%s: %s', request.user.id, results)
    return Response({'message': 'Restore completed successfully.', 'results': results})


# ---------------------------------------------------------------------------
# NOTIFICATIONS
# ---------------------------------------------------------------------------

def _get_prefs(user):
    prefs, _ = NotificationPreference.objects.get_or_create(user=user)
    return prefs


def _notify(recipient, title, body, notif_type='system', link='', send_email=True):
    """Create an in-app notification and optionally email the recipient."""
    Notification.objects.create(
        recipient=recipient, title=title, body=body, type=notif_type, link=link,
    )
    if send_email and recipient.email:
        prefs = _get_prefs(recipient)
        if prefs.email_notifications:
            full_name = f"{recipient.first_name} {recipient.last_name}".strip() or recipient.username
            send_notification_email(recipient.email, full_name, title, body)


def _notify_role(roles, title, body, notif_type='system', link='', exclude_user=None):
    """Create notifications for all active users matching any of the given roles."""
    qs = User.objects.filter(role__in=roles, is_active=True)
    if exclude_user:
        qs = qs.exclude(pk=exclude_user.pk)
    for user in qs:
        _notify(user, title, body, notif_type=notif_type, link=link)


def _notif_to_dict(n):
    return {
        'id':         n.id,
        'title':      n.title,
        'body':       n.body,
        'type':       n.type,
        'is_read':    n.is_read,
        'created_at': n.created_at.isoformat(),
        'link':       n.link,
    }


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def notifications_list_api(request):
    """Return the 30 most recent notifications + unread count for the current user."""
    qs = Notification.objects.filter(recipient=request.user).order_by('-created_at')[:30]
    unread = Notification.objects.filter(recipient=request.user, is_read=False).count()
    return Response({'notifications': [_notif_to_dict(n) for n in qs], 'unread': unread})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def notification_read_api(request, notif_id):
    """Mark a single notification as read."""
    try:
        n = Notification.objects.get(id=notif_id, recipient=request.user)
    except Notification.DoesNotExist:
        return Response({'error': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
    n.is_read = True
    n.save(update_fields=['is_read'])
    return Response({'ok': True})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def notifications_read_all_api(request):
    """Mark all of the current user's notifications as read."""
    Notification.objects.filter(recipient=request.user, is_read=False).update(is_read=True)
    return Response({'ok': True})


@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def notification_prefs_api(request):
    prefs = _get_prefs(request.user)
    if request.method == 'GET':
        return Response({
            'email_notifications': prefs.email_notifications,
            'push_notifications':  prefs.push_notifications,
            'marketing_updates':   prefs.marketing_updates,
        })
    # PUT — update
    for field in ('email_notifications', 'push_notifications', 'marketing_updates'):
        if field in request.data:
            setattr(prefs, field, bool(request.data[field]))
    prefs.save()
    return Response({
        'email_notifications': prefs.email_notifications,
        'push_notifications':  prefs.push_notifications,
        'marketing_updates':   prefs.marketing_updates,
    })


@api_view(['POST'])
@permission_classes([IsAdmin])
def notification_send_api(request):
    """Admin: broadcast a notification (+ optional email) to a target group."""
    title   = request.data.get('title', '').strip()
    body    = request.data.get('body', '').strip()
    target  = request.data.get('target', 'all')   # 'all' | 'staff_admin' | 'collaborators'
    via_email = bool(request.data.get('send_email', True))

    if not title:
        return Response({'error': 'Title is required.'}, status=status.HTTP_400_BAD_REQUEST)

    role_map = {
        'all':           ['Admin', 'Staff', 'Collaborator'],
        'staff_admin':   ['Admin', 'Staff'],
        'collaborators': ['Collaborator'],
    }
    roles = role_map.get(target, ['Admin', 'Staff', 'Collaborator'])
    recipients = User.objects.filter(role__in=roles, is_active=True)

    sent = 0
    for user in recipients:
        _notify(user, title, body, notif_type='announcement', send_email=via_email)
        sent += 1

    logger.info('Admin user_id=%s broadcast notification to %d users (target=%s)', request.user.id, sent, target)
    return Response({'message': f'Notification sent to {sent} user(s).'})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def notification_test_email_api(request):
    """Send a test notification email to the current user."""
    user = request.user
    if not user.email:
        return Response({'error': 'Your account has no email address.'}, status=status.HTTP_400_BAD_REQUEST)
    full_name = f"{user.first_name} {user.last_name}".strip() or user.username
    ok = send_notification_email(
        user.email, full_name,
        'Test Notification from CiMORe',
        'This is a test notification to confirm your email delivery settings are working correctly.',
    )
    if ok:
        return Response({'message': f'Test email sent to {user.email}.'})
    return Response({'error': 'Email delivery failed. Check server email settings.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ---------------------------------------------------------------------------
# Password Reset
# ---------------------------------------------------------------------------

@api_view(['POST'])
@permission_classes([AllowAny])
def forgot_password_api(request):
    """
    POST { email }
    Creates a reset token and emails a link. Always returns 200 so we don't
    reveal whether an account exists for a given email.
    """
    email = (request.data.get('email') or '').strip().lower()
    if not email:
        return Response({'message': 'If that email exists in our system, a reset link has been sent.'})

    try:
        user = User.objects.get(email__iexact=email, is_active=True)
    except User.DoesNotExist:
        return Response({'message': 'If that email exists in our system, a reset link has been sent.'})

    # Invalidate any existing unused tokens for this user
    PasswordResetToken.objects.filter(user=user, used=False).update(used=True)

    token_obj = PasswordResetToken(user=user)
    token_obj.save()

    full_name = f"{user.first_name} {user.last_name}".strip() or user.username
    send_password_reset_email(user.email, full_name, token_obj.token)

    return Response({'message': 'If that email exists in our system, a reset link has been sent.'})


@api_view(['POST'])
@permission_classes([AllowAny])
def reset_password_api(request):
    """
    POST { token, new_password }
    Validates the reset token and sets the new password.
    """
    token_str    = (request.data.get('token') or '').strip()
    new_password = (request.data.get('new_password') or '').strip()

    if not token_str or not new_password:
        return Response({'error': 'Token and new password are required.'}, status=status.HTTP_400_BAD_REQUEST)

    if len(new_password) < 8:
        return Response({'error': 'Password must be at least 8 characters.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        token_obj = PasswordResetToken.objects.select_related('user').get(token=token_str)
    except PasswordResetToken.DoesNotExist:
        return Response({'error': 'Invalid or expired reset link.'}, status=status.HTTP_400_BAD_REQUEST)

    if not token_obj.is_valid():
        return Response({'error': 'This reset link has expired or already been used.'}, status=status.HTTP_400_BAD_REQUEST)

    user = token_obj.user
    user.set_password(new_password)
    user.must_change_password = False
    user.save()

    token_obj.used = True
    token_obj.save()

    # Invalidate all auth tokens so old sessions are logged out
    Token.objects.filter(user=user).delete()

    return Response({'message': 'Password reset successful. You can now log in with your new password.'})
