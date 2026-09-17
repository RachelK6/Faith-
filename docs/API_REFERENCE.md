# API Reference — Optimum ERP LMS

Base URL: `http://localhost:8000/api` (local) — swap for your real domain
in production, always over HTTPS.

Every field name below is taken directly from the serializers in the
codebase, not written from memory — if something changes in the code,
update it here too.

## Conventions used throughout this doc

- 🔒 = requires `Authorization: Bearer <access_token>` header
- Role column shows who can call it: **Any** (any logged-in user),
  **Student**, **Instructor**, **Admin**, or a combination
- Request/response bodies are JSON unless noted
- All list endpoints support standard DRF pagination unless noted

---

## Authentication

JWT-based. Access tokens last 24 hours, refresh tokens last 7 days
(`config/settings.py` → `SIMPLE_JWT`). The access token's payload embeds
`role` and `email`, so the frontend can route by role without an extra
API call.

### `POST /api/auth/register/`
Public. Rate-limited to 10 requests/minute per IP.

**Always creates a `student` account** — `role` is not an accepted field
here, regardless of what's sent in the body. This is deliberate (see
`backend/README.md` for why). Instructor/admin accounts are created via
Django admin.

Request:
```json
{
  "username": "bkimani",
  "email": "bkimani@example.com",
  "password": "at-least-8-characters",
  "first_name": "Brian",
  "last_name": "Kimani"
}
```

Response `201`:
```json
{ "id": 4, "username": "bkimani", "email": "bkimani@example.com", "first_name": "Brian", "last_name": "Kimani" }
```

### `POST /api/auth/login/`
Public. Rate-limited to 10 requests/minute per IP. Logs in with **email**,
not username.

Request:
```json
{ "email": "bkimani@example.com", "password": "..." }
```

Response `200`:
```json
{ "access": "<jwt>", "refresh": "<jwt>" }
```
Decode the `access` token client-side to read `role` and `email` — see
`frontend/src/lib/api.js` → `decodeToken()`.

### `POST /api/auth/login/refresh/`
Public. Exchange a refresh token for a new access token.

Request: `{ "refresh": "<refresh_token>" }`
Response: `{ "access": "<new_access_token>" }`

### `GET /api/auth/me/` 🔒 — Any
Returns the logged-in user.

Response:
```json
{ "id": 4, "username": "bkimani", "email": "...", "first_name": "Brian", "last_name": "Kimani", "role": "student" }
```

---

## Courses

Read access: any authenticated user. Write access: instructor/admin only
(`ReadOnlyOrInstructorAdmin` permission — same pattern reused across every
app below marked "Instructor/Admin write").

**Important**: for `lessons` and `activities`, a student's GET requests are
additionally filtered so locked-module content never comes back — see
"Module locking enforcement" section below. This isn't optional metadata,
it's the actual security boundary.

### `GET /api/courses/` 🔒 — Any
List all courses.
```json
[{ "id": 1, "title": "Full-Stack Web Development", "description": "...", "instructor": 2, "instructor_name": "Jane Smith", "module_count": 10, "created_at": "..." }]
```

### `POST /api/courses/` 🔒 — Instructor/Admin
```json
{ "title": "Full-Stack Web Development", "description": "..." }
```
`instructor` is set automatically to whoever's logged in — not accepted
in the request body.

### `GET /api/courses/{id}/` 🔒 — Any
Returns the course plus a lightweight list of its modules (no nested
lessons — fetch those separately per module to avoid one giant payload).

### `PUT` / `PATCH` / `DELETE /api/courses/{id}/` 🔒 — Instructor/Admin

### `GET /api/modules/?course={id}` 🔒 — Any
Module titles/order are visible even when locked for a student — a
student needs to see "React — locked" in a sidebar. Only the *content
inside* a locked module (its lessons/activities) is withheld.
```json
[{ "id": 5, "course": 1, "title": "JavaScript", "order": 3 }]
```

### `POST /api/modules/` 🔒 — Instructor/Admin
```json
{ "course": 1, "title": "JavaScript", "order": 3 }
```
`order` must be unique per course — this is what module-locking checks
against (module 3 unlocks once module 2 is complete).

