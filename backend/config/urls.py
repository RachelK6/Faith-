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
    path("api/engagement/", include("apps.engagement.urls")),
    path("api/risk/", include("apps.risk.urls")),
    path("api/sequencing/", include("apps.sequencing.urls")),
    path("api/allocation/", include("apps.allocation.urls")),
]

if settings.DEBUG:
    # Dev-only. Serve ONLY public assets (course cover images). Submissions and
    # lesson PDFs are private: they're delivered by authenticated API endpoints
    # (/api/submissions/<id>/download/, /api/lesson-attachments/<id>/download/)
    # that re-check enrollment, module locking and ownership. In production make
    # sure nginx/object storage exposes course_covers/ only.
    from django.urls import re_path
    from django.views.static import serve

    urlpatterns += [
        re_path(r"^media/(?P<path>course_covers/.*)$", serve, {"document_root": settings.MEDIA_ROOT}),
    ]
