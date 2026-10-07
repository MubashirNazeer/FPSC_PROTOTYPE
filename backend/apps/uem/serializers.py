from rest_framework import serializers

from .models import (
    Correspondence,
    ExamType,
    Marksheet,
    MeritList,
    PreExamReport,
    QuotaRoster,
    ScheduleSlot,
    UEMExamInstance,
    UEMRequisition,
)


class ExamTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExamType
        fields = "__all__"


class UEMExamInstanceSerializer(serializers.ModelSerializer):
    exam_type_name = serializers.CharField(source="exam_type.name", read_only=True)
    exam_type_code = serializers.CharField(source="exam_type.code", read_only=True)

    class Meta:
        model = UEMExamInstance
        fields = "__all__"


class UEMRequisitionSerializer(serializers.ModelSerializer):
    class Meta:
        model = UEMRequisition
        fields = "__all__"


class QuotaRosterSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuotaRoster
        fields = "__all__"


class PreExamReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = PreExamReport
        fields = "__all__"
        read_only_fields = ("generated_by",)


class MarksheetSerializer(serializers.ModelSerializer):
    candidate_name = serializers.SerializerMethodField()

    class Meta:
        model = Marksheet
        fields = "__all__"

    def get_candidate_name(self, obj):
        u = obj.application.candidate
        return u.get_full_name() or u.username


class ScheduleSlotSerializer(serializers.ModelSerializer):
    class Meta:
        model = ScheduleSlot
        fields = "__all__"


class MeritListSerializer(serializers.ModelSerializer):
    class Meta:
        model = MeritList
        fields = "__all__"


class CorrespondenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Correspondence
        fields = "__all__"
        read_only_fields = ("created_by",)