### `GET /api/lessons/?module={id}` 🔒 — Any (filtered for students, see below)
```json
[{
  "id": 12, "module": 5, "title": "Functions & Scope", "order": 2,
  "learning_objectives": "...", "video_url": "...", "tutorial_content": "...",
  "activities": [ /* nested ActivitySerializer objects */ ]
}]
```

### `POST /api/lessons/` 🔒 — Instructor/Admin

### `GET /api/activities/?lesson={id}` 🔒 — Any (filtered for students, see below)
```json
[{
  "id": 20, "lesson": 12, "activity_type": "exercise", "title": "Sum two numbers",
  "instructions": "...", "max_score": 100, "max_attempts": 1, "deadline": null,
  "is_required": true, "starter_code": "function sum(a, b) {}", "test_cases": [{"input": [2,3], "expected_output": 5}]
}]
```
`activity_type` is one of: `exercise`, `lab`, `quiz`, `assignment`.

### `POST /api/activities/` 🔒 — Instructor/Admin

---

## Enrollment

### `GET /api/enrollments/` 🔒 — Any
Students see only their own enrollments. Instructors/admins can filter
with `?course={id}` to see everyone enrolled in a course they teach.

### `POST /api/enrollments/` 🔒 — Student only
```json
{ "course": 1 }
```
`student` is set automatically. A non-student calling this gets a `400`
validation error, not silently ignored.

---

## Progress / module locking

This is the enforcement layer for brief section 4. Read
`backend/apps/progress/services.py` for the actual logic
(`is_module_unlocked`, `is_module_complete`) — these endpoints just expose
it over HTTP.

### `GET /api/progress/course/{course_id}/` 🔒 — Any
Returns every module in the course with the current user's status.
```json
[
  { "module_id": 5, "title": "HTML Fundamentals", "order": 1, "status": "done" },
  { "module_id": 6, "title": "CSS Fundamentals", "order": 2, "status": "active" },
  { "module_id": 7, "title": "JavaScript", "order": 3, "status": "locked" }
]
```
`status` is one of `done` / `active` / `locked`.

### `GET /api/progress/can-access/{module_id}/` 🔒 — Any
A direct yes/no check, for anything that needs to gate access without
pulling the whole course's progress.
```json
{ "module_id": 7, "unlocked": false }
```

---

## Submissions

### `GET /api/submissions/?activity={id}&status={status}` 🔒 — Any
Students see only their own. Instructors see all for activities in
courses they teach.

### `POST /api/submissions/` 🔒 — Student only
```json
{ "activity": 20, "content": "...", "github_url": "https://github.com/...", "file": null }
```
Two server-side checks fire here, both proven by direct testing:
- **Attempt limit**: rejected with `400` if the student has already used
  `activity.max_attempts` submissions for this activity.
- **Module lock**: rejected with `403` if the activity's module isn't
  unlocked yet — even if the student somehow knows the activity ID.

Response includes `attempt_number` (server-assigned, not something you
send) and `status: "submitted"`.

### `PATCH /api/submissions/{id}/grade/` 🔒 — Instructor/Admin
```json
{ "grade": 9, "feedback": "Solid work, watch your indentation." }
```
Grading here is what marks the underlying activity complete for progress
tracking — this is the trigger that can unlock the student's next module.

---

## Quizzes

### `GET /api/quizzes/?activity={id}` 🔒 — Any
Students get `QuestionForStudentSerializer` shape — **`correct_choice_index`
is never sent to a student**, only `choices` (the options) and `text`.
```json
{
  "id": 3, "activity": 22, "time_limit_minutes": 10, "pass_mark_percentage": 70,
  "questions": [{ "id": 1, "text": "Which property sets text color?", "marks": 1, "choices": [{"text": "background-color"}, {"text": "color"}] }]
}
```

### `POST /api/quizzes/` 🔒 — Instructor/Admin
```json
{ "activity": 22, "time_limit_minutes": 10, "pass_mark_percentage": 70 }
```
Questions aren't created through this endpoint yet — see "Known gaps"
below.

