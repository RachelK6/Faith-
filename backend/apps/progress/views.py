from rest_framework import permissions
from rest_framework.exceptions import NotFound
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.courses.models import Course, Module
from .services import is_module_unlocked, is_module_complete


class CourseProgressView(APIView):
    """
    GET /api/progress/course/<course_id>/
    Returns every module in the course with the current student's status:
    'done' | 'active' (unlocked, not yet complete) | 'locked'.
    This is the exact shape the student dashboard's progress card needs.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, course_id):
        try:
            course = Course.objects.get(pk=course_id)
        except Course.DoesNotExist:
            raise NotFound("Course not found.")
        modules = Module.objects.filter(course=course).order_by("order")

        result = []
        for module in modules:
            unlocked = is_module_unlocked(request.user, module)
            complete = is_module_complete(request.user, module) if unlocked else False

            if complete:
                status = "done"
            elif unlocked:
                status = "active"
            else:
                status = "locked"

            result.append({
                "module_id": module.id,
                "title": module.title,
                "order": module.order,
                "status": status,
            })

        return Response(result)


class ModuleAccessCheckView(APIView):
    """
    GET /api/progress/can-access/<module_id>/
    The actual enforcement endpoint: lesson/activity views should call
    this (or the is_module_unlocked() function directly) before serving
    content, so a student can't bypass locking by hitting the lesson API
    URL directly.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, module_id):
        try:
            module = Module.objects.get(pk=module_id)
        except Module.DoesNotExist:
            raise NotFound("Module not found.")
        unlocked = is_module_unlocked(request.user, module)
        return Response({"module_id": module.id, "unlocked": unlocked})
