from django.contrib import admin

from .models import (
    AdmitCard,
    Advertisement,
    Application,
    ExamCentre,
    InterviewPanel,
    Nomination,
    Requisition,
)

admin.site.register(Requisition)
admin.site.register(Advertisement)
admin.site.register(ExamCentre)
admin.site.register(Application)
admin.site.register(AdmitCard)
admin.site.register(InterviewPanel)
admin.site.register(Nomination)
