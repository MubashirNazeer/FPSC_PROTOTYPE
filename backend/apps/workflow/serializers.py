from rest_framework import serializers

from .models import (
    CaseComment,
    CaseInstance,
    CaseTransitionLog,
    WorkflowDefinition,
    WorkflowState,
    WorkflowTransition,
)


class WorkflowStateSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkflowState
        fields = (
            "id",
            "code",
            "name",
            "sequence",
            "is_initial",
            "is_terminal",
            "responsible_role",
        )


class WorkflowTransitionSerializer(serializers.ModelSerializer):
    from_state_code = serializers.CharField(source="from_state.code", read_only=True)
    to_state_code = serializers.CharField(source="to_state.code", read_only=True)

    class Meta:
        model = WorkflowTransition
        fields = (
            "id",
            "name",
            "from_state",
            "to_state",
            "from_state_code",
            "to_state_code",
            "required_role",
            "requires_dual_auth",
        )


class WorkflowDefinitionSerializer(serializers.ModelSerializer):
    states = WorkflowStateSerializer(many=True, read_only=True)
    transitions = WorkflowTransitionSerializer(many=True, read_only=True)

    class Meta:
        model = WorkflowDefinition
        fields = (
            "id",
            "code",
            "name",
            "module",
            "description",
            "is_active",
            "states",
            "transitions",
        )


class CaseTransitionLogSerializer(serializers.ModelSerializer):
    actor_username = serializers.CharField(source="actor.username", read_only=True)
    from_state_code = serializers.CharField(source="from_state.code", read_only=True)
    to_state_code = serializers.CharField(source="to_state.code", read_only=True)

    class Meta:
        model = CaseTransitionLog
        fields = (
            "id",
            "from_state_code",
            "to_state_code",
            "actor_username",
            "co_approver",
            "note",
            "created_at",
        )


class CaseCommentSerializer(serializers.ModelSerializer):
    author_username = serializers.CharField(source="author.username", read_only=True)

    class Meta:
        model = CaseComment
        fields = ("id", "author", "author_username", "body", "created_at")
        read_only_fields = ("author",)


class CaseInstanceSerializer(serializers.ModelSerializer):
    current_state = WorkflowStateSerializer(read_only=True)
    transition_logs = CaseTransitionLogSerializer(many=True, read_only=True)
    comments = CaseCommentSerializer(many=True, read_only=True)
    workflow_code = serializers.CharField(source="workflow.code", read_only=True)

    class Meta:
        model = CaseInstance
        fields = (
            "id",
            "workflow",
            "workflow_code",
            "current_state",
            "reference_type",
            "reference_id",
            "title",
            "created_by",
            "assigned_to",
            "metadata",
            "created_at",
            "updated_at",
            "transition_logs",
            "comments",
        )


class TransitionSerializer(serializers.Serializer):
    to_state_code = serializers.CharField()
    note = serializers.CharField(required=False, allow_blank=True)
    co_approver_id = serializers.IntegerField(required=False, allow_null=True)
