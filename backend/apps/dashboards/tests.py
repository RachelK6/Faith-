from datetime import date, timedelta

from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.test import TestCase

from apps.courses.models import Activity, ActivityType, Course, Lesson, Module
from apps.enrollment.models import Enrollment
from apps.quizzes.models import Quiz, QuizAttempt
from apps.dashboards.models import PerformanceSnapshot

User = get_user_model()


class PerformanceSnapshotTests(TestCase):
    def test_compute_snapshots_creates_weekly_student_course_rows(self):
        instructor = User.objects.create_user(
            username="ins-1",
            email="ins1@example.com",
            password="Pass123!",
            role="instructor",
        )
        student = User.objects.create_user(
            username="stu-1",
            email="stu1@example.com",
            password="Pass123!",
            role="student",
        )

        course = Course.objects.create(title="Risk Course", instructor=instructor)
        module = Module.objects.create(course=course, title="Week 1", order=1)
        lesson = Lesson.objects.create(module=module, title="Introduction", order=1)
        activity = Activity.objects.create(
            lesson=lesson,
            activity_type=ActivityType.QUIZ,
            title="Knowledge check",
            max_score=100,
            is_required=True,
        )
        quiz = Quiz.objects.create(activity=activity, time_limit_minutes=20, pass_mark_percentage=70)

        Enrollment.objects.create(student=student, course=course)
        QuizAttempt.objects.create(
            student=student,
            quiz=quiz,
            attempt_number=1,
            answers={"1": 0},
            score=80,
            total_marks=100,
            percentage=80,
            passed=True,
            submitted_at=date.today() - timedelta(days=2),
        )

        week_start = date.today() - timedelta(days=date.today().weekday())
        call_command("compute_snapshots", week_start=week_start.isoformat(), course_id=course.id)

        snapshot = PerformanceSnapshot.objects.filter(
            student=student,
            course=course,
            week_start=week_start,
        ).first()

        self.assertIsNotNone(snapshot)
        self.assertGreater(snapshot.quiz_avg, 0)
        self.assertGreaterEqual(snapshot.completion_rate, 0)
