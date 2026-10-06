from django.contrib.auth import get_user_model
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated

from apps.accounts.exceptions import success_response

from .models import CaseComment, CaseInstance, WorkflowDefinition
from .serializers import (
    CaseCommentSerializer,
    CaseInstanceSerializer,
    TransitionSerializer,
    WorkflowDefinitionSerializer,
)
from .services import transition_case

User = get_user_model()


class WorkflowDefinitionViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = WorkflowDefinition.objects.prefetch_related("states", "transitions").all()
    serializer_class = WorkflowDefinitionSerializer
    lookup_field = "code"


class CaseInstanceViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = CaseInstance.objects.select_related(
        "workflow", "current_state", "created_by"
    ).prefetch_related("transition_logs", "comments")
    serializer_class = CaseInstanceSerializer
    filterset_fields = ["reference_type", "workflow__code", "current_state__code"]
    search_fields = ["title", "reference_id"]

    def list(self, request, *args, **kwargs):
        qs = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(qs)
        ser = self.get_serializer(page or qs, many=True)
        data = self.get_paginated_response(ser.data).data if page is not None else ser.data
        return success_response(data)

    def retrieve(self, request, *args, **kwargs):
        return success_response(self.get_serializer(self.get_object()).data)

    @action(detail=True, methods=["post"])
    def transition(self, request, pk=None):
        case = self.get_object()
        ser = TransitionSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        co = None
        if ser.validated_data.get("co_approver_id"):
            co = User.objects.filter(pk=ser.validated_data["co_approver_id"]).first()
        transition_case(
            case=case,
            to_state_code=ser.validated_data["to_state_code"],
            actor=request.user,
            note=ser.validated_data.get("note", ""),
            co_approver=co,
        )
        case.refresh_from_db()
        return success_response(CaseInstanceSerializer(case).data, "Transition applied")

    @action(detail=True, methods=["post"])
    def comments(self, request, pk=None):
        case = self.get_object()
        ser = CaseCommentSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        comment = CaseComment.objects.create(
            case=case, author=request.user, body=ser.validated_data["body"]
        )
        return success_response(CaseCommentSerializer(comment).data, "Comment added", 201)
