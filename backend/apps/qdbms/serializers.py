from rest_framework import serializers

from .models import ExamPaper, PaperBlueprint, Question, QuestionVersion, TaxonomyNode


class TaxonomyNodeSerializer(serializers.ModelSerializer):
    class Meta:
        model = TaxonomyNode
        fields = "__all__"


class QuestionSerializer(serializers.ModelSerializer):
    taxonomy_name = serializers.CharField(source="taxonomy.name", read_only=True)

    class Meta:
        model = Question
        fields = "__all__"
        read_only_fields = (
            "author",
            "reviewer",
            "approver",
            "version",
            "usage_count",
            "facility_index",
            "discrimination_index",
        )


class QuestionVersionSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuestionVersion
        fields = "__all__"


class PaperBlueprintSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaperBlueprint
        fields = "__all__"
        read_only_fields = ("created_by",)


class ExamPaperSerializer(serializers.ModelSerializer):
    question_ids = serializers.PrimaryKeyRelatedField(
        source="questions", many=True, queryset=Question.objects.all(), required=False
    )

    class Meta:
        model = ExamPaper
        fields = (
            "id",
            "title",
            "blueprint",
            "question_ids",
            "status",
            "authorizer_one",
            "authorizer_two",
            "created_by",
            "created_at",
        )
        read_only_fields = ("authorizer_one", "authorizer_two", "created_by", "status")
