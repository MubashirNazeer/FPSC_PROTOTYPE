from django.contrib import admin

from .models import ExamPaper, PaperBlueprint, Question, QuestionVersion, TaxonomyNode

admin.site.register(TaxonomyNode)
admin.site.register(Question)
admin.site.register(QuestionVersion)
admin.site.register(PaperBlueprint)
admin.site.register(ExamPaper)
