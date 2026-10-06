from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    ExamPaperViewSet,
    PaperBlueprintViewSet,
    QuestionViewSet,
    TaxonomyNodeViewSet,
)

router = DefaultRouter()
router.register("taxonomy", TaxonomyNodeViewSet, basename="taxonomy")
router.register("questions", QuestionViewSet, basename="question")
router.register("blueprints", PaperBlueprintViewSet, basename="blueprint")
router.register("papers", ExamPaperViewSet, basename="paper")

urlpatterns = [path("", include(router.urls))]
