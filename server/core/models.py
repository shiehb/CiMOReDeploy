import hashlib
import secrets
from datetime import timedelta

from django.conf import settings
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone


class User(AbstractUser):
    role = models.CharField(max_length=20, default='Staff')
    is_active = models.BooleanField(default=True)
    is_archived = models.BooleanField(default=False)
    must_change_password = models.BooleanField(default=False)
    temp_password_expires_at = models.DateTimeField(null=True, blank=True)
    email_delivered = models.BooleanField(default=True)
    department = models.CharField(max_length=255, blank=True, default='')
    id_number = models.CharField(max_length=50, blank=True, default='')
    avatar = models.ImageField(upload_to='avatars/%Y/%m/', blank=True, null=True)


class PasswordResetToken(models.Model):
    user       = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reset_tokens')
    token      = models.CharField(max_length=64, unique=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    used       = models.BooleanField(default=False)

    def save(self, *args, **kwargs):
        if not self.pk:
            self.token = secrets.token_urlsafe(32)
            self.expires_at = timezone.now() + timedelta(hours=2)
        super().save(*args, **kwargs)

    def is_valid(self):
        return not self.used and timezone.now() < self.expires_at


class SecureToken(models.Model):
    """
    Stores a SHA-256 hash of the bearer token — the raw value is never persisted.
    Tokens expire automatically after TOKEN_LIFETIME (24 hours).
    """
    TOKEN_LIFETIME = timedelta(hours=24)

    user       = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='secure_token',
    )
    token_hash = models.CharField(max_length=64, unique=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()

    # ------------------------------------------------------------------ helpers

    @staticmethod
    def _hash(raw: str) -> str:
        return hashlib.sha256(raw.encode()).hexdigest()

    @classmethod
    def create_for_user(cls, user) -> str:
        """
        Revoke any existing token, mint a new one, and return the raw value.
        The raw value is returned ONCE and never stored.
        """
        cls.objects.filter(user=user).delete()
        raw = secrets.token_urlsafe(32)
        cls.objects.create(
            user=user,
            token_hash=cls._hash(raw),
            expires_at=timezone.now() + cls.TOKEN_LIFETIME,
        )
        return raw

    def is_valid(self) -> bool:
        return timezone.now() < self.expires_at

    def __str__(self):
        return f"SecureToken(user={self.user_id}, expires={self.expires_at:%Y-%m-%d %H:%M UTC})"


class School(models.Model):
    school_name = models.CharField(max_length=255)
    address = models.TextField()
    principal_name = models.CharField(max_length=255)
    contact_info = models.CharField(max_length=100)
    offered_strands = models.TextField()
    estimated_students = models.IntegerField()
    is_archived = models.BooleanField(default=False)
    last_visited = models.DateField(null=True, blank=True)


class MarketingRequest(models.Model):
    STATUS_CHOICES = [
        ('Pending', 'Pending'),
        ('Approved', 'Approved'),
        ('Rejected', 'Rejected'),
        ('Cancelled', 'Cancelled'),
        ('Archived', 'Archived'),
    ]
    REQUEST_TYPE_CHOICES = [
        ('Production', 'Request for Production'),
        ('Information Dissemination', 'Request for Information Dissemination'),
    ]
    requester = models.ForeignKey(User, on_delete=models.CASCADE, related_name='marketing_requests')
    title = models.CharField(max_length=255, blank=True, default='')
    type = models.CharField(max_length=100, blank=True, default='')
    description = models.TextField(blank=True, default='')
    preferred_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Pending')
    notes = models.TextField(blank=True, default='')
    reviewed_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name='reviewed_requests'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Request classification
    request_type = models.CharField(max_length=50, choices=REQUEST_TYPE_CHOICES, default='Production')
    is_draft = models.BooleanField(default=False)

    # Production-specific fields
    requesting_unit = models.CharField(max_length=255, blank=True, default='')
    expected_medium = models.CharField(max_length=255, blank=True, default='')
    event_description = models.TextField(blank=True, default='')
    event_objectives = models.TextField(blank=True, default='')
    audience = models.TextField(blank=True, default='')
    event_date = models.DateField(null=True, blank=True)
    event_venue = models.CharField(max_length=255, blank=True, default='')
    materials_endorsed = models.CharField(max_length=50, blank=True, default='')

    # Information Dissemination-specific fields
    platform = models.CharField(max_length=100, blank=True, default='')
    writers = models.TextField(blank=True, default='')
    keywords = models.TextField(blank=True, default='')

    # Outcome fields (filled by CIMO staff when responding)
    accomplishment_date = models.DateField(null=True, blank=True)
    involved_members = models.TextField(blank=True, default='')


class RequestAttachment(models.Model):
    request = models.ForeignKey(MarketingRequest, on_delete=models.CASCADE, related_name='attachments')
    file = models.FileField(upload_to='attachments/%Y/%m/')
    original_name = models.CharField(max_length=255)
    uploaded_at = models.DateTimeField(auto_now_add=True)


class CommunicationLog(models.Model):
    STATUS_CHOICES = [
        ('Pending', 'Pending'),
        ('Forwarded', 'Forwarded'),
        ('Completed', 'Completed'),
    ]
    sender_name = models.CharField(max_length=255)
    recipient_name = models.CharField(max_length=255, blank=True, default='')
    message = models.TextField(blank=True, default='')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Pending')
    related_request = models.ForeignKey(
        MarketingRequest, on_delete=models.SET_NULL, null=True, blank=True, related_name='communications'
    )
    file = models.FileField(upload_to='chat/%Y/%m/', null=True, blank=True)
    file_name = models.CharField(max_length=255, blank=True, default='')
    client_temp_id = models.CharField(max_length=100, null=True, blank=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)


class NotificationPreference(models.Model):
    user                 = models.OneToOneField(User, on_delete=models.CASCADE, related_name='notification_prefs')
    email_notifications  = models.BooleanField(default=True)
    push_notifications   = models.BooleanField(default=True)
    marketing_updates    = models.BooleanField(default=False)


class Notification(models.Model):
    TYPE_CHOICES = [
        ('request',      'Request'),
        ('user',         'User'),
        ('system',       'System'),
        ('announcement', 'Announcement'),
        ('message',      'Message'),
    ]
    recipient  = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    title      = models.CharField(max_length=255)
    body       = models.TextField(blank=True, default='')
    type       = models.CharField(max_length=20, choices=TYPE_CHOICES, default='system')
    is_read    = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    link       = models.CharField(max_length=255, blank=True, default='')

    class Meta:
        ordering = ['-created_at']


class Announcement(models.Model):
    TARGET_CHOICES = [
        ('All Staff',         'All Staff'),
        ('All Collaborators', 'All Collaborators'),
    ]
    title      = models.CharField(max_length=255)
    message    = models.TextField()
    target     = models.CharField(max_length=50, choices=TARGET_CHOICES, default='All Staff')
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='announcements')
    created_at = models.DateTimeField(auto_now_add=True)
    is_active  = models.BooleanField(default=True)

    class Meta:
        ordering = ['-created_at']


