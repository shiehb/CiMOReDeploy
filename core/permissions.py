from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsAdmin(BasePermission):
    """Full access — Admin only."""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'Admin'


class IsAdminOrStaff(BasePermission):
    """Access for Admin and Staff."""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ('Admin', 'Staff')


class IsCollaborator(BasePermission):
    """Access for Collaborators only."""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'Collaborator'


class IsAdminStaffOrCollaborator(BasePermission):
    """Any authenticated user regardless of role."""
    def has_permission(self, request, view):
        return request.user.is_authenticated
