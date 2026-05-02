from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import path
from core.views import (
    # auth
    login_api,
    logout_api,
    register_api,
    profile_api,
    force_change_password_api,
    forgot_password_api,
    reset_password_api,
    # dashboard
    dashboard_api,
    dashboard_marketing_api,
    dashboard_trailblazing_api,
    dashboard_recent_activity_api,
    # users (Admin only)
    users_api,
    user_detail_api,
    # marketing requests
    marketing_requests_api,
    marketing_request_detail_api,
    request_attachments_api,
    # communication
    communication_logs_api,
    communication_log_detail_api,
    # trailblazing / schools (Staff + Admin)
    schools_api,
    school_detail_api,
    # documents & reports (Staff + Admin)
    documents_api,
    document_detail_api,
    # backup & restore (Admin only)
    backup_api,
    restore_api,
    # notifications
    notifications_list_api,
    notification_read_api,
    notifications_read_all_api,
    notification_prefs_api,
    notification_send_api,
    notification_test_email_api,
    announcements_api,
    # audit logs (Admin only)
    audit_logs_api,
)

urlpatterns = [
    path('admin/', admin.site.urls),

    # Auth
    path('api/login/', login_api),
    path('api/logout/', logout_api),
    path('api/register/', register_api),

    # Own profile / password change
    path('api/profile/', profile_api),
    path('api/profile/set-password/', force_change_password_api),

    # Password reset (unauthenticated)
    path('api/forgot-password/', forgot_password_api),
    path('api/reset-password/', reset_password_api),

    # Dashboard
    path('api/dashboard/',                  dashboard_api),
    path('api/dashboard/marketing/',        dashboard_marketing_api),
    path('api/dashboard/trailblazing/',     dashboard_trailblazing_api),
    path('api/dashboard/recent-activity/',  dashboard_recent_activity_api),

    # User Management
    path('api/users/', users_api),
    path('api/users/<int:user_id>/', user_detail_api),

    # Marketing Requests
    path('api/marketing/', marketing_requests_api),
    path('api/marketing/<int:request_id>/', marketing_request_detail_api),
    path('api/marketing/<int:request_id>/attachments/', request_attachments_api),

    # Communication Logs
    path('api/communications/', communication_logs_api),
    path('api/communications/<int:log_id>/', communication_log_detail_api),

    # Trailblazing / Schools
    path('api/schools/', schools_api),
    path('api/schools/<int:school_id>/', school_detail_api),

    # Documents & Reports
    path('api/documents/', documents_api),
    path('api/documents/<int:doc_id>/', document_detail_api),

    # Backup & Restore
    path('api/backup/', backup_api),
    path('api/restore/', restore_api),

    # Audit Logs
    path('api/audit-logs/', audit_logs_api),

    # Announcements
    path('api/announcements/', announcements_api),

    # Notifications
    path('api/notifications/', notifications_list_api),
    path('api/notifications/read-all/', notifications_read_all_api),
    path('api/notifications/prefs/', notification_prefs_api),
    path('api/notifications/send/', notification_send_api),
    path('api/notifications/test-email/', notification_test_email_api),
    path('api/notifications/<int:notif_id>/read/', notification_read_api),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
