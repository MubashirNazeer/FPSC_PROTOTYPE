from django.contrib import admin

from .models import ExamSession, ExamSitting

admin.site.register(ExamSitting)
admin.site.register(ExamSession)
