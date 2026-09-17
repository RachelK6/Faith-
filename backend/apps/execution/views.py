"""
Code execution — thin client to an external sandbox service.

Per the brief (section 6): "Code execution should be isolated from the
main application to prevent unsafe code from affecting the platform."
Running student code inside this Django process would defeat that
requirement entirely, so this view does not execute anything itself —
it forwards the request to SANDBOX_URL (see settings.py / .env) and
returns whatever that service reports.

SANDBOX_URL should point to a dedicated code-execution service such as
Judge0, Piston, or a custom Docker-based runner — evaluate and stand
that up as its own piece of infrastructure, not inside this repo.
"""
import requests
from rest_framework import permissions
from rest_framework.exceptions import NotFound, PermissionDenied, ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from django.conf import settings

# Keep runaway/adversarial payloads from reaching the sandbox at all.
MAX_CODE_LENGTH = 20_000


class RunCodeView(APIView):
    """
    POST /api/execute/run/
    body: {"language": "javascript", "code": "...", "stdin": ""}
    Free-form scratchpad run — not tied to any activity, so there's no
    assessment content to protect and no module-lock check needed here.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        code = request.data.get("code")
        language = request.data.get("language")
        if not code or not language:
            raise ValidationError("Both 'language' and 'code' are required.")
        if len(code) > MAX_CODE_LENGTH:
            raise ValidationError(f"Code exceeds the {MAX_CODE_LENGTH}-character limit.")

        try:
            resp = requests.post(
                f"{settings.SANDBOX_URL}/run",
                json=request.data,
                timeout=10,
            )
            return Response(resp.json(), status=resp.status_code)
        except requests.RequestException as exc:
            return Response(
                {"error": f"Sandbox service unavailable: {exc}"},
                status=503,
            )


class RunTestsView(APIView):
    """
    POST /api/execute/test/
    body: {"language": "javascript", "code": "...", "activity_id": 12}
    Loads the activity's test_cases and runs the student's code against
    each one via the sandbox, returning pass/fail per case + overall score
    (brief section 7).

    SECURITY: this endpoint reveals an activity's test cases (and thus a
    hint about the expected solution), so it must respect the same
    module-locking rule as every other content endpoint — otherwise a
    student could bypass locking entirely just by guessing/incrementing
    activity_id and hitting this URL directly, which is precisely the
    bypass brief section 4 calls out ("manually changing URLs or making
    direct API requests").
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        from apps.courses.models import Activity
        from apps.progress.services import is_module_unlocked

        code = request.data.get("code")
        language = request.data.get("language")
        activity_id = request.data.get("activity_id")
        if not code or not language or not activity_id:
            raise ValidationError("'language', 'code', and 'activity_id' are all required.")
        if len(code) > MAX_CODE_LENGTH:
            raise ValidationError(f"Code exceeds the {MAX_CODE_LENGTH}-character limit.")

        try:
            activity = Activity.objects.select_related("lesson__module").get(pk=activity_id)
        except Activity.DoesNotExist:
            raise NotFound("Activity not found.")

        student = request.user
        if student.role == "student" and not is_module_unlocked(student, activity.lesson.module):
            raise PermissionDenied("This module is locked — complete the previous module first.")

        try:
            resp = requests.post(
                f"{settings.SANDBOX_URL}/test",
                json={
                    "language": language,
                    "code": code,
                    "test_cases": activity.test_cases or [],
                },
                timeout=15,
            )
            return Response(resp.json(), status=resp.status_code)
        except requests.RequestException as exc:
            return Response(
                {"error": f"Sandbox service unavailable: {exc}"},
                status=503,
            )
