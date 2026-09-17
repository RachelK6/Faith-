from django.urls import path

from .views import CourseProgressView, ModuleAccessCheckView

urlpatterns = [
    path("course/<int:course_id>/", CourseProgressView.as_view(), name="course-progress"),
    path("can-access/<int:module_id>/", ModuleAccessCheckView.as_view(), name="module-access-check"),
]
