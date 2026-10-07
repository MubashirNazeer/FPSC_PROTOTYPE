from rest_framework import viewsets
from rest_framework.decorators import action

from apps.accounts.exceptions import success_response
from apps.accounts.permissions import IsStaffUser

from .models import NotificationOutbox, NotificationTemplate
from .serializers import NotificationOutboxSerializer, NotificationTemplateSerializer
from .services import queue_notification


class NotificationOutboxViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = NotificationOutboxSerializer
    filterset_fields = ["channel", "status", "template_code"]

    def get_queryset(self):
        qs = NotificationOutbox.objects.all().order_by("-created_at")
        user = self.request.user
        if user.is_staff or user.has_role("IT", "ADMIN"):
            return qs
        return qs.filter(user=user)

    def list(self, request, *args, **kwargs):
        qs = self.filter_queryset(self.get_queryset())[:200]
        return success_response(self.get_serializer(qs, many=True).data)


class NotificationTemplateViewSet(viewsets.ModelViewSet):
    queryset = NotificationTemplate.objects.all()
    serializer_class = NotificationTemplateSerializer
    permission_classes = [IsStaffUser]
    lookup_field = "code"

    def list(self, request, *args, **kwargs):
        return success_response(self.get_serializer(self.get_queryset(), many=True).data)

    def create(self, request, *args, **kwargs):
        ser = self.get_serializer(data=request.data)
        ser.is_valid(raise_exception=True)
        obj = ser.save()
        return success_response(self.get_serializer(obj).data, "Template saved", 201)

    @action(detail=True, methods=["post"])
    def send_test(self, request, code=None):
        tpl = self.get_object()
        body = tpl.body.format(
            name=request.user.get_full_name() or request.user.username,
            tracking_id="TEST-000",
            exam="Demo Exam",
        )
        note = queue_notification(
            user=request.user,
            channel=tpl.channel,
            template_code=tpl.code,
            subject=tpl.subject,
            body=body,
            context={"test": True},
        )
        return success_response(
            NotificationOutboxSerializer(note).data, "Test notification queued"
        )
