from django.contrib import admin

from .models import (
    AdmitCard,
    Advertisement,
    Appeal,
    Application,
    AttendanceRecord,
    ExamCentre,
    InterviewPanel,
    Nomination,
    PersonalHearing,
    Requisition,
)

admin.site.register(Requisition)
admin.site.register(Advertisement)
admin.site.register(ExamCentre)
admin.site.register(Application)
admin.site.register(AdmitCard)
admin.site.register(InterviewPanel)
admin.site.register(Nomination)
admin.site.register(Appeal)
admin.site.register(PersonalHearing)
admin.site.register(AttendanceRecord)
