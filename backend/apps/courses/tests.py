from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase

from apps.accounts.models import User
from apps.courses.models import Course


class CourseThumbnailTests(TestCase):
    def setUp(self):
        self.instructor = User.objects.create_user(
            username="instructor1",
            email="instructor1@example.com",
            password="StrongPass123!",
            role="instructor",
        )

    def test_course_accepts_thumbnail_file(self):
        cover = SimpleUploadedFile(
            "cover.png",
            b"fake-image-bytes",
            content_type="image/png",
        )

        course = Course.objects.create(
            title="AI Foundations",
            description="Intro to modern AI",
            instructor=self.instructor,
            thumbnail=cover,
        )

        self.assertIn("cover", course.thumbnail.name)
        self.assertTrue(course.thumbnail.name.endswith(".png"))
        self.assertEqual(course.instructor, self.instructor)
