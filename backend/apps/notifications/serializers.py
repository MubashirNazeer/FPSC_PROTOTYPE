from rest_framework import serializers

from .models import NotificationOutbox


class NotificationOutboxSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationOutbox
        fields = "__all__"
