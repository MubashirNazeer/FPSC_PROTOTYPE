from django.contrib import admin

from .models import CECandidateProgress, CEScheduleEvent, CompetitiveExamCycle, ExaminerPanel

admin.site.register(CompetitiveExamCycle)
admin.site.register(ExaminerPanel)
admin.site.register(CECandidateProgress)
admin.site.register(CEScheduleEvent)