### `POST /api/quizzes/{quiz_id}/submit/` 🔒 — Student only
```json
{ "answers": { "1": 1, "2": 0 } }
```
Keys are question IDs (as strings, since JSON object keys are always
strings), values are the chosen choice's index.

Auto-graded immediately. Response:
```json
{ "id": 8, "student": 4, "quiz": 3, "attempt_number": 1, "answers": {"1": 1}, "score": 1, "total_marks": 1, "percentage": 100.0, "passed": true, "submitted_at": "..." }
```
If `passed` is `true`, the underlying activity is marked complete —
verified live: a wrong answer does not unlock the next module, a
subsequent correct attempt (within `max_attempts`) does.

Same module-lock and attempt-limit checks as submissions, enforced the
same way.

---

## Code execution

Thin proxy to an external sandbox service (`SANDBOX_URL` in settings) —
**this app does not execute code itself**, by design (see brief section 6
on isolation). No sandbox service exists yet; these endpoints will 503
until one is stood up. See `backend/README.md` → "What's stubbed."

### `POST /api/execute/run/` 🔒 — Any
```json
{ "language": "javascript", "code": "console.log(1+1)", "stdin": "" }
```
Forwards to `{SANDBOX_URL}/run` and returns whatever that service says.

### `POST /api/execute/test/` 🔒 — Any
```json
{ "language": "javascript", "code": "...", "activity_id": 20 }
```
Loads `test_cases` from the given activity and forwards to
`{SANDBOX_URL}/test`.

---

## Dashboards

Read-only aggregation — these don't own any data, just assemble it from
the apps above. Field shapes below are exactly what
`StudentDashboard.jsx` / `InstructorDashboard.jsx` consume.

### `GET /api/dashboard/student/` 🔒 — Any
```json
{
  "enrolled_courses": [
    { "course_id": 1, "course_title": "Full-Stack Web Development", "progress_percent": 42, "current_module": "JavaScript", "completed": false }
  ],
  "pending_labs": 2,
  "recent_grades": [
    { "activity": "CSS Flexbox Lab", "grade": 9.0, "feedback": "Solid work." }
  ]
}
```

### `GET /api/dashboard/instructor/` 🔒 — Instructor/Admin
```json
{
  "pending_submissions": [
    { "submission_id": 14, "student": "Brian Kimani", "activity": "CSS Flexbox Lab", "course": "Full-Stack Web Development", "submitted_at": "..." }
  ],
  "pending_submission_count": 14,
  "students_falling_behind": [
    { "student": "David Mwangi", "course": "Full-Stack Web Development" }
  ],
  "my_courses": [{ "id": 1, "title": "Full-Stack Web Development" }]
}
```
"Falling behind" = enrolled, but no completed activity in the last 7
days. See `backend/README.md` for the scaling caveat on this query.

### `GET /api/dashboard/admin/` 🔒 — Admin only
```json
{
  "total_students": 128, "total_instructors": 6, "total_courses": 4,
  "active_enrollments": 340, "pending_submissions": 22
}
```

---

## Module-locking enforcement (read this before building against locked content)

Three separate places check `is_module_unlocked()`, all verified by direct
testing (not just written and assumed correct):

1. **`GET /api/lessons/` and `/api/activities/`** — a student's queryset is
   filtered to only unlocked modules. A locked lesson fetched directly by
   ID returns `404` (not `403` — deliberately doesn't confirm the lesson
   exists to someone probing IDs).
2. **`POST /api/submissions/`** — rejected with `403` if the activity's
   module is locked, even if the student already knows the activity ID.
3. **`POST /api/quizzes/{id}/submit/`** — same `403` check.

If you add a new way to read or write activity-linked content, apply the
same check — import `is_module_unlocked` from
`apps.progress.services` and use the existing pattern in
`apps/submissions/views.py` as a template.

---

## Known gaps (as of this doc)

- No dedicated "create quiz question" endpoint — done via Django shell
  during testing. Needs a `QuestionViewSet` before instructors can build
  quizzes through the UI.
- No file-size/type validation on `Submission.file`.
- `/api/execute/*` has nothing to actually call yet (sandbox not built).

For anything not covered here, the Django admin (`/admin/`) exposes every
model directly and is the fastest way to inspect real data while
building against this API.
