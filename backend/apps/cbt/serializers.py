from rest_framework import serializers

from apps.qdbms.models import Question

from .models import ExamSession, ExamSitting


class ExamSittingSerializer(serializers.ModelSerializer):
    paper_title = serializers.CharField(source="paper.title", read_only=True)

    class Meta:
        model = ExamSitting
        fields = "__all__"
        read_only_fields = ("package_hash", "decryption_key_hint")


class ExamSessionSerializer(serializers.ModelSerializer):
    candidate_name = serializers.SerializerMethodField()
    seconds_remaining = serializers.IntegerField(read_only=True)
    sitting_title = serializers.CharField(source="sitting.title", read_only=True)

    class Meta:
        model = ExamSession
        fields = "__all__"
        read_only_fields = (
            "question_order",
            "option_orders",
            "score",
            "started_at",
            "submitted_at",
        )

    def get_candidate_name(self, obj):
        return obj.candidate.get_full_name() or obj.candidate.username


class CandidateExamPayloadSerializer(serializers.Serializer):
    session = ExamSessionSerializer()
    questions = serializers.ListField()


def build_candidate_questions(session: ExamSession) -> list[dict]:
    """Return questions without revealing correct answers."""
    qs = {
        q.pk: q
        for q in Question.objects.filter(pk__in=session.question_order)
    }
    payload = []
    for qid in session.question_order:
        q = qs.get(qid)
        if not q:
            continue
        opts = session.option_orders.get(str(qid)) or q.options
        payload.append(
            {
                "id": q.pk,
                "stem": q.stem,
                "qtype": q.qtype,
                "options": opts,
                "flagged": str(qid) in (session.flagged or []),
                "answer": (session.answers or {}).get(str(qid)),
            }
        )
    return payload
