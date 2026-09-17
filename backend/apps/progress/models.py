from django.conf import settings
from django.db import models

from apps.courses.models import Activity


class ActivityCompletion(models.Model):
    """
    A record that a student has completed a specific activity.
    Created by the submissions/quizzes apps when work is graded as passing —
    this table is the single source of truth that module-locking checks
    against, so completion logic doesn't get duplicated in multiple places.
    """
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="activity_completions"
    )
    activity = models.ForeignKey(Activity, on_delete=models.CASCADE, related_name="completions")
    completed_at = models.DateTimeField(auto_now_add=True)
    score = models.FloatField(null=True, blank=True)

    class Meta:
        unique_together = ("student", "activity")
        indexes = [
            models.Index(fields=["student", "activity"]),
        ]

    def __str__(self):
        return f"{self.student} completed {self.activity}"
