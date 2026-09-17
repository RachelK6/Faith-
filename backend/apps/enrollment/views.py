from rest_framework import viewsets, permissions
from rest_framework.exceptions import ValidationError

from apps.accounts.permissions import IsStudent
from .models import Enrollment
from .serializers import EnrollmentSerializer


class EnrollmentViewSet(viewsets.ModelViewSet):
    """
    Students enroll themselves (POST with just {"course": id}).
    Students only ever see their own enrollments.
    Instructors/admins can list all enrollments for their courses via ?course=.
    """
    serializer_class = EnrollmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = Enrollment.objects.all()
        if user.role == "student":
            qs = qs.filter(student=user)
        course_id = self.request.query_params.get("course")
        if course_id:
            qs = qs.filter(course_id=course_id)
        return qs

    def perform_create(self, serializer):
        if self.request.user.role != "student":
            raise ValidationError("Only students can enroll in courses.")
        serializer.save(student=self.request.user)
