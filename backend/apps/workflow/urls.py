from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import CaseInstanceViewSet, WorkflowDefinitionViewSet

router = DefaultRouter()
router.register("workflows", WorkflowDefinitionViewSet, basename="workflow")
router.register("cases", CaseInstanceViewSet, basename="case")

urlpatterns = [path("", include(router.urls))]
