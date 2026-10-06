from django.contrib import admin

from .models import ExamType, UEMExamInstance

admin.site.register(ExamType)
admin.site.register(UEMExamInstance)
