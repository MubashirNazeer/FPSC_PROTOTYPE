from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import ExamSessionViewSet, ExamSittingViewSet

router = DefaultRouter()
router.register("sittings", ExamSittingViewSet, basename="sitting")
router.register("sessions", ExamSessionViewSet, basename="session")

urlpatterns = [path("cbt/", include(router.urls))]
