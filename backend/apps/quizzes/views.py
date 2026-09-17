from rest_framework import viewsets, permissions
from rest_framework.exceptions import NotFound, ValidationError, PermissionDenied
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.permissions import ReadOnlyOrInstructorAdmin
from apps.courses.models import Module
from apps.progress.services import mark_activity_complete, is_module_unlocked
from .models import Quiz, QuizAttempt
from .serializers import QuizSerializer, SubmitQuizSerializer, QuizAttemptSerializer


class QuizViewSet(viewsets.ModelViewSet):
    """
    - GET: supports ?activity=<id> (so a lesson page can find "the quiz for
      this activity" — Quiz is a one-to-one extension of Activity, not
      something a student browses standalone). Students only see quizzes
      whose module they've actually unlocked — same rule as every other
      content endpoint (lessons, activities, PDFs); without this, a
      student could list every Quiz platform-wide regardless of locking,
      even though the actual questions/answers stay hidden via
      QuestionForStudentSerializer.
    - Write: instructor/admin only, via ReadOnlyOrInstructorAdmin.
    """
    queryset = Quiz.objects.all()
    serializer_class = QuizSerializer
    permission_classes = [ReadOnlyOrInstructorAdmin]

    def get_queryset(self):
        qs = super().get_queryset()
        activity_id = self.request.query_params.get("activity")
        if activity_id:
            qs = qs.filter(activity_id=activity_id)

        user = self.request.user
        if user.role == "student":
            module_ids = qs.values_list("activity__lesson__module_id", flat=True).distinct()
            unlocked_module_ids = [
                m.id for m in Module.objects.filter(id__in=module_ids)
                if is_module_unlocked(user, m)
            ]
            qs = qs.filter(activity__lesson__module_id__in=unlocked_module_ids)
        return qs


class SubmitQuizView(APIView):
    """
    POST /api/quizzes/<quiz_id>/submit/
    body: {"answers": {"3": 1, "4": 0}}  — question_id -> chosen choice index

    Auto-grades against Question.correct_choice_index (brief section 11),
    and if the student passes, marks the underlying activity complete
    (brief section 12 — "quiz passed" is one of the module-completion
    requirements).
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, quiz_id):
        try:
            quiz = Quiz.objects.select_related("activity__lesson__module").get(pk=quiz_id)
        except Quiz.DoesNotExist:
            raise NotFound("Quiz not found.")

        student = request.user

        if student.role == "student" and not is_module_unlocked(student, quiz.activity.lesson.module):
            raise PermissionDenied("This module is locked — complete the previous module first.")

        previous_attempts = QuizAttempt.objects.filter(student=student, quiz=quiz).count()
        max_attempts = quiz.activity.max_attempts
        if previous_attempts >= max_attempts:
            raise ValidationError(f"Maximum attempts ({max_attempts}) already used for this quiz.")

        serializer = SubmitQuizSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        answers = serializer.validated_data["answers"]

        questions = quiz.questions.all()
        total_marks = sum(q.marks for q in questions)
        score = 0
        for question in questions:
            chosen = answers.get(str(question.id))
            if chosen is not None and chosen == question.correct_choice_index:
                score += question.marks

        percentage = round((score / total_marks) * 100, 1) if total_marks else 0
        passed = percentage >= quiz.pass_mark_percentage

        attempt = QuizAttempt.objects.create(
            student=student,
            quiz=quiz,
            attempt_number=previous_attempts + 1,
            answers=answers,
            score=score,
            total_marks=total_marks,
            percentage=percentage,
            passed=passed,
        )

        if passed:
            mark_activity_complete(student, quiz.activity, score=percentage)

        return Response(QuizAttemptSerializer(attempt).data)


class QuizAttemptViewSet(viewsets.ReadOnlyModelViewSet):
    """
    GET /api/quiz-attempts/  — a student's own quiz history (for the
    Grades page). Instructors/admins can see everyone's via ?student=.
    Read-only: attempts are only ever created by SubmitQuizView, which
    does the actual scoring — never edited directly.
    """
    serializer_class = QuizAttemptSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = QuizAttempt.objects.all()
        if user.role == "student":
            qs = qs.filter(student=user)
        student_id = self.request.query_params.get("student")
        if student_id:
            qs = qs.filter(student_id=student_id)
        quiz_id = self.request.query_params.get("quiz")
        if quiz_id:
            qs = qs.filter(quiz_id=quiz_id)
        return qs
