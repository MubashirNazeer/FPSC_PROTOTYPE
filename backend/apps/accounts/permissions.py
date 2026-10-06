from __future__ import annotations

from rest_framework.permissions import BasePermission, SAFE_METHODS


class HasRole(BasePermission):
    """Require one of the listed role codes (or superuser)."""

    allowed_roles: tuple[str, ...] = ()

    def has_permission(self, request, view) -> bool:
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if user.is_superuser:
            return True
        roles = getattr(view, "allowed_roles", None) or self.allowed_roles
        if not roles:
            return True
        return user.has_role(*roles)


class IsCandidate(BasePermission):
    def has_permission(self, request, view) -> bool:
        user = request.user
        return bool(
            user
            and user.is_authenticated
            and (user.is_superuser or user.has_role("CANDIDATE"))
        )


class IsStaffUser(BasePermission):
    def has_permission(self, request, view) -> bool:
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if user.is_superuser or user.is_staff:
            return True
        return user.roles.filter(is_staff_role=True).exists()


class ReadOnlyOrStaff(BasePermission):
    def has_permission(self, request, view) -> bool:
        if request.method in SAFE_METHODS:
            return True
        user = request.user
        return bool(user and user.is_authenticated and (user.is_staff or user.is_superuser))
