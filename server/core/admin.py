from django.contrib import admin
from django.utils.html import format_html

from .models import Announcement, CommunicationLog, Document, MarketingRequest, School, SecureToken, User


# ---------------------------------------------------------------------------
# SecureToken — superuser-only, read-only, raw token never displayed
# ---------------------------------------------------------------------------

@admin.register(SecureToken)
class SecureTokenAdmin(admin.ModelAdmin):
    """
    Security rules enforced here:

    - Only superusers may access this section at all (view, change, delete).
    - The add form is disabled — tokens are created exclusively via the API.
    - The change form is fully read-only — no field can be edited through admin.
    - The token_hash field is rendered as a truncated, non-copyable excerpt so
      admins can confirm a row exists without exposing the full digest.
    - The raw token is NEVER stored, so it cannot appear here.
    """

    list_display  = ("user", "created_at", "expires_at", "status_badge")
    list_filter   = ("created_at",)
    search_fields = ("user__username", "user__email", "user__first_name", "user__last_name")
    ordering      = ("-created_at",)

    # All fields are read-only; the hash is shown truncated via a custom method.
    readonly_fields = ("user", "hash_preview", "created_at", "expires_at")
    fields          = ("user", "hash_preview", "created_at", "expires_at")

    # ---------------------------------------------------------------- display helpers

    @admin.display(description="Token hash (preview)")
    def hash_preview(self, obj):
        """Show only the first 12 chars of the digest — enough to verify uniqueness."""
        return format_html(
            '<code style="letter-spacing:.05em">{}&hellip;</code>',
            obj.token_hash[:12],
        )

    @admin.display(description="Status")
    def status_badge(self, obj):
        if obj.is_valid():
            return format_html('<span style="color:green;font-weight:bold">&#10003; Valid</span>')
        return format_html('<span style="color:#b00;font-weight:bold">&#10007; Expired</span>')

    # ---------------------------------------------------------------- permission overrides

    def has_module_perms(self, request):
        return request.user.is_superuser

    def has_view_permission(self, request, obj=None):
        return request.user.is_superuser

    def has_add_permission(self, request):
        # Tokens are only ever minted through the API.
        return False

    def has_change_permission(self, request, obj=None):
        # Token metadata must not be editable through the admin.
        return False

    def has_delete_permission(self, request, obj=None):
        # Superusers may revoke a token by deleting the row.
        return request.user.is_superuser


# ---------------------------------------------------------------------------
# Other models — plain registration (unchanged behaviour)
# ---------------------------------------------------------------------------

admin.site.register(User)
admin.site.register(School)
admin.site.register(MarketingRequest)
admin.site.register(CommunicationLog)
admin.site.register(Document)
admin.site.register(Announcement)
