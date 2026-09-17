from django.utils import timezone
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError, PermissionDenied
from rest_framework.response import Response

from apps.accounts.permissions import IsInstructorOrAdmin
from apps.progress.services import mark_activity_complete, is_module_unlocked
from .models import Submission, SubmissionStatus
from .serializers import SubmissionSerializer, GradeSubmissionSerializer


class SubmissionViewSet(viewsets.ModelViewSet):
    """
    Students create submissions against an activity (attempts are limited
    by activity.max_attempts, per brief section 10) and can only see their
    own. Instructors see all submissions for activities and grade them via
    the /grade/ action.
    """
    serializer_class = SubmissionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = Submission.objects.all()
        if user.role == "student":
            qs = qs.filter(student=user)
        activity_id = self.request.query_params.get("activity")
        if activity_id:
            qs = qs.filter(activity_id=activity_id)
        status_filter = self.request.query_params.get("status")
        if status_filter:
            qs = qs.filter(status=status_filter)
        return qs

    def perform_create(self, serializer):
        activity = serializer.validated_data["activity"]
        student = self.request.user

        # SECURITY: block submissions to activities in modules the student
        # hasn't unlocked yet, even if they know/guess the activity ID —
        # this is the write-side equivalent of the read-side check in
        # apps/courses/views.py. Instructors testing content aren't
        # students, so this only applies to the student role.
        if student.role == "student" and not is_module_unlocked(student, activity.lesson.module):
            raise PermissionDenied("This module is locked — complete the previous module first.")

        previous_attempts = Submission.objects.filter(student=student, activity=activity).count()
        if previous_attempts >= activity.max_attempts:
            raise ValidationError(
                f"Maximum attempts ({activity.max_attempts}) already used for this activity."
            )

        serializer.save(student=student, attempt_number=previous_attempts + 1)

    @action(detail=True, methods=["patch"], permission_classes=[IsInstructorOrAdmin])
    def grade(self, request, pk=None):
        """
        PATCH /api/submissions/<id>/grade/  body: {"grade": 8, "feedback": "..."}
        Grading marks the underlying activity complete for progress tracking,
        which is what lets the next module unlock (brief section 12).
        """
        submission = self.get_object()
        serializer = GradeSubmissionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        submission.grade = serializer.validated_data["grade"]
        submission.feedback = serializer.validated_data.get("feedback", "")
        submission.status = SubmissionStatus.GRADED
        submission.graded_at = timezone.now()
        submission.save()

        mark_activity_complete(submission.student, submission.activity, score=submission.grade)

        return Response(SubmissionSerializer(submission).data)