class AuditLog(models.Model):
    timestamp  = models.DateTimeField(auto_now_add=True, db_index=True)
    user       = models.ForeignKey(
        'User', on_delete=models.SET_NULL, null=True, blank=True, related_name='audit_logs',
    )
    user_name  = models.CharField(max_length=255, blank=True, default='')
    email      = models.CharField(max_length=255, blank=True, default='')
    action     = models.CharField(max_length=100, db_index=True)
    resource   = models.CharField(max_length=255, blank=True, default='')
    ip_address = models.CharField(max_length=45, blank=True, default='')
    details    = models.TextField(blank=True, default='')
    metadata   = models.JSONField(null=True, blank=True)

    class Meta:
        ordering = ['-timestamp']


class VisitSchedule(models.Model):
    STATUS_CHOICES = [
        ('Upcoming',  'Upcoming'),
        ('Completed', 'Completed'),
        ('Cancelled', 'Cancelled'),
    ]
    PURPOSE_CHOICES = [
        ('Career Orientation',        'Career Orientation'),
        ('Career Guidance Seminar',   'Career Guidance Seminar'),
        ('Leaflet Distribution',      'Leaflet Distribution'),
        ('School Visit',              'School Visit'),
        ('Other',                     'Other'),
    ]
    school             = models.ForeignKey(School, on_delete=models.CASCADE, related_name='schedules')
    date               = models.DateField()
    start_time         = models.TimeField()
    end_time           = models.TimeField()
    purpose            = models.CharField(max_length=255, choices=PURPOSE_CHOICES, default='Career Orientation')
    assigned_personnel = models.ManyToManyField(
        'User', blank=True, related_name='assigned_schedules',
    )
    notes              = models.TextField(blank=True, default='')
    status             = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Upcoming')
    created_by         = models.ForeignKey(
        'User', on_delete=models.SET_NULL, null=True, blank=True, related_name='created_schedules',
    )
    created_at         = models.DateTimeField(auto_now_add=True)
    updated_at         = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['date', 'start_time']

    def __str__(self):
        return f"{self.school.school_name} — {self.date} ({self.status})"


class Document(models.Model):
    TYPE_CHOICES = [
        ('Report', 'Report'),
        ('Document', 'Document'),
        ('Memo', 'Memo'),
        ('Proposal', 'Proposal'),
    ]
    STATUS_CHOICES = [
        ('Draft', 'Draft'),
        ('Published', 'Published'),
        ('Archived', 'Archived'),
    ]
    title = models.CharField(max_length=255)
    type = models.CharField(max_length=50, choices=TYPE_CHOICES)
    content = models.TextField(blank=True, default='')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Draft')
    created_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, related_name='documents'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
