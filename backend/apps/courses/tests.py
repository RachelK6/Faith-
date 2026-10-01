from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from rest_framework.test import APITestCase

from apps.accounts.models import User
from apps.accounts.testing import World, client_for
from apps.courses.models import Activity, Course, Lesson, Module


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


class CourseBuilderApiTests(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.world = World()

    def setUp(self):
        self.instructor = client_for(self.world.instructor_a)
        self.student = client_for(self.world.student_1)

    def test_draft_stays_hidden_until_valid_course_is_published(self):
        draft = self.instructor.post("/api/courses/", {
            "title": "Python Foundations", "description": "Build practical Python skills.", "status": "draft",
        }, format="json")
        self.assertEqual(draft.status_code, 201, draft.data)
        course_id = draft.data["id"]
        self.assertNotIn(course_id, {item["id"] for item in self.student.get("/api/courses/").data})
        self.assertEqual(self.student.get(f"/api/courses/{course_id}/").status_code, 404)
        self.assertEqual(self.instructor.post(f"/api/courses/{course_id}/publish/").status_code, 400)

        module = self.instructor.post("/api/modules/", {
            "course": course_id, "title": "Getting Started", "order": 1,
        }, format="json")
        self.assertEqual(module.status_code, 201, module.data)
        self.assertEqual(self.instructor.post(f"/api/courses/{course_id}/publish/").status_code, 400)
        lesson = self.instructor.post("/api/lessons/", {
            "module": module.data["id"], "title": "Install Python", "order": 1,
            "video_url": "https://youtu.be/dQw4w9WgXcQ",
        }, format="json")
        self.assertEqual(lesson.status_code, 201, lesson.data)

        published = self.instructor.post(f"/api/courses/{course_id}/publish/")
        self.assertEqual(published.status_code, 200, published.data)
        self.assertEqual(published.data["status"], Course.Status.PUBLISHED)
        self.assertEqual(self.student.get(f"/api/courses/{course_id}/").status_code, 200)

    def test_module_and_lesson_ordering_persist_and_require_full_permutation(self):
        course = Course.objects.create(title="Order test", instructor=self.world.instructor_a)
        modules = [
            Module.objects.create(course=course, title=f"Module {index}", order=index)
            for index in (1, 2, 3)
        ]
        response = self.instructor.post("/api/modules/reorder/", {
            "course": course.id, "module_ids": [modules[2].id, modules[0].id, modules[1].id],
        }, format="json")
        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(list(Module.objects.filter(course=course).values_list("id", flat=True)), [modules[2].id, modules[0].id, modules[1].id])
        self.assertEqual(self.instructor.post("/api/modules/reorder/", {
            "course": course.id, "module_ids": [modules[0].id],
        }, format="json").status_code, 400)

        lesson_rows = [
            Lesson.objects.create(module=modules[0], title=f"Lesson {index}", order=index)
            for index in (1, 2, 3)
        ]
        response = self.instructor.post(f"/api/modules/{modules[0].id}/reorder-lessons/", {
            "lesson_ids": [lesson_rows[1].id, lesson_rows[2].id, lesson_rows[0].id],
        }, format="json")
        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(list(Lesson.objects.filter(module=modules[0]).values_list("id", flat=True)), [lesson_rows[1].id, lesson_rows[2].id, lesson_rows[0].id])

    def test_deleting_module_cascades_lessons_and_activities(self):
        module = Module.objects.get(pk=self.world.m1.id)
        lesson_count = Lesson.objects.filter(module=module).count()
        activity_count = Activity.objects.filter(lesson__module=module).count()

        response = self.instructor.delete(f"/api/modules/{module.id}/")

        self.assertEqual(response.status_code, 204)
        self.assertFalse(Module.objects.filter(pk=module.id).exists())
        self.assertEqual(Lesson.objects.filter(module_id=module.id).count(), 0)
        self.assertGreater(lesson_count, 0)
        self.assertGreater(activity_count, 0)
        self.assertFalse(Activity.objects.filter(lesson__module_id=module.id).exists())

    def test_uploaded_video_is_validated_and_served_with_byte_ranges(self):
        video = SimpleUploadedFile("lesson.mp4", b"\x00\x00\x00\x18ftypisom" + b"0" * 64, content_type="video/mp4")
        response = self.instructor.post("/api/lessons/", {
            "module": self.world.m1.id,
            "title": "Uploaded video",
            "order": 2,
            "video_file": video,
        }, format="multipart")
        self.assertEqual(response.status_code, 201, response.data)
        self.assertTrue(response.data["video_file_url"])
        lesson_id = response.data["id"]

        streamed = self.student.get(response.data["video_file_url"], HTTP_RANGE="bytes=0-7")
        self.assertEqual(streamed.status_code, 206)
        self.assertEqual(len(b"".join(streamed.streaming_content)), 8)
        self.assertEqual(streamed["Content-Range"], "bytes 0-7/76")
        self.assertEqual(client_for(self.world.outsider).get(response.data["video_file_url"]).status_code, 404)

        bad_video = SimpleUploadedFile("fake.mp4", b"not a video", content_type="video/mp4")
        rejected = self.instructor.post("/api/lessons/", {
            "module": self.world.m1.id,
            "title": "Invalid upload",
            "order": 3,
            "video_file": bad_video,
        }, format="multipart")
        self.assertEqual(rejected.status_code, 400)
        self.assertFalse(Lesson.objects.filter(pk=lesson_id + 1).exists())
