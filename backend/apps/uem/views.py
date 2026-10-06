from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError

from apps.accounts.exceptions import success_response
from apps.accounts.permissions import IsStaffUser
from apps.workflow.services import start_case

from .models import ExamType, UEMExamInstance
from .serializers import ExamTypeSerializer, UEMExamInstanceSerializer


class ExamTypeViewSet(viewsets.ModelViewSet):
    queryset = ExamType.objects.all()
    serializer_class = ExamTypeSerializer
    permission_classes = [IsStaffUser]

    def list(self, request, *args, **kwargs):
        return success_response(self.get_serializer(self.get_queryset(), many=True).data)

    def create(self, request, *args, **kwargs):
        ser = self.get_serializer(data=request.data)
        ser.is_valid(raise_exception=True)
        obj = ser.save()
        return success_response(self.get_serializer(obj).data, "Exam type created", 201)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        ser = self.get_serializer(instance, data=request.data, partial=partial)
        ser.is_valid(raise_exception=True)
        ser.save()
        return success_response(ser.data, "Updated")


class UEMExamInstanceViewSet(viewsets.ModelViewSet):
    queryset = UEMExamInstance.objects.select_related("exam_type").all()
    serializer_class = UEMExamInstanceSerializer
    permission_classes = [IsStaffUser]
    filterset_fields = ["exam_type", "current_stage"]

    def list(self, request, *args, **kwargs):
        qs = self.filter_queryset(self.get_queryset())
        return success_response(self.get_serializer(qs, many=True).data)

    def create(self, request, *args, **kwargs):
        ser = self.get_serializer(data=request.data)
        ser.is_valid(raise_exception=True)
        exam_type = ser.validated_data["exam_type"]
        stages = exam_type.stages or ["START", "END"]
        obj = ser.save(current_stage=stages[0])
        case = start_case(
            workflow_code="UEM_GENERIC",
            reference_type="UEMExamInstance",
            reference_id=obj.pk,
            title=obj.title,
            created_by=request.user,
            metadata={"exam_type": exam_type.code},
        )
        obj.case = case
        obj.save(update_fields=["case"])
        return success_response(UEMExamInstanceSerializer(obj).data, "Created", 201)

    @action(detail=True, methods=["post"])
    def advance_stage(self, request, pk=None):
        inst = self.get_object()
        stages = inst.exam_type.stages or []
        if inst.current_stage not in stages:
            raise ValidationError("Current stage not in exam type definition.")
        idx = stages.index(inst.current_stage)
        if idx >= len(stages) - 1:
            raise ValidationError("Already at final stage.")
        inst.current_stage = stages[idx + 1]
        inst.save(update_fields=["current_stage"])
        return success_response(UEMExamInstanceSerializer(inst).data, "Stage advanced")
