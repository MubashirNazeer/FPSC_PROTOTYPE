from rest_framework import serializers

from .models import NotificationOutbox, NotificationTemplate


class NotificationOutboxSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationOutbox
        fields = "__all__"


class NotificationTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationTemplate
        fields = "__all__"
