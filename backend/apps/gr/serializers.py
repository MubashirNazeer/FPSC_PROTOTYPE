from rest_framework import serializers

from .models import (
    AdmitCard,
    Advertisement,
    Application,
    ExamCentre,
    InterviewPanel,
    Nomination,
    Requisition,
)


class RequisitionSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = Requisition
        fields = "__all__"
        read_only_fields = ("created_by", "case", "created_at", "updated_at")


class AdvertisementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Advertisement
        fields = "__all__"


class ExamCentreSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExamCentre
        fields = "__all__"


class ApplicationSerializer(serializers.ModelSerializer):
    candidate_name = serializers.SerializerMethodField()
    advertisement_title = serializers.CharField(
        source="advertisement.title", read_only=True
    )

    class Meta:
        model = Application
        fields = "__all__"
        read_only_fields = (
            "candidate",
            "tracking_id",
            "roll_number",
            "fee_paid",
            "payment_ref",
            "score",
            "created_at",
        )

    def get_candidate_name(self, obj):
        return obj.candidate.get_full_name() or obj.candidate.username


class AdmitCardSerializer(serializers.ModelSerializer):
    centre = ExamCentreSerializer(read_only=True)
    roll_number = serializers.CharField(source="application.roll_number", read_only=True)
    candidate_name = serializers.SerializerMethodField()
    post_title = serializers.SerializerMethodField()

    class Meta:
        model = AdmitCard
        fields = "__all__"

    def get_candidate_name(self, obj):
        u = obj.application.candidate
        return u.get_full_name() or u.username

    def get_post_title(self, obj):
        if obj.application.requisition:
            return obj.application.requisition.post_title
        return obj.application.advertisement.title


class InterviewPanelSerializer(serializers.ModelSerializer):
    class Meta:
        model = InterviewPanel
        fields = "__all__"


class NominationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Nomination
        fields = "__all__"


class ApplySerializer(serializers.Serializer):
    advertisement_id = serializers.IntegerField()
    requisition_id = serializers.IntegerField(required=False, allow_null=True)
    documents = serializers.DictField(required=False)


class AdvanceRequisitionSerializer(serializers.Serializer):
    note = serializers.CharField(required=False, allow_blank=True)
