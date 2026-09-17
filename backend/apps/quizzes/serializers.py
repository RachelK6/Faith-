from rest_framework import serializers

from .models import Quiz, Question, QuizAttempt


class QuestionForStudentSerializer(serializers.ModelSerializer):
    """Hides correct_choice_index — students shouldn't see the answer key."""
    class Meta:
        model = Question
        fields = ["id", "text", "marks", "choices"]


class QuestionForInstructorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Question
        fields = ["id", "quiz", "text", "marks", "choices", "correct_choice_index"]


class QuizSerializer(serializers.ModelSerializer):
    questions = QuestionForStudentSerializer(many=True, read_only=True)

    class Meta:
        model = Quiz
        fields = ["id", "activity", "time_limit_minutes", "pass_mark_percentage", "questions"]


class SubmitQuizSerializer(serializers.Serializer):
    """body: {"answers": {"<question_id>": <choice_index>, ...}}"""
    answers = serializers.DictField(child=serializers.IntegerField())


class QuizAttemptSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuizAttempt
        fields = [
            "id", "student", "quiz", "attempt_number", "answers",
            "score", "total_marks", "percentage", "passed", "submitted_at",
        ]
        read_only_fields = fields
