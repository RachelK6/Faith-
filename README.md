# Optimum ERP LMS

A web-based coding e-learning platform — LMS + assessment platform in one.
Structured lessons, an in-browser code editor, daily labs, quizzes, and
server-enforced module progression.

```
optimum-erp-lms/
├── backend/          Django + DRF API (see backend/README.md)
├── frontend/          React + Vite + Tailwind (see frontend/README.md)
└── DATABASE_SETUP.md  SQL Server setup and migration guidance
```

## Quick start (local development)

### macOS / Linux (bash)
```bash
# 1. Backend
cd backend
python3 -m venv venv && source venv/bin/activate
python3 -m pip install -r requirements.txt
cp .env.example .env
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver

# 2. Frontend — in a second terminal
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

### Windows (PowerShell)
```powershell
# 1. Backend
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
Copy-Item .env.example .env
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver

# 2. Frontend — in a second terminal
cd frontend
npm install
Copy-Item .env.example .env.local
npm run dev
```

**If `Activate.ps1` fails with "running scripts is disabled on this system"**: PowerShell
blocks script execution by default. Run this once (as your normal user, not admin):
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```
Then re-run the activate command. This only relaxes the policy for your user account, not
system-wide.

### Windows (cmd.exe)
Same as PowerShell above, except activation is:
```cmd
venv\Scripts\activate.bat
```
and use `copy` instead of `Copy-Item`:
```cmd
copy .env.example .env
```

Frontend: `http://localhost:5173`
Backend API: `http://localhost:8000/api`
Django admin: `http://localhost:8000/admin`

## Database

The backend uses Microsoft SQL Server in every environment. Install ODBC Driver 18 and configure the `MSSQL_*` settings in `backend/.env`; see **[DATABASE_SETUP.md](./DATABASE_SETUP.md)** for local, Docker, production, and existing-data migration steps.

## Security notes

- Module locking (a student can't access content or submit work for a
  module they haven't unlocked) is enforced **server-side**, verified by
  testing direct API access — see `backend/README.md` for what was tested.
- Public registration always creates a `student` account; instructor/admin
  accounts are created through Django admin by an existing admin.
- Login/register are rate-limited (10/minute) against brute-force attempts.
- HTTPS, HSTS, and secure cookies auto-enable in production
  (`DJANGO_DEBUG=False`) — see `backend/config/settings.py`.

## Further reading

- **[docs/API_REFERENCE.md](./docs/API_REFERENCE.md)** — every endpoint,
  request/response shapes, auth requirements, and exactly how
  module-locking is enforced server-side (verified against the actual
  code, not written from memory)
- **[docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)** — system diagrams,
  why the backend is split the way it is, data model, deployment topology
- `backend/README.md` — what's implemented vs. stubbed, the permission
  pattern used across every app
- `DATABASE_SETUP.md` — SQL Server configuration and safe data migration
