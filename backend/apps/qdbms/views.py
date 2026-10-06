import csv
import io

from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser

from apps.accounts.exceptions import success_response
from apps.accounts.permissions import IsStaffUser

from .models import ExamPaper, PaperBlueprint, Question, TaxonomyNode
from .serializers import (
    ExamPaperSerializer,
    PaperBlueprintSerializer,
    QuestionSerializer,
    TaxonomyNodeSerializer,
)
from .services import (
    advance_question_status,
    dual_authorize_paper,
    generate_paper,
    snapshot_question,
)


class TaxonomyNodeViewSet(viewsets.ModelViewSet):
    queryset = TaxonomyNode.objects.all()
    serializer_class = TaxonomyNodeSerializer
    permission_classes = [IsStaffUser]

    def list(self, request, *args, **kwargs):
        return success_response(self.get_serializer(self.get_queryset(), many=True).data)

    def create(self, request, *args, **kwargs):
        ser = self.get_serializer(data=request.data)
        ser.is_valid(raise_exception=True)
        obj = ser.save()
        return success_response(self.get_serializer(obj).data, "Created", 201)


class QuestionViewSet(viewsets.ModelViewSet):
    queryset = Question.objects.select_related("taxonomy", "author").all()
    serializer_class = QuestionSerializer
    permission_classes = [IsStaffUser]
    filterset_fields = ["status", "qtype", "difficulty", "taxonomy"]
    search_fields = ["stem"]

    def list(self, request, *args, **kwargs):
        qs = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(qs)
        ser = self.get_serializer(page or qs, many=True)
        data = self.get_paginated_response(ser.data).data if page is not None else ser.data
        return success_response(data)

    def retrieve(self, request, *args, **kwargs):
        return success_response(self.get_serializer(self.get_object()).data)

    def create(self, request, *args, **kwargs):
        ser = self.get_serializer(data=request.data)
        ser.is_valid(raise_exception=True)
        obj = ser.save(author=request.user)
        snapshot_question(obj, request.user)
        return success_response(self.get_serializer(obj).data, "Created", 201)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        ser = self.get_serializer(instance, data=request.data, partial=partial)
        ser.is_valid(raise_exception=True)
        snapshot_question(instance, request.user)
        instance.version += 1
        obj = ser.save()
        return success_response(self.get_serializer(obj).data, "Updated")

    @action(detail=True, methods=["post"])
    def advance(self, request, pk=None):
        q = advance_question_status(question=self.get_object(), user=request.user)
        return success_response(QuestionSerializer(q).data, "Status advanced")

    @action(detail=False, methods=["post"], parser_classes=[MultiPartParser])
    def bulk_import(self, request):
        f = request.FILES.get("file")
        if not f:
            return success_response({}, "No file", 400)
        decoded = f.read().decode("utf-8")
        reader = csv.DictReader(io.StringIO(decoded))
        created = 0
        for row in reader:
            options = [
                row.get("option_a", ""),
                row.get("option_b", ""),
                row.get("option_c", ""),
                row.get("option_d", ""),
            ]
            Question.objects.create(
                stem=row.get("stem", ""),
                qtype=Question.QType.MCQ_SINGLE,
                options=[{"key": k, "text": t} for k, t in zip("ABCD", options)],
                correct_answer={"key": row.get("correct", "A")},
                difficulty=int(row.get("difficulty", 3)),
                author=request.user,
                status=Question.Status.DRAFT,
            )
            created += 1
        return success_response({"created": created}, f"Imported {created} questions")


class PaperBlueprintViewSet(viewsets.ModelViewSet):
    queryset = PaperBlueprint.objects.all()
    serializer_class = PaperBlueprintSerializer
    permission_classes = [IsStaffUser]

    def list(self, request, *args, **kwargs):
        return success_response(self.get_serializer(self.get_queryset(), many=True).data)

    def create(self, request, *args, **kwargs):
        ser = self.get_serializer(data=request.data)
        ser.is_valid(raise_exception=True)
        obj = ser.save(created_by=request.user)
        return success_response(self.get_serializer(obj).data, "Created", 201)


class ExamPaperViewSet(viewsets.ModelViewSet):
    queryset = ExamPaper.objects.prefetch_related("questions").all()
    serializer_class = ExamPaperSerializer
    permission_classes = [IsStaffUser]
    filterset_fields = ["status"]

    def list(self, request, *args, **kwargs):
        return success_response(
            self.get_serializer(self.filter_queryset(self.get_queryset()), many=True).data
        )

    def retrieve(self, request, *args, **kwargs):
        return success_response(self.get_serializer(self.get_object()).data)

    @action(detail=False, methods=["post"])
    def generate(self, request):
        blueprint_id = request.data.get("blueprint_id")
        title = request.data.get("title", "Generated Paper")
        bp = PaperBlueprint.objects.filter(pk=blueprint_id).first()
        if not bp:
            return success_response({}, "Blueprint not found", 400)
        paper = generate_paper(title=title, blueprint=bp, user=request.user)
        return success_response(ExamPaperSerializer(paper).data, "Paper generated", 201)

    @action(detail=True, methods=["post"])
    def authorize(self, request, pk=None):
        paper = dual_authorize_paper(paper=self.get_object(), user=request.user)
        return success_response(ExamPaperSerializer(paper).data, "Authorization recorded")
