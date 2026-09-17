from django.conf import settings
from django.db import models

from apps.courses.models import Activity


class SubmissionStatus(models.TextChoices):
    SUBMITTED = "submitted", "Submitted"
    GRADED = "graded", "Graded"
    NOT_COMPLETED = "not_completed", "Not Completed"


class Submission(models.Model):
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="submissions"
    )
    activity = models.ForeignKey(Activity, on_delete=models.CASCADE, related_name="submissions")

    content = models.TextField(blank=True, help_text="Pasted code / written answer")
    file = models.FileField(upload_to="submissions/", blank=True, null=True)
    github_url = models.URLField(blank=True)

    attempt_number = models.PositiveIntegerField(default=1)
    status = models.CharField(max_length=20, choices=SubmissionStatus.choices, default=SubmissionStatus.SUBMITTED)
    submitted_at = models.DateTimeField(auto_now_add=True)

    grade = models.FloatField(null=True, blank=True)
    feedback = models.TextField(blank=True)
    graded_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-submitted_at"]

    def __str__(self):
        return f"{self.student} — {self.activity} (attempt {self.attempt_number})"
