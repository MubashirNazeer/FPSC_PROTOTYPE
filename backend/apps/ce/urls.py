from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    CECandidateProgressViewSet,
    CEScheduleEventViewSet,
    CompetitiveExamCycleViewSet,
    ExaminerPanelViewSet,
)

router = DefaultRouter()
router.register("ce-cycles", CompetitiveExamCycleViewSet, basename="ce-cycle")
router.register("ce-panels", ExaminerPanelViewSet, basename="ce-panel")
router.register("ce-progress", CECandidateProgressViewSet, basename="ce-progress")
router.register("ce-events", CEScheduleEventViewSet, basename="ce-event")

urlpatterns = [path("", include(router.urls))]
