from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    AuditLogViewSet,
    CandidateProfileUpdateView,
    MeView,
    RegisterCandidateView,
    RoleViewSet,
    WingViewSet,
)

router = DefaultRouter()
router.register("wings", WingViewSet, basename="wing")
router.register("roles", RoleViewSet, basename="role")
router.register("audit-logs", AuditLogViewSet, basename="audit-log")

urlpatterns = [
    path("auth/me/", MeView.as_view(), name="me"),
    path("auth/register/", RegisterCandidateView.as_view(), name="register"),
    path("auth/profile/", CandidateProfileUpdateView.as_view(), name="profile"),
    path("", include(router.urls)),
]
