from rest_framework import viewsets

from apps.accounts.exceptions import success_response

from .models import NotificationOutbox
from .serializers import NotificationOutboxSerializer


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
        qs = self.filter_queryset(self.get_queryset())[:100]
        return success_response(self.get_serializer(qs, many=True).data)
