from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models


def validate_pdf(file):
    if not file.name.lower().endswith(".pdf"):
        raise ValidationError("Only PDF files are allowed.")
    max_size_mb = 50
    if file.size > max_size_mb * 1024 * 1024:
        raise ValidationError(f"PDF must be smaller than {max_size_mb}MB.")


def course_cover_upload_path(instance, filename):
    return f"course_covers/{instance.id or 'new'}/{filename}"


class Course(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    instructor = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="courses_taught"
    )
    thumbnail = models.ImageField(
        upload_to=course_cover_upload_path,
        blank=True,
        null=True,
        help_text="Course cover image shown on the catalog and dashboard cards.",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title


class Module(models.Model):
    """A module belongs to a course and has an order — this order is what
    module-locking (in the progress app) checks against."""
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="modules")
    title = models.CharField(max_length=200)
    order = models.PositiveIntegerField(help_text="Position in the course sequence, starting at 1")

    class Meta:
        ordering = ["order"]
        unique_together = ("course", "order")

    def __str__(self):
        return f"{self.course.title} — Module {self.order}: {self.title}"


class Lesson(models.Model):
    module = models.ForeignKey(Module, on_delete=models.CASCADE, related_name="lessons")
    title = models.CharField(max_length=200)
    order = models.PositiveIntegerField()
    learning_objectives = models.TextField(blank=True)
    video_url = models.URLField(blank=True, help_text="YouTube/Vimeo/other embeddable video link")
    tutorial_content = models.TextField(blank=True)

    class Meta:
        ordering = ["order"]
        unique_together = ("module", "order")

    def __str__(self):
        return self.title


def lesson_pdf_upload_path(instance, filename):
    # e.g. media/lesson_resources/course_3/module_1/lesson_2/handout.pdf
    lesson = instance.lesson
    return (
        f"lesson_resources/course_{lesson.module.course_id}/"
        f"module_{lesson.module_id}/lesson_{lesson.id}/{filename}"
    )


class LessonAttachment(models.Model):
    """
    A PDF (or other reading material) attached to a lesson. Separate
    table rather than a single field on Lesson so an instructor can
    attach more than one document (slides + handout + cheat sheet, etc).
    Stored on disk under MEDIA_ROOT; the DB holds the path + metadata,
    which is what "stored in the db" means in practice for file uploads —
    Django/DRF don't put binary file contents directly in DB columns.
    """
    lesson = models.ForeignKey(Lesson, on_delete=models.CASCADE, related_name="attachments")
    title = models.CharField(max_length=200, help_text="Display name, e.g. 'Week 3 slides'")
    file = models.FileField(upload_to=lesson_pdf_upload_path, validators=[validate_pdf])
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="uploaded_attachments"
    )
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["uploaded_at"]

    def __str__(self):
        return f"{self.title} ({self.lesson.title})"


class ActivityType(models.TextChoices):
    EXERCISE = "exercise", "Coding Exercise"
    LAB = "lab", "Daily Lab"
    QUIZ = "quiz", "Quiz"
    ASSIGNMENT = "assignment", "Assignment"


class Activity(models.Model):
    """
    A gradeable unit of work inside a lesson. is_required drives module
    completion (progress app): a module is only complete once every
    required activity in it is complete.
    """
    lesson = models.ForeignKey(Lesson, on_delete=models.CASCADE, related_name="activities")
    activity_type = models.CharField(max_length=20, choices=ActivityType.choices)
    title = models.CharField(max_length=200)
    instructions = models.TextField(blank=True)
    max_score = models.PositiveIntegerField(default=100)
    max_attempts = models.PositiveIntegerField(default=1)
    deadline = models.DateTimeField(null=True, blank=True)
    is_required = models.BooleanField(default=True)

    # for coding exercises specifically
    starter_code = models.TextField(blank=True)
    test_cases = models.JSONField(blank=True, null=True, help_text="List of {input, expected_output}")

    def __str__(self):
        return f"{self.title} ({self.activity_type})"
