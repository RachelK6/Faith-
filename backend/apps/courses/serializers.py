from rest_framework import serializers

from .models import Course, Module, Lesson, Activity, LessonAttachment


class LessonAttachmentSerializer(serializers.ModelSerializer):
    uploaded_by_name = serializers.CharField(source="uploaded_by.get_full_name", read_only=True)

    class Meta:
        model = LessonAttachment
        fields = ["id", "lesson", "title", "file", "uploaded_by_name", "uploaded_at"]
        read_only_fields = ["uploaded_by_name", "uploaded_at"]


class ActivitySerializer(serializers.ModelSerializer):
    quiz_id = serializers.SerializerMethodField()

    class Meta:
        model = Activity
        fields = [
            "id", "lesson", "activity_type", "title", "instructions",
            "max_score", "max_attempts", "deadline", "is_required",
            "starter_code", "test_cases", "quiz_id",
        ]

    def get_quiz_id(self, obj):
        # Activity -> Quiz is a one-to-one (see quizzes/models.py); only
        # activity_type='quiz' rows actually have one. Avoids a second
        # round trip from the frontend just to find "the quiz for this
        # activity" when rendering a lesson page.
        quiz = getattr(obj, "quiz", None)
        return quiz.id if quiz else None


class LessonSerializer(serializers.ModelSerializer):
    activities = ActivitySerializer(many=True, read_only=True)
    attachments = LessonAttachmentSerializer(many=True, read_only=True)

    class Meta:
        model = Lesson
        fields = [
            "id", "module", "title", "order", "learning_objectives",
            "video_url", "tutorial_content", "activities", "attachments",
        ]


class ModuleSerializer(serializers.ModelSerializer):
    lessons = LessonSerializer(many=True, read_only=True)

    class Meta:
        model = Module
        fields = ["id", "course", "title", "order", "lessons"]


class ModuleListSerializer(serializers.ModelSerializer):
    """Lighter version for list views — no nested lessons."""
    class Meta:
        model = Module
        fields = ["id", "course", "title", "order"]


class CourseSerializer(serializers.ModelSerializer):
    instructor_name = serializers.CharField(source="instructor.get_full_name", read_only=True)
    module_count = serializers.IntegerField(source="modules.count", read_only=True)
    thumbnail_url = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = [
            "id", "title", "description", "instructor", "instructor_name",
            "module_count", "thumbnail", "thumbnail_url", "created_at"
        ]
        read_only_fields = ["instructor", "thumbnail_url"]

    def get_thumbnail_url(self, obj):
        if not obj.thumbnail:
            return None

        url = obj.thumbnail.url
        request = self.context.get("request")
        if request:
            return request.build_absolute_uri(url)

        if url.startswith("http"):
            return url

        base_url = "http://localhost:8000"
        return f"{base_url}{url if url.startswith('/') else '/' + url}"


class CourseDetailSerializer(CourseSerializer):
    modules = ModuleListSerializer(many=True, read_only=True)

    class Meta(CourseSerializer.Meta):
        fields = CourseSerializer.Meta.fields + ["modules"]
