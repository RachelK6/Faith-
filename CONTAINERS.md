# Running in containers

**What runs where**

| Piece | Where | Why |
|---|---|---|
| React app (nginx) | container `frontend`, port **8080** | static files + reverse proxy to the API |
| Django API (gunicorn) | container `backend`, not published | only reachable through nginx |
| Code runner | container `sandbox`, **internal network only** | untrusted code never touches the internet, DB or your files |
| **Microsoft SQL Server** | **outside Docker** (host or a managed server) | the application connects through ODBC; data survives container rebuilds |

Containers hold code + dependencies only. Secrets are read from `backend/.env.docker` at start-up
(git-ignored, excluded from the image by `.dockerignore`). Never bake passwords into an image.

## First run

```bash
cp backend/.env.docker.example backend/.env.docker      # fill in real values
export SANDBOX_TOKEN=$(openssl rand -hex 32)             # one secret, shared by backend + sandbox
docker compose up --build -d
docker compose run --rm backend python manage.py migrate # NEW migrations are included — run this
docker compose run --rm backend python manage.py createsuperuser   # if you need one
```

Open http://localhost:8080. For a quick **local trial over plain http** set `DJANGO_DEBUG=True` in
`.env.docker` (production mode requires https `FRONTEND_URL`, real SMTP settings and SQL Server settings).
For a real deployment put a TLS terminator (Caddy, Traefik, your cloud load balancer) in front of
port 8080 and set `DJANGO_DEBUG=False`, `DJANGO_ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS`, `FRONTEND_URL`.

## Reaching your SQL Server from a container

- `MSSQL_DB_HOST=host.docker.internal` reaches SQL Server on the Docker host (compose maps it for Linux too).
  For a remote server use its hostname/IP.
- SQL Server must accept **TCP connections on 1433** (SQL Server Configuration Manager → TCP/IP enabled),
  use **SQL authentication** (the container can't use Windows login), and your firewall must allow the Docker
  network to reach it. `Encrypt=yes;TrustServerCertificate=yes` is fine for a local server without a trusted cert.
- You manage the database; the app only needs a login with rights on its own database.

## Things that can lock people out — already handled, but know them

- **`NUM_PROXIES=1`** (set in `docker-compose.yml`). Without it every user shares nginx's IP and the 10/min login
  throttle blocks the whole school. Keep it if you change the proxy layout (count your proxies).
- **Email must work** or new users can't verify. Break-glass without email:
  `docker compose exec backend python manage.py verify_users --all` (or specific addresses;
  `--set-password` for one user).
- A missing `SANDBOX_TOKEN` only disables code execution; login is unaffected.

## What I could NOT verify (no Docker in my environment)

Image builds, the compose networking, and that the sandbox container really has no network / a read-only
filesystem. Verify after the first `up` with the commands in `sandbox/README.md`.
Verified without Docker: compose YAML parses, `npm ci` works from the lockfile, `pip` resolves every
requirement (including `mssql-django`/`pyodbc`), `collectstatic` succeeds, and the runner passes its
adversarial test-suite when run as an unprivileged user.
