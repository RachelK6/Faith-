# Production deployment

This project uses Microsoft SQL Server, and production
security and 3,000-user capacity come from the deployment architecture as
well as the application code. Do not run Django `runserver` in production.

## Recommended topology

```text
Browser (HTTPS)
  -> CDN / WAF / TLS load balancer
  -> 2+ Django containers running Gunicorn
  -> Azure SQL Database or SQL Server with private networking
  -> Redis for shared cache and throttling (when enabled)
```

Use Azure Container Apps, App Service, or AKS for the Django containers and
Azure SQL Database for the database. Start with two instances, enable health
checks and autoscaling, then prove the target with a load test. A concurrency
number is not a guarantee until the real course queries, code-execution load,
database tier, and network path have been tested together.

## Required production environment

Set these through the hosting platform's secret/configuration store. Do not
commit them or put them in a frontend `.env` file.

```text
DJANGO_DEBUG=False
DJANGO_SECRET_KEY=<long random secret from a secret manager>
DJANGO_ALLOWED_HOSTS=api.example.com
CORS_ALLOWED_ORIGINS=https://app.example.com
MSSQL_DB_NAME=optimum_erp_lms
MSSQL_DB_USER=<least-privilege SQL user>
MSSQL_DB_PASSWORD=<secret>
MSSQL_DB_HOST=<private SQL Server hostname>
MSSQL_DB_PORT=1433
MSSQL_ODBC_DRIVER=ODBC Driver 18 for SQL Server
MSSQL_EXTRA_PARAMS=Encrypt=yes;TrustServerCertificate=no;
DB_CONN_MAX_AGE=60
SANDBOX_URL=https://sandbox.internal.example.com
```

The backend now refuses to start in production when the Django secret, host,
or CORS origin is missing. SQL Server certificate verification must remain
enabled in production. Allow the application SQL login only the database
permissions it needs; do not use `sa`.

## First deployment

From the backend release image, run migrations as a one-off release job, not
once per web worker:

```powershell
python manage.py check --deploy
python manage.py migrate --noinput
python manage.py collectstatic --noinput
```

Run the web process with Gunicorn, for example:

```text
gunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers 4 --threads 4 --timeout 120
```

The TLS proxy must forward `X-Forwarded-Proto: https`. Django enables HTTPS
redirects, HSTS, secure cookies, and clickjacking protection when
`DJANGO_DEBUG=False`.

## Authentication and roles

Public registration creates students only. Instructors and administrators
must be provisioned by an administrator through Django admin (`/admin/`),
where the platform role is selectable. Login uses email plus password and
embeds the server-controlled role in the access token; API permissions still
enforce the role server-side. Access tokens expire after 15 minutes, refresh
tokens rotate, and logout blacklists the submitted refresh token.

The frontend refreshes an expired access token once and then logs out on a
second 401. For the strongest browser threat model, move refresh tokens from
browser storage to Secure, HttpOnly, SameSite cookies behind a same-origin
backend or BFF before public launch; browser JavaScript storage is vulnerable
to token theft if an XSS vulnerability is ever introduced.

## Capacity and operational requirements

- Put the database behind private networking and allow only application traffic.
- Size SQL Server for the measured workload; `DB_CONN_MAX_AGE` reuses connections but does not replace pool sizing.
- Add Redis-backed caching and shared rate limiting before horizontal scaling.
- Isolate code execution in a locked-down sandbox with CPU, memory, time, network, and filesystem limits. Never execute student code in a Django worker.
- Add centralized logs, metrics, error tracking, backups, point-in-time restore, and migration rollback procedures.
- Load test login, dashboards, course browsing, submissions, quizzes, and code execution separately and together.