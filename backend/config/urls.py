from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import path, include

admin.site.site_header = "Optimum ERP LMS Administration"
admin.site.site_title = "Optimum ERP LMS Admin"
admin.site.index_title = "Platform Administration"

urlpatterns = [
    path("admin/", admin.site.urls),

    path("api/auth/", include("apps.accounts.urls")),
    path("api/", include("apps.courses.urls")),
    path("api/", include("apps.enrollment.urls")),
    path("api/progress/", include("apps.progress.urls")),
    path("api/", include("apps.submissions.urls")),
    path("api/", include("apps.quizzes.urls")),
    path("api/execute/", include("apps.execution.urls")),
    path("api/dashboard/", include("apps.dashboards.urls")),
]

if settings.DEBUG:
    # Dev-only: Django serves uploaded PDFs itself so they're reachable
    # at MEDIA_URL. In production, a real web server (nginx) or object
    # storage (S3/Azure Blob) should serve these instead — Django serving
    # media files itself in production is both slow and not what
    # SecurityMiddleware/staticfiles are designed for.
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
