from rest_framework import serializers

from .models import Submission


class SubmissionSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="student.get_full_name", read_only=True)
    activity_title = serializers.CharField(source="activity.title", read_only=True)

    class Meta:
        model = Submission
        fields = [
            "id", "student", "student_name", "activity", "activity_title",
            "content", "file", "github_url", "attempt_number", "status",
            "submitted_at", "grade", "feedback", "graded_at",
        ]
        read_only_fields = ["student", "attempt_number", "status", "grade", "feedback", "graded_at"]


class GradeSubmissionSerializer(serializers.Serializer):
    """Used only by the instructor grading endpoint."""
    grade = serializers.FloatField(min_value=0)
    feedback = serializers.CharField(allow_blank=True, required=False)
