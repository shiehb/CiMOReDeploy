import hashlib

from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed


class SecureTokenAuthentication(BaseAuthentication):
    """
    Custom bearer-token authentication with the following security properties:

    1. Token expiration  — tokens are valid for 24 hours (enforced at the DB level
                           via SecureToken.expires_at); expired tokens are deleted
                           on first use so the table stays clean.

    2. Hashed storage    — only the SHA-256 digest of the raw token is stored in the
                           database.  The raw value is never written to disk.

    3. Header format     — identical to DRF's built-in TokenAuthentication so no
                           frontend changes are required:
                               Authorization: Token <raw_token>
    """

    keyword = "Token"

    def authenticate(self, request):
        auth_header = request.META.get("HTTP_AUTHORIZATION", "")
        parts = auth_header.split()

        # No auth header — let other authenticators (or AllowAny) handle it.
        if not parts:
            return None

        if parts[0].lower() != self.keyword.lower():
            return None

        if len(parts) != 2:
            raise AuthenticationFailed(
                "Invalid token header. Expected: 'Authorization: Token <value>'."
            )

        return self._authenticate_credentials(parts[1])

    def _authenticate_credentials(self, raw_token: str):
        from .models import SecureToken  # local import avoids circular dependency

        token_hash = hashlib.sha256(raw_token.encode()).hexdigest()

        try:
            token_obj = (
                SecureToken.objects
                .select_related("user")
                .get(token_hash=token_hash)
            )
        except SecureToken.DoesNotExist:
            raise AuthenticationFailed("Invalid token.")

        if not token_obj.is_valid():
            # Proactively clean up expired row so the table never accumulates stale tokens.
            token_obj.delete()
            raise AuthenticationFailed(
                "Token has expired. Please log in again."
            )

        if not token_obj.user.is_active:
            raise AuthenticationFailed("This account has been deactivated.")

        return (token_obj.user, token_obj)

    def authenticate_header(self, request):
        # Returned in the WWW-Authenticate header when the client sends no credentials.
        return self.keyword
