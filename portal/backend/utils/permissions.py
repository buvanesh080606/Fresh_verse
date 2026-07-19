from rest_framework import permissions

class IsAdminUserRole(permissions.BasePermission):
    """
    Allows access only to approved admin users.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            request.user.role == 'admin' and
            (request.user.is_superadmin or request.user.is_approved_admin)
        )

class IsStudentUserRole(permissions.BasePermission):
    """
    Allows access only to approved student users.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            request.user.role == 'student' and
            request.user.is_approved
        )

class IsApprovedUser(permissions.BasePermission):
    """
    Allows access only to approved users (approved students or approved/superadmin admins).
    """
    def has_permission(self, request, view):
        user = request.user
        if not (user and user.is_authenticated):
            return False
        if user.role == 'student':
            return user.is_approved
        if user.role == 'admin':
            return user.is_superadmin or user.is_approved_admin
        return False

class IsSuperAdminUser(permissions.BasePermission):
    """
    Allows access only to superadmins.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            request.user.is_superadmin
        )
