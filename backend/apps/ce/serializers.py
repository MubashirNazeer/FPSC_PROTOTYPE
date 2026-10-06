from rest_framework import serializers

from .models import CECandidateProgress, CEScheduleEvent, CompetitiveExamCycle, ExaminerPanel


class ExaminerPanelSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExaminerPanel
        fields = "__all__"


class CEScheduleEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = CEScheduleEvent
        fields = "__all__"


class CECandidateProgressSerializer(serializers.ModelSerializer):
    candidate_name = serializers.SerializerMethodField()

    class Meta:
        model = CECandidateProgress
        fields = "__all__"

    def get_candidate_name(self, obj):
        return obj.candidate.get_full_name() or obj.candidate.username


class CompetitiveExamCycleSerializer(serializers.ModelSerializer):
    panels = ExaminerPanelSerializer(many=True, read_only=True)
    events = CEScheduleEventSerializer(many=True, read_only=True)
    phase_display = serializers.CharField(source="get_phase_display", read_only=True)

    class Meta:
        model = CompetitiveExamCycle
        fields = "__all__"
