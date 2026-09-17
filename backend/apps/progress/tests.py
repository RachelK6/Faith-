"""
End-to-end integration test for the full learning flow, run through the
real REST API (not just calling service functions directly) so it
exercises the views, serializers, and permission classes exactly as a
real client would. This is the project's first real test — see the
project README for the broader note that test coverage is still thin
everywhere else; this file is a starting point, not the finish line.

Run with:  python manage.py test apps.progress
"""
import io
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.test import TestCase

from apps.quizzes.models import Question

User = get_user_model()


class FullLearningFlowTest(TestCase):
    def setUp(self):
        self.instructor = User.objects.create_user(
            username="inst1", email="instructor@test.com", password="Pass1234!", role="instructor"
        )
        self.student = User.objects.create_user(
            username="stud1", email="student@test.com", password="Pass1234!", role="student"
        )
        self.instructor_token = self._login("instructor@test.com", "Pass1234!")
        self.student_token = self._login("student@test.com", "Pass1234!")

    def _login(self, email, password):
        resp = self.client.post(
            "/api/auth/login/", {"email": email, "password": password}, content_type="application/json"
        )
        self.assertEqual(resp.status_code, 200)
        return resp.json()["access"]

    def _auth(self, token):
        return {"HTTP_AUTHORIZATION": f"Bearer {token}"}

    def test_full_flow(self):
        # --- Instructor builds a course with 2 modules ---
        resp = self.client.post(
            "/api/courses/", {"title": "Intro to Python", "description": "A course"},
            content_type="application/json", **self._auth(self.instructor_token),
        )
        self.assertEqual(resp.status_code, 201)
        course_id = resp.json()["id"]

        module1_id = self.client.post(
            "/api/modules/", {"course": course_id, "title": "Basics", "order": 1},
            content_type="application/json", **self._auth(self.instructor_token),
        ).json()["id"]
        module2_id = self.client.post(
            "/api/modules/", {"course": course_id, "title": "Functions", "order": 2},
            content_type="application/json", **self._auth(self.instructor_token),
        ).json()["id"]

        resp = self.client.post(
            "/api/lessons/", {
                "module": module1_id, "title": "Variables", "order": 1,
                "video_url": "https://youtube.com/watch?v=abc123",
                "tutorial_content": "Variables store values.",
            }, content_type="application/json", **self._auth(self.instructor_token),
        )
        self.assertEqual(resp.status_code, 201)
        lesson_id = resp.json()["id"]
        self.assertEqual(resp.json()["video_url"], "https://youtube.com/watch?v=abc123")

        # --- PDF attachment ---
        fake_pdf = io.BytesIO(b"%PDF-1.4 fake pdf content\n%%EOF")
        fake_pdf.name = "handout.pdf"
        resp = self.client.post(
            "/api/lesson-attachments/", {"lesson": lesson_id, "title": "Week 1 handout", "file": fake_pdf},
            **self._auth(self.instructor_token),
        )
        self.assertEqual(resp.status_code, 201)
        self.assertTrue(resp.json()["file"])

        # --- Required exercise activity ---
        resp = self.client.post(
            "/api/activities/", {
                "lesson": lesson_id, "activity_type": "exercise", "title": "Sum two numbers",
                "instructions": "Write add(a, b)", "max_score": 100, "max_attempts": 2,
                "is_required": True, "starter_code": "function add(a, b) {}",
                "test_cases": [{"input": [1, 2], "expected_output": 3}],
            }, content_type="application/json", **self._auth(self.instructor_token),
        )
        self.assertEqual(resp.status_code, 201)
        activity_id = resp.json()["id"]

        # --- Student enrolls ---
        resp = self.client.post(
            "/api/enrollments/", {"course": course_id},
            content_type="application/json", **self._auth(self.student_token),
        )
        self.assertEqual(resp.status_code, 201)

        # --- Module locking: module 2 locked, module 1 active ---
        resp = self.client.get(f"/api/progress/course/{course_id}/", **self._auth(self.student_token))
        statuses = {m["module_id"]: m["status"] for m in resp.json()}
        self.assertEqual(statuses[module1_id], "active")
        self.assertEqual(statuses[module2_id], "locked")

        # --- Run tests against the sandbox (mocked — no real sandbox in CI) ---
        with patch("apps.execution.views.requests.post") as mock_post:
            mock_post.return_value.status_code = 200
            mock_post.return_value.json.return_value = {"tests_passed": 1, "tests_failed": 0, "score": 100}
            resp = self.client.post(
                "/api/execute/test/",
                {"language": "javascript", "code": "function add(a,b){return a+b}", "activity_id": activity_id},
                content_type="application/json", **self._auth(self.student_token),
            )
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(
            mock_post.call_args.kwargs["json"]["test_cases"],
            [{"input": [1, 2], "expected_output": 3}],
        )

        # --- Submit + attempt limit (max_attempts=2) ---
        resp = self.client.post(
            "/api/submissions/", {"activity": activity_id, "content": "function add(a,b){return a+b}"},
            content_type="application/json", **self._auth(self.student_token),
        )
        self.assertEqual(resp.status_code, 201)
        submission_id = resp.json()["id"]
        self.assertEqual(resp.json()["attempt_number"], 1)

        self.client.post(
            "/api/submissions/", {"activity": activity_id, "content": "v2"},
            content_type="application/json", **self._auth(self.student_token),
        )
        resp = self.client.post(
            "/api/submissions/", {"activity": activity_id, "content": "v3"},
            content_type="application/json", **self._auth(self.student_token),
        )
        self.assertEqual(resp.status_code, 400)  # 3rd attempt blocked

        # --- Grade it -> module 1 completes -> module 2 unlocks ---
        resp = self.client.patch(
            f"/api/submissions/{submission_id}/grade/", {"grade": 100, "feedback": "Nicely done."},
            content_type="application/json", **self._auth(self.instructor_token),
        )
        self.assertEqual(resp.status_code, 200)

        resp = self.client.get(f"/api/progress/course/{course_id}/", **self._auth(self.student_token))
        statuses = {m["module_id"]: m["status"] for m in resp.json()}
        self.assertEqual(statuses[module1_id], "done")
        # Module 2 has no activities yet, so it's trivially complete once
        # unlocked (see progress/services.py) — the real assertion here
        # is just that it's no longer locked.
        self.assertNotEqual(statuses[module2_id], "locked")

        # --- Quiz: create, verify answer key hidden, submit, check history ---
        quiz_activity_id = self.client.post(
            "/api/activities/", {
                "lesson": lesson_id, "activity_type": "quiz", "title": "Basics Quiz",
                "max_score": 10, "max_attempts": 1, "is_required": False,
            }, content_type="application/json", **self._auth(self.instructor_token),
        ).json()["id"]

        resp = self.client.post(
            "/api/quizzes/", {"activity": quiz_activity_id, "time_limit_minutes": 10, "pass_mark_percentage": 50},
            content_type="application/json", **self._auth(self.instructor_token),
        )
        self.assertEqual(resp.status_code, 201)
        quiz_id = resp.json()["id"]

        question = Question.objects.create(
            quiz_id=quiz_id, text="2 + 2 = ?", marks=10,
            choices=[{"text": "3"}, {"text": "4"}], correct_choice_index=1,
        )

        resp = self.client.get(f"/api/quizzes/{quiz_id}/", **self._auth(self.student_token))
        self.assertEqual(resp.status_code, 200)
        self.assertNotIn("correct_choice_index", resp.json()["questions"][0])

        resp = self.client.post(
            f"/api/quizzes/{quiz_id}/submit/", {"answers": {str(question.id): 1}},
            content_type="application/json", **self._auth(self.student_token),
        )
        self.assertEqual(resp.status_code, 200)
        self.assertTrue(resp.json()["passed"])

        resp = self.client.get("/api/quiz-attempts/", **self._auth(self.student_token))
        self.assertEqual(len(resp.json()), 1)

        # --- Instructor roster shows the student by name/email ---
        resp = self.client.get(f"/api/enrollments/?course={course_id}", **self._auth(self.instructor_token))
        self.assertEqual(resp.json()[0]["student_email"], "student@test.com")
