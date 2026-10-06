from rest_framework import serializers

from .models import ExamType, UEMExamInstance


class ExamTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExamType
        fields = "__all__"


class UEMExamInstanceSerializer(serializers.ModelSerializer):
    exam_type_name = serializers.CharField(source="exam_type.name", read_only=True)

    class Meta:
        model = UEMExamInstance
        fields = "__all__"
