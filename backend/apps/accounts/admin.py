from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin

from .models import AuditLog, CandidateProfile, Role, User, Wing


@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    fieldsets = DjangoUserAdmin.fieldsets + (
        ("FPSC", {"fields": ("cnic", "phone", "wing", "designation", "roles")}),
    )
    filter_horizontal = ("roles", "groups", "user_permissions")
    list_display = ("username", "email", "cnic", "wing", "is_staff")


admin.site.register(Wing)
admin.site.register(Role)
admin.site.register(AuditLog)
admin.site.register(CandidateProfile)
