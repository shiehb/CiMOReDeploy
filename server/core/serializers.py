from rest_framework import serializers
from .models import School, MarketingRequest, RequestAttachment, CommunicationLog, Document, User


class SchoolSerializer(serializers.ModelSerializer):
    class Meta:
        model = School
        fields = '__all__'


class RequestAttachmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = RequestAttachment
        fields = ['id', 'file', 'original_name', 'uploaded_at']
        read_only_fields = ['uploaded_at']


class MarketingRequestSerializer(serializers.ModelSerializer):
    requester_name = serializers.SerializerMethodField()
    attachments = RequestAttachmentSerializer(many=True, read_only=True)

    class Meta:
        model = MarketingRequest
        fields = [
            'id', 'requester', 'requester_name', 'title', 'type', 'request_type',
            'description', 'preferred_date', 'status', 'notes', 'reviewed_by',
            'is_draft',
            # Production fields
            'requesting_unit', 'expected_medium', 'event_description', 'event_objectives',
            'audience', 'event_date', 'event_venue', 'materials_endorsed',
            # Information Dissemination fields
            'platform', 'writers', 'keywords',
            # Outcome fields
            'accomplishment_date', 'involved_members',
            'created_at', 'updated_at', 'attachments',
        ]
        read_only_fields = ['created_at', 'updated_at']

    def get_requester_name(self, obj):
        full_name = f"{obj.requester.first_name} {obj.requester.last_name}".strip()
        return full_name if full_name else obj.requester.username


class CommunicationLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = CommunicationLog
        fields = '__all__'
        read_only_fields = ['created_at']


class DocumentSerializer(serializers.ModelSerializer):
    created_by_name = serializers.SerializerMethodField()

    class Meta:
        model = Document
        fields = [
            'id', 'title', 'type', 'content', 'status',
            'created_by', 'created_by_name', 'created_at', 'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at']

    def get_created_by_name(self, obj):
        if not obj.created_by:
            return None
        full_name = f"{obj.created_by.first_name} {obj.created_by.last_name}".strip()
        return full_name if full_name else obj.created_by.username

    def get_avatar_url(self, obj):
        if not obj.avatar:
            return None
        request = self.context.get('request') if hasattr(self, 'context') else None
        url = obj.avatar.url
        return request.build_absolute_uri(url) if request else url


class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False)
    avatar_url = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'username', 'first_name', 'last_name', 'email',
            'role', 'is_active', 'last_login', 'date_joined', 'password',
            'must_change_password', 'temp_password_expires_at', 'email_delivered',
            'department', 'id_number', 'avatar_url',
        ]
        extra_kwargs = {
            'password': {'write_only': True},
            'must_change_password': {'read_only': True},
            'temp_password_expires_at': {'read_only': True},
            'email_delivered': {'read_only': True},
        }
    def get_avatar_url(self, obj):
        if not obj.avatar:
            return None
        request = self.context.get('request') if hasattr(self, 'context') else None
        url = obj.avatar.url
        return request.build_absolute_uri(url) if request else url