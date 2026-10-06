from __future__ import annotations

from django.contrib.auth import get_user_model
from rest_framework import generics, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.views import APIView

from .exceptions import success_response
from .models import AuditLog, CandidateProfile, Role, Wing
from .serializers import (
    AuditLogSerializer,
    CandidateProfileSerializer,
    RegisterCandidateSerializer,
    RoleSerializer,
    UserSerializer,
    WingSerializer,
)
from .services import write_audit

User = get_user_model()


class MeView(APIView):
    def get(self, request):
        return success_response(UserSerializer(request.user).data)

    def patch(self, request):
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        # Only allow safe fields
        for field in ("first_name", "last_name", "email", "phone"):
            if field in serializer.validated_data:
                setattr(request.user, field, serializer.validated_data[field])
        request.user.save()
        profile_data = request.data.get("candidate_profile")
        if profile_data and hasattr(request.user, "candidate_profile"):
            ps = CandidateProfileSerializer(
                request.user.candidate_profile, data=profile_data, partial=True
            )
            ps.is_valid(raise_exception=True)
            ps.save()
        return success_response(UserSerializer(request.user).data, "Profile updated")


class RegisterCandidateView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = RegisterCandidateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        write_audit(
            actor=user,
            action="REGISTER",
            entity_type="User",
            entity_id=user.pk,
            detail={"cnic": user.cnic},
            ip_address=getattr(request, "client_ip", None),
        )
        return success_response(
            UserSerializer(user).data,
            "Candidate registered",
            status.HTTP_201_CREATED,
        )


class WingViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Wing.objects.all()
    serializer_class = WingSerializer
    permission_classes = [permissions.IsAuthenticated]


class RoleViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Role.objects.all()
    serializer_class = RoleSerializer
    permission_classes = [permissions.IsAuthenticated]


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AuditLog.objects.select_related("actor").all()
    serializer_class = AuditLogSerializer
    filterset_fields = ["entity_type", "action"]
    search_fields = ["entity_id", "actor__username"]

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        ser = self.get_serializer(page or queryset, many=True)
        data = self.get_paginated_response(ser.data).data if page is not None else ser.data
        return success_response(data)


class CandidateProfileUpdateView(generics.RetrieveUpdateAPIView):
    serializer_class = CandidateProfileSerializer

    def get_object(self):
        profile, _ = CandidateProfile.objects.get_or_create(user=self.request.user)
        return profile

    def retrieve(self, request, *args, **kwargs):
        return success_response(self.get_serializer(self.get_object()).data)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return success_response(serializer.data, "Profile updated")
