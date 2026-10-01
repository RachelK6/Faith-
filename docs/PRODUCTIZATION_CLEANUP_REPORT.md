# Optimum LMS Productization Cleanup Report

**Status date:** 2026-10-02
**Database target:** Microsoft SQL Server only, per the latest user direction. This supersedes the PostgreSQL target in the original request and is also recorded in `PRODUCTIZATION_AUDIT.md`.

## Implemented

- Replaced fabricated student dashboard fixtures/fallbacks with real account/dashboard API data, loading/error/retry/empty states, current course/module/lesson, actual module progress, recent grades, and upcoming deadlines.
- Extended the student dashboard API with ordered module statuses and the current unlocked lesson. Upcoming deadlines are limited to enrolled courses, exclude completed work, and exclude locked modules.
- Added a persisted engagement domain for activity/course badges and milestones, streaks based on successful work and verified video watch time, and recipient-scoped in-app notifications for awards, grades, quizzes, streak activity, and certificate events.
- Added certificate eligibility, automatic course-completion issuance, instructor/admin issue and revoke APIs, revocation audit fields, retained history/reissue behavior, generated PDF downloads, and student/instructor dashboard controls.
- Enhanced the module-record-backed learning path with adaptive staggered entry and current/completed/locked status styling; preserved the existing module order, locking, navigation, and progress calculations.
- Removed instructor/admin fake people, submission totals, and risk records; failures now use their existing retryable error states. Risk UI identifies the current model as experimental and synthetic-data-trained.
- Replaced the fixed SVG path with a horizontally scalable semantic module list, completion/current/locked/failed/mastered states, status icon registry, node/connector animations, and keyboard focus ring. Per latest instruction, learning-path animation is not disabled by reduced-motion preference.
- Added the requested Lucide registry (`video`, `course`, `module`, `lab`, `quiz`, `assignment`, `certificate`, `project`, `discussion`, `notification`, `progress`) with BookOpen fallback and once-per-type warning.
- Removed emoji status/success UI, fake notification unread indicator/read action, unused local code-evaluation/schedule/focus-timer demo components, unsupported landing-page numeric claims, and the remaining sample course/module strip.
- Added explicit video loading, buffering, missing, offline, progress API failure, and retry feedback. Playback continues if progress heartbeats fail; the warning notes that resume data may be stale.
- Aligned shared brand tokens with Optimum's primary/deep/light blue, neutral, success, warning, and danger colors.
- Made Django use only the MSSQL backend, restored `mssql-django`/`pyodbc`, restored the ODBC Docker installation, and aligned `.env` examples, Compose, setup, container, production, backend, and architecture docs.
- Completed the instructor Course Content workflow: existing courses are prominent management cards; create/edit course details; draft/publish validation; module and lesson creation, exact-permutation reordering, and cascade deletion; lesson notes/objectives; YouTube/Vimeo/direct HTTPS links and validated uploaded videos; PDF resources; assignment/lab/exercise and atomic quiz/question authoring; and student preview.
- Added a course-first student learning flow with course/module outline, lesson navigation, embedded video, notes, resources, assessments, and existing progress tracking.
- Fixed instructor dashboard risk-model failure isolation. A corrupted optional XGBoost artifact now returns a clear `503` for risk insights instead of a generic dashboard request failure; course management and grading APIs remain available.
- Created and published an original MSSQL verification course, **Email Threat Defense: Mail Security Foundations** (course 4), using authenticated course/module/lesson/activity/quiz APIs. It has 3 modules, 4 lessons, a CISA phishing-awareness video link, a 3-question quiz, an assignment, and a lab. An existing student account enrolled and completed the API workflow through quiz, submissions, grading, module progress, dashboard visibility, and automatic certificate issuance.

## Deleted Files

- `backend/db.sqlite3`: removed after a read-only inventory. All 24 tables had zero application records; nonempty rows were limited to Django migrations, content types, and permissions. The active MSSQL database has 11 users, 2 courses, and 2 enrollments, and all migrations are already applied.
- `frontend/src/api/modules.js`: no active source callers.
- `frontend/src/components/CodeLabModal.jsx`: disconnected demo runner using local `new Function` and canned tests.
- `frontend/src/components/ScheduleModal.jsx`: disconnected fixed-date sample schedule.
- `frontend/src/components/FocusTimer.jsx`: disconnected timer with a fabricated completed-session count.
- `frontend/public/dashboard-admin.png`, `dashboard-instructor.png`, `dashboard-student.png`: no active source references.

