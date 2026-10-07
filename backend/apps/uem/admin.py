from django.contrib import admin

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

admin.site.register(ExamType)
admin.site.register(UEMExamInstance)
admin.site.register(UEMRequisition)
admin.site.register(QuotaRoster)
admin.site.register(PreExamReport)
admin.site.register(Marksheet)
admin.site.register(ScheduleSlot)
admin.site.register(MeritList)
admin.site.register(Correspondence)
