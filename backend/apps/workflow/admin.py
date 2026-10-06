from django.contrib import admin

from .models import (
    CaseComment,
    CaseInstance,
    CaseTransitionLog,
    WorkflowDefinition,
    WorkflowState,
    WorkflowTransition,
)

admin.site.register(WorkflowDefinition)
admin.site.register(WorkflowState)
admin.site.register(WorkflowTransition)
admin.site.register(CaseInstance)
admin.site.register(CaseComment)
admin.site.register(CaseTransitionLog)
