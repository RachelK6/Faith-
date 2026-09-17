from rest_framework import viewsets
from rest_framework.exceptions import PermissionDenied
from rest_framework.parsers import MultiPartParser, FormParser

from apps.accounts.permissions import ReadOnlyOrInstructorAdmin
from apps.progress.services import is_module_unlocked
from .models import Course, Module, Lesson, Activity, LessonAttachment
from .serializers import (
    CourseSerializer, CourseDetailSerializer,
    ModuleSerializer, LessonSerializer, ActivitySerializer,
    LessonAttachmentSerializer,
)


class CourseViewSet(viewsets.ModelViewSet):
    """
    Any authenticated user can list/view courses.
    Only instructors/admins can create/edit/delete.
    An instructor is auto-assigned as the owner of a course they create.
    """
    queryset = Course.objects.all()
    permission_classes = [ReadOnlyOrInstructorAdmin]

    def get_serializer_class(self):
        if self.action == "retrieve":
            return CourseDetailSerializer
        return CourseSerializer

    def perform_create(self, serializer):
        serializer.save(instructor=self.request.user)


class ModuleViewSet(viewsets.ModelViewSet):
    """Module titles/order are visible even when locked (a student needs
    to see 'React — locked' in the sidebar) — only the actual lesson
    content inside a locked module is withheld, enforced below."""
    queryset = Module.objects.all()
    serializer_class = ModuleSerializer
    permission_classes = [ReadOnlyOrInstructorAdmin]

    def get_queryset(self):
        qs = super().get_queryset()
        course_id = self.request.query_params.get("course")
        if course_id:
            qs = qs.filter(course_id=course_id)
        return qs


class LessonViewSet(viewsets.ModelViewSet):
    """
    SECURITY: this is the actual enforcement point for module locking on
    the read side. Per brief section 4 — "students should not be able to
    bypass restrictions by manually changing URLs or making direct API
    requests" — a student hitting GET /api/lessons/<id>/ or
    /api/lessons/?module=<id> directly for a module they haven't unlocked
    must not get the content back, regardless of what the frontend UI
    shows or hides. Instructors/admins always see everything (they need
    to edit locked-for-students content).
    """
    queryset = Lesson.objects.all()
    serializer_class = LessonSerializer
    permission_classes = [ReadOnlyOrInstructorAdmin]

    def get_queryset(self):
        qs = super().get_queryset()
        module_id = self.request.query_params.get("module")
        if module_id:
            qs = qs.filter(module_id=module_id)

        user = self.request.user
        if user.role == "student":
            unlocked_module_ids = [
                m.id for m in Module.objects.filter(
                    id__in=qs.values_list("module_id", flat=True).distinct()
                )
                if is_module_unlocked(user, m)
            ]
            qs = qs.filter(module_id__in=unlocked_module_ids)
        return qs

    def retrieve(self, request, *args, **kwargs):
        # get_queryset already filters locked content out for students,
        # so a locked lesson 404s rather than leaking a 403 (doesn't
        # confirm the lesson exists at all to someone probing IDs).
        return super().retrieve(request, *args, **kwargs)


class ActivityViewSet(viewsets.ModelViewSet):
    """Same enforcement as LessonViewSet, one level down the tree."""
    queryset = Activity.objects.all()
    serializer_class = ActivitySerializer
    permission_classes = [ReadOnlyOrInstructorAdmin]

    def get_queryset(self):
        qs = super().get_queryset()
        lesson_id = self.request.query_params.get("lesson")
        if lesson_id:
            qs = qs.filter(lesson_id=lesson_id)

        user = self.request.user
        if user.role == "student":
            module_ids = qs.values_list("lesson__module_id", flat=True).distinct()
            unlocked_module_ids = [
                m.id for m in Module.objects.filter(id__in=module_ids)
                if is_module_unlocked(user, m)
            ]
            qs = qs.filter(lesson__module_id__in=unlocked_module_ids)
        return qs


class LessonAttachmentViewSet(viewsets.ModelViewSet):
    """
    PDFs/handouts attached to a lesson.
    - GET: any authenticated user, but students only see attachments for
      lessons in modules they've unlocked (same rule as the lesson/activity
      content itself — a PDF is course content too, and section 4 of the
      brief applies to it exactly as much as videos or text).
    - POST/PATCH/DELETE: instructor/admin only. Upload takes multipart
      form data: fields `lesson` (id), `title`, `file` (the PDF).
    """
    queryset = LessonAttachment.objects.all()
    serializer_class = LessonAttachmentSerializer
    permission_classes = [ReadOnlyOrInstructorAdmin]
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        qs = super().get_queryset()
        lesson_id = self.request.query_params.get("lesson")
        if lesson_id:
            qs = qs.filter(lesson_id=lesson_id)

        user = self.request.user
        if user.role == "student":
            module_ids = qs.values_list("lesson__module_id", flat=True).distinct()
            unlocked_module_ids = [
                m.id for m in Module.objects.filter(id__in=module_ids)
                if is_module_unlocked(user, m)
            ]
            qs = qs.filter(lesson__module_id__in=unlocked_module_ids)
        return qs

    def perform_create(self, serializer):
        serializer.save(uploaded_by=self.request.user)
