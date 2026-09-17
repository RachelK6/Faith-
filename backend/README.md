# Coding E-Learning Platform — Django Backend

Django + Django REST Framework, one app per domain (matches the project brief
1:1): `accounts`, `courses`, `enrollment`, `progress`, `submissions`,
`quizzes`, `execution`, `dashboards`.

## Setup

```bash
cd django_backend
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env            # edit DJANGO_SECRET_KEY at minimum
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

API is at `http://localhost:8000/api/`. Django admin (for creating
instructor/admin accounts — see security note below) is at
`http://localhost:8000/admin/`.

## Switching to real SQL Server

This ships defaulting to SQLite so it runs with zero setup. To point it at
real SQL Server:

1. Install the ODBC driver on the machine running this (not a Python
   package — a system driver):
   - **Ubuntu/Debian**: follow Microsoft's `msodbcsql18` install docs for
     your distro (adds Microsoft's apt repo, then `apt install msodbcsql18`)
   - **macOS**: `brew install msodbcsql18` (via `brew tap microsoft/mssql-release`)
   - **Windows**: usually already present, or install from Microsoft's
     "ODBC Driver for SQL Server" download page
2. In `.env`, set `DB_ENGINE=mssql` and fill in `MSSQL_DB_NAME`,
   `MSSQL_DB_USER`, `MSSQL_DB_PASSWORD`, `MSSQL_DB_HOST`, `MSSQL_DB_PORT`.
3. If your driver has a different exact name (check with
   `odbcinst -q -d` on Linux/Mac), set `MSSQL_ODBC_DRIVER` to match —
   it must match exactly, including the version number.
4. Run `python manage.py migrate` again against the new database.

**I could not test the actual MSSQL connection in the environment this was
built in** — no network access to a SQL Server instance. The Django/model
code is identical either way (that's the point of Django's ORM), and
`mssql-django` is Microsoft's own maintained backend, but budget time to
verify the real connection string and driver name on your machine before
trusting it in front of the client.

## What's implemented and verified

Every endpoint below was tested against a running server, not just written:

- **Auth**: register (student-only, see security note), login (JWT, role
  embedded in token), token refresh, `/me/`
- **Courses**: full CRUD for Course → Module → Lesson → Activity,
  instructor-only writes, verified a student gets 403 trying to write
- **Enrollment**: student self-enrolls
- **Progress / module locking**: verified live — Module 2 was `locked`
  before Module 1's activity was graded, `active` after, and `done` once
  its own required activity (a quiz) was passed. This is the brief's
  section 4 requirement, enforced server-side.
- **Submissions**: attempt limiting verified (2nd submission on a
  `max_attempts=1` activity correctly rejected with 400); grading
  triggers module-completion
- **Quizzes**: auto-grading verified — wrong answer scored 0% and did not
  unlock the next module; correct answer on a later attempt scored 100%
  and did unlock it
- **Dashboards**: all three (student/instructor/admin) return real
  aggregated data from a real multi-step scenario, and cross-role access
  is blocked (student → admin dashboard = 403)

## What's stubbed / needs more work

- **`execution` app**: forwards to an external `SANDBOX_URL` — no sandbox
  service exists yet. This needs to be a separate piece of infrastructure
  (Judge0, Piston, or a custom Docker-based runner), not code inside this
  repo. See the docstring in `apps/execution/views.py`.
- **Question creation**: there's no dedicated "add question to quiz"
  endpoint yet — during testing this was done via Django shell. Add a
  `QuestionViewSet` (same `ReadOnlyOrInstructorAdmin` pattern as courses)
  before instructors need to build real quizzes through the UI.
- **"Falling behind" definition** in the instructor dashboard (no
  completed activity in 7 days) is a real, working first pass — loops over
  every enrolled student per course. Fine at small scale; revisit with a
  cached/precomputed version before 3,000 students make that loop slow.
- No file-upload validation (type/size limits) on `Submission.file` yet.
- Production requires real `DJANGO_SECRET_KEY`, host, and CORS values; startup fails closed when they are missing.
- Production also refuses to start with SQLite; set `DB_ENGINE=mssql` and provide the SQL Server connection values.
- Refresh tokens rotate and are blacklisted after use; clients should call `/api/auth/logout/` before clearing a session.
- Public signup creates students only. Administrators can create instructor and admin accounts at `/admin/`, where the platform role is explicitly selectable.
- The first account created with `createsuperuser` is automatically assigned the `admin` platform role.

## Important security fix made during testing

The original `RegisterSerializer` accepted a `role` field in the request
body — meaning anyone could `POST /api/auth/register/` with
`"role": "admin"` and get an admin account. **This was caught and fixed**:
public registration now always creates a `student` account regardless of
what's sent. Instructor and admin accounts must be created through
`/admin/` by someone who already has admin access. If you ever add a
"create instructor" flow to the product later, make sure it's gated behind
an existing admin's session — don't reopen this field on the public
endpoint.

## Role-based permission pattern

Every app reuses the same permission classes from `apps/accounts/permissions.py`:

```python
from apps.accounts.permissions import ReadOnlyOrInstructorAdmin, IsInstructorOrAdmin, IsAdmin

class SomeViewSet(viewsets.ModelViewSet):
    permission_classes = [ReadOnlyOrInstructorAdmin]  # anyone reads, only instructor/admin writes
```

## Notes

- `AUTH_USER_MODEL` is a custom `User` (email login, `role` field) — this
  was set before the first migration, which is required in Django;
  swapping user models later means rebuilding migrations from scratch.
- Progress/locking logic lives in `apps/progress/services.py` as plain
  functions (`is_module_unlocked`, `is_module_complete`,
  `mark_activity_complete`), not buried inside a view — `submissions` and
  `quizzes` import and call `mark_activity_complete` directly when work
  passes, rather than each app re-implementing completion logic.
