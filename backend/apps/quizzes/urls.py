from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import QuizViewSet, SubmitQuizView, QuizAttemptViewSet

router = DefaultRouter()
router.register("quizzes", QuizViewSet, basename="quiz")
router.register("quiz-attempts", QuizAttemptViewSet, basename="quiz-attempt")

urlpatterns = router.urls + [
    path("quizzes/<int:quiz_id>/submit/", SubmitQuizView.as_view(), name="quiz-submit"),
]
