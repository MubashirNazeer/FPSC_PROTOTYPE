from rest_framework import viewsets
from rest_framework.decorators import action

from apps.accounts.exceptions import success_response
from apps.accounts.permissions import IsStaffUser

from .models import CECandidateProgress, CEScheduleEvent, CompetitiveExamCycle, ExaminerPanel
from .serializers import (
    CECandidateProgressSerializer,
    CEScheduleEventSerializer,
    CompetitiveExamCycleSerializer,
    ExaminerPanelSerializer,
)
from .services import advance_cycle, allocate_groups, create_cycle


class CompetitiveExamCycleViewSet(viewsets.ModelViewSet):
    queryset = CompetitiveExamCycle.objects.prefetch_related("panels", "events").all()
    serializer_class = CompetitiveExamCycleSerializer
    permission_classes = [IsStaffUser]
    filterset_fields = ["phase", "year"]

    def list(self, request, *args, **kwargs):
        return success_response(
            self.get_serializer(self.filter_queryset(self.get_queryset()), many=True).data
        )

    def retrieve(self, request, *args, **kwargs):
        return success_response(self.get_serializer(self.get_object()).data)

    def create(self, request, *args, **kwargs):
        cycle = create_cycle(
            year=request.data.get("year"),
            title=request.data.get("title", f"CSS {request.data.get('year')}"),
            user=request.user,
        )
        return success_response(CompetitiveExamCycleSerializer(cycle).data, "Created", 201)

    @action(detail=True, methods=["post"])
    def advance(self, request, pk=None):
        cycle = advance_cycle(
            cycle=self.get_object(), user=request.user, note=request.data.get("note", "")
        )
        return success_response(CompetitiveExamCycleSerializer(cycle).data, "Advanced")

    @action(detail=True, methods=["post"])
    def allocate(self, request, pk=None):
        n = allocate_groups(cycle=self.get_object(), user=request.user)
        return success_response({"allocated": n}, "Groups allocated")


class ExaminerPanelViewSet(viewsets.ModelViewSet):
    queryset = ExaminerPanel.objects.all()
    serializer_class = ExaminerPanelSerializer
    permission_classes = [IsStaffUser]

    def list(self, request, *args, **kwargs):
        return success_response(self.get_serializer(self.get_queryset(), many=True).data)

    def create(self, request, *args, **kwargs):
        ser = self.get_serializer(data=request.data)
        ser.is_valid(raise_exception=True)
        obj = ser.save()
        return success_response(self.get_serializer(obj).data, "Created", 201)

    @action(detail=True, methods=["post"])
    def approve(self, request, pk=None):
        from django.utils import timezone

        panel = self.get_object()
        panel.commission_approved = True
        panel.approved_at = timezone.now()
        panel.save(update_fields=["commission_approved", "approved_at"])
        return success_response(
            ExaminerPanelSerializer(panel).data, "Panel commission-approved"
        )


class CECandidateProgressViewSet(viewsets.ModelViewSet):
    queryset = CECandidateProgress.objects.select_related("candidate", "cycle").all()
    serializer_class = CECandidateProgressSerializer
    permission_classes = [IsStaffUser]
    filterset_fields = ["cycle", "mpt_passed", "allocated_group"]

    def list(self, request, *args, **kwargs):
        qs = self.filter_queryset(self.get_queryset())
        return success_response(self.get_serializer(qs, many=True).data)

    def create(self, request, *args, **kwargs):
        ser = self.get_serializer(data=request.data)
        ser.is_valid(raise_exception=True)
        obj = ser.save()
        return success_response(self.get_serializer(obj).data, "Created", 201)

    def partial_update(self, request, *args, **kwargs):
        instance = self.get_object()
        ser = self.get_serializer(instance, data=request.data, partial=True)
        ser.is_valid(raise_exception=True)
        ser.save()
        return success_response(ser.data, "Updated")


class CEScheduleEventViewSet(viewsets.ModelViewSet):
    queryset = CEScheduleEvent.objects.all()
    serializer_class = CEScheduleEventSerializer
    permission_classes = [IsStaffUser]

    def list(self, request, *args, **kwargs):
        return success_response(self.get_serializer(self.get_queryset(), many=True).data)

    def create(self, request, *args, **kwargs):
        ser = self.get_serializer(data=request.data)
        ser.is_valid(raise_exception=True)
        obj = ser.save()
        return success_response(self.get_serializer(obj).data, "Created", 201)