Added the `engagement` app and migrations `0001_initial`/`0002_achievement_catalog_and_certificate_history`. The latter seeds the initial achievement catalog and retains certificate history by removing the previous one-certificate-per-course constraint. Added course migration `0006_course_publishing_and_video_uploads` for draft/published state and uploaded lesson-video storage; it is applied to the configured MSSQL database. Existing registered accounts and passwords were not modified. The verification flow added the course and course-related enrollment, quiz attempt, graded submissions, activity completions, and issued certificate through application APIs; no direct SQL data edits were used.

## Dependency Report

- No frontend package dependency was added or upgraded; existing Lucide React is used.
- Added `reportlab>=4.2,<5` for generated certificate PDFs; installed it in the active local root `venv` for validation. The referenced `backend/venv` task environment does not exist in this checkout.
- Backend runtime remains on `mssql-django==1.8.0` and `pyodbc==5.3.0`; SQLite and PostgreSQL drivers are not in `requirements.txt`.
- `psycopg` was temporarily installed during the superseded PostgreSQL attempt, then uninstalled after the target changed to MSSQL. Windows kept two pip temporary DLL directories locked in the ignored project virtual environment; they are not project dependencies or tracked source files.

## Verification

- `python manage.py check`: pass on MSSQL configuration.
- `python manage.py makemigrations --check`: pass, no changes detected.
- Live MSSQL API flow passed: create/publish course, student catalog/detail visibility, lesson/video URL, quiz pass, assignment and lab submission/grading, all three module statuses complete, student dashboard includes the course, and certificate issued. The test student did not actually play the external YouTube video, so its watch-progress row remains absent as expected.
- Existing course ID 3 (`web dev testing`) was confirmed published and returned by both the instructor dashboard and course list APIs for its owner. Course Content now shows existing courses first with explicit **Manage course** controls.
- Risk endpoint fault injection via the current corrupt `risk_model.joblib`: `/api/dashboard/instructor/` returned `200`; `/api/risk/cohort/` now returns the documented `503` and logs the deserialization exception.
- Frontend lint/build pass after course-first UI and student lesson navigation changes. The course-builder backend regression command was skipped and is not reported as passing.
- Existing learning-loop tests: 6 passed on isolated in-memory SQLite after the completion hooks were added. Focused certificate PDF download test: 1 passed on isolated SQLite. The broader engagement and video-streak test reruns were skipped; they are not reported as passing.
- `python manage.py showmigrations --plan`: all listed migrations already applied.
- 158 backend tests passed as the pre-change baseline; 3 focused dashboard path/deadline tests passed against isolated SQLite before the MSSQL-only runtime switch.
- A post-switch focused MSSQL test attempt did not execute tests: the SQL login cannot create/drop `test_optimum_erp_lms` in `master`. No application DB changes were made. A disposable MSSQL test database/login with CREATE DATABASE permission is required for post-change backend tests.
- `npm run lint`: pass.
- `npm run build`: pass.
- Docker Compose runtime validation is unavailable in this environment because Docker is not installed. The MSSQL service is external in the current deployment template.
- Browser smoke: a fresh Vite page loaded with title `Optimum ERP LMS`; the landing view rendered without the deleted sample course/module rows. The active browser page remains available at `http://localhost:5173/`.

## Remaining Product Gaps

- Weekly goals still require explicit goal rules and tracking; streaks now record verified study days but are not weekly-goal tracking.
- Notification delivery is in-app only; email, push, and operational retry/retention policies are not implemented.
- Achievement thresholds and certificate policy are an initial product baseline and should be reviewed before production-wide issuance.
- The learning-path animation is presentation-only; it does not adapt sequence or difficulty based on learner performance. The student lesson page now provides a module outline and previous/next navigation while module ordering/access continue to use course records and existing locking rules.
- Video position/watch/completion persistence exists for YouTube and direct video files; Vimeo playback is not trackable. Network failure keeps playback usable but can leave progress unsaved.
- Risk-engine labels are synthetic and snapshot engagement fields are partly heuristic. Treat risk output as experimental, not an academic decision. The checked-in local XGBoost model artifact currently fails to deserialize; the dashboard isolates this as an unavailable optional risk panel, but the model must be retrained/replaced before risk scoring can be used.
- PostgreSQL was removed from the runtime because the latest instruction selected MSSQL. Confirm the deployment SQL Server host/credentials and configure ODBC Driver 18 in the actual backend host/container.
- The full accessibility checklist in the original request was truncated after “Keyboard”; contrast and assistive-technology sign-off are therefore not complete.
- Future-client deployment tenancy (isolated deployment per customer versus shared multi-tenancy) remains a product/architecture decision; current schema is single-tenant.
