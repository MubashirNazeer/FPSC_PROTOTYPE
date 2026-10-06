from __future__ import annotations

from django.contrib.auth import get_user_model
from django.db import transaction
from rest_framework import serializers

from .models import AuditLog, CandidateProfile, Role, Wing

User = get_user_model()


class WingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Wing
        fields = ("id", "code", "name", "description")


class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = ("id", "code", "name", "description", "is_staff_role")


class CandidateProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = CandidateProfile
        fields = (
            "father_name",
            "date_of_birth",
            "domicile",
            "province",
            "address",
            "education_summary",
            "experience_summary",
            "quota",
            "photo",
        )


class UserSerializer(serializers.ModelSerializer):
    roles = RoleSerializer(many=True, read_only=True)
    wing = WingSerializer(read_only=True)
    candidate_profile = CandidateProfileSerializer(read_only=True)
    role_codes = serializers.ListField(child=serializers.CharField(), read_only=True)

    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "cnic",
            "phone",
            "designation",
            "wing",
            "roles",
            "role_codes",
            "is_staff",
            "candidate_profile",
        )


class RegisterCandidateSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    password = serializers.CharField(write_only=True, min_length=6)
    email = serializers.EmailField()
    first_name = serializers.CharField(max_length=150)
    last_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    cnic = serializers.CharField(max_length=15)
    phone = serializers.CharField(max_length=20, required=False, allow_blank=True)
    father_name = serializers.CharField(max_length=128, required=False, allow_blank=True)
    domicile = serializers.CharField(max_length=64, required=False, allow_blank=True)
    province = serializers.CharField(max_length=64, required=False, allow_blank=True)

    def validate_cnic(self, value: str) -> str:
        digits = value.replace("-", "")
        if len(digits) != 13 or not digits.isdigit():
            raise serializers.ValidationError("CNIC must be 13 digits.")
        return f"{digits[:5]}-{digits[5:12]}-{digits[12:]}"

    def validate_username(self, value: str) -> str:
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Username already taken.")
        return value

    @transaction.atomic
    def create(self, validated_data):
        role, _ = Role.objects.get_or_create(
            code="CANDIDATE",
            defaults={"name": "Candidate", "is_staff_role": False},
        )
        user = User.objects.create_user(
            username=validated_data["username"],
            email=validated_data["email"],
            password=validated_data["password"],
            first_name=validated_data["first_name"],
            last_name=validated_data.get("last_name", ""),
            cnic=validated_data["cnic"],
            phone=validated_data.get("phone", ""),
        )
        user.roles.add(role)
        CandidateProfile.objects.create(
            user=user,
            father_name=validated_data.get("father_name", ""),
            domicile=validated_data.get("domicile", ""),
            province=validated_data.get("province", ""),
        )
        return user


class AuditLogSerializer(serializers.ModelSerializer):
    actor_username = serializers.CharField(source="actor.username", read_only=True)

    class Meta:
        model = AuditLog
        fields = (
            "id",
            "actor",
            "actor_username",
            "action",
            "entity_type",
            "entity_id",
            "detail",
            "ip_address",
            "created_at",
        )
