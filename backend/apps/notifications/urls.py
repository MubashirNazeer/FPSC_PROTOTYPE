from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import NotificationOutboxViewSet, NotificationTemplateViewSet

router = DefaultRouter()
router.register("notifications", NotificationOutboxViewSet, basename="notification")
router.register(
    "notification-templates", NotificationTemplateViewSet, basename="notification-template"
)

urlpatterns = [path("", include(router.urls))]
