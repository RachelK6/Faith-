# Database Configuration Manual — Optimum ERP LMS

This walks through configuring the database, from local development
(SQLite, zero setup) through to a real SQL Server instance for staging or
production. Follow the section that matches what you're doing right now.

---

## Part 1 — Local development (SQLite, no setup required)

This is what the project ships with by default. Nothing to install.

1. In `backend/`, copy the env file:
   ```bash
   cp .env.example .env          # Windows PowerShell: Copy-Item .env.example .env
   ```
2. Confirm `.env` has:
   ```
   DB_ENGINE=sqlite
   ```
3. Run migrations:
   ```bash
   cd backend
   source venv/bin/activate      # Windows PowerShell: .\venv\Scripts\Activate.ps1
   python manage.py migrate
   ```
   This creates `backend/db.sqlite3` — a single file holding the whole
   database. Delete it and re-run `migrate` any time you want a clean slate.

That's it for local dev. Skip to Part 3 if this is all you need right now.

---

## Part 2 — Real SQL Server (staging / production)

### Step 1: Install the ODBC driver on the machine running Django

This is a **system-level driver**, not a Python package — `pip install`
alone won't get you this. `mssql-django` (already in `requirements.txt`)
talks to SQL Server through this driver.

**Ubuntu / Debian:**
```bash
curl https://packages.microsoft.com/keys/microsoft.asc | sudo tee /etc/apt/trusted.gpg.d/microsoft.asc
curl https://packages.microsoft.com/config/ubuntu/22.04/prod.list | sudo tee /etc/apt/sources.list.d/mssql-release.list
sudo apt-get update
sudo ACCEPT_EULA=Y apt-get install -y msodbcsql18
```
(Swap `22.04` for your actual Ubuntu version if different.)

**macOS:**
```bash
brew tap microsoft/mssql-release https://github.com/Microsoft/homebrew-mssql-release
brew update
HOMEBREW_ACCEPT_EULA=Y brew install msodbcsql18
```

**Windows:**
Usually already present. If not, download "ODBC Driver 18 for SQL Server"
from Microsoft's official download page and run the installer.

**Verify it installed correctly** (Linux/Mac):
```bash
odbcinst -q -d
```
You should see something like `[ODBC Driver 18 for SQL Server]` in the
output. **Copy that exact name** — you'll need it in Step 3, and it must
match exactly, including the version number.

### Step 2: Get your SQL Server connection details

You need five things from whoever manages the SQL Server instance (or from
your cloud provider's dashboard if it's Azure SQL / AWS RDS for SQL Server):

| What | Example |
|---|---|
| Server host/address | `sql.optimumsystems.co.ke` or an IP |
| Port | `1433` (SQL Server's default — usually unchanged) |
| Database name | `optimum_erp_lms` |
| Username | a SQL login with rights to create tables |
| Password | — |

If the database itself doesn't exist yet, create it first (in SQL Server
Management Studio, or via `sqlcmd`):
```sql
CREATE DATABASE optimum_erp_lms;
```

### Step 3: Fill in `.env`

```
DB_ENGINE=mssql

MSSQL_DB_NAME=optimum_erp_lms
MSSQL_DB_USER=your_sql_username
MSSQL_DB_PASSWORD=your_sql_password
MSSQL_DB_HOST=sql.optimumsystems.co.ke
MSSQL_DB_PORT=1433
MSSQL_ODBC_DRIVER=ODBC Driver 18 for SQL Server
```

That last line must exactly match what `odbcinst -q -d` printed in Step 1.
If yours came back as `ODBC Driver 17 for SQL Server` (an older version),
put that instead.

### Step 4: Test the connection before running migrations

Don't jump straight to `migrate` — check the connection works first, so if
something's wrong you're debugging one thing at a time:

```bash
cd backend
source venv/bin/activate      # Windows PowerShell: .\venv\Scripts\Activate.ps1
python manage.py dbshell
```

- **If this drops you into a SQL prompt** → connection works, type `exit`
  or `quit` and move to Step 5.
- **If it errors** → see Troubleshooting below before continuing.

### Step 5: Run migrations against the real database

```bash
python manage.py migrate
python manage.py createsuperuser
```

Your tables now exist in SQL Server instead of SQLite. Confirm in SQL
Server Management Studio (or `sqlcmd`) that tables like `accounts_user`,
`courses_course`, etc. appear under your database.

---

## Part 3 — Switching an existing project between the two

Because `DB_ENGINE` is the only thing that changes, you can point the same
codebase at SQLite for your laptop and MSSQL for staging/production just by
having a different `.env` file in each place. **Never commit `.env`** —
that's why it's in `.gitignore`; each environment (your laptop, staging
server, production server) keeps its own copy with its own credentials.

One thing to know: migrations are database-agnostic in Django (they're
Python, not raw SQL), so the same migration files work against either
database — you don't maintain two sets.

---

## Troubleshooting

**`django.db.utils.OperationalError` / "Login failed for user"**
Wrong `MSSQL_DB_USER` / `MSSQL_DB_PASSWORD`, or that SQL login doesn't have
access to the specific database named in `MSSQL_DB_NAME`. Double-check
credentials, and confirm the login has been granted access to that
database specifically (a SQL Server login existing doesn't automatically
mean it can access every database on the server).

**`Data source name not found and no default driver specified`**
`MSSQL_ODBC_DRIVER` doesn't match an installed driver. Re-run
`odbcinst -q -d` and copy the name exactly — including the version number.

**Connection times out**
Usually a firewall/network issue, not a Django/Python issue:
- Is `MSSQL_DB_HOST` reachable at all from this machine? Try
  `telnet <host> 1433` or `nc -zv <host> 1433` to check.
- If this is a cloud SQL Server (Azure SQL, RDS), check that the
  machine's IP is allow-listed in the database's firewall rules — cloud
  SQL Server instances block all connections by default until you
  explicitly allow an IP range.

**`SSL Provider: certificate verify failed`**
The default config includes `TrustServerCertificate=yes` (see
`config/settings.py`) specifically to avoid this for local/dev SQL Server
instances that don't have a CA-signed certificate. If you're hitting this
anyway, check that setting wasn't removed. For a real production
certificate, remove `TrustServerCertificate=yes` once you have one, so
Django actually verifies it properly instead of trusting anything.

**Migrations ran but the app still can't connect at runtime**
Check `DJANGO_ALLOWED_HOSTS` in `.env` includes the domain/IP Django is
being accessed from — this is a separate setting from the database
connection and a common thing to forget when moving from local to a real
server.

---

## Quick reference — every DB-related `.env` variable

| Variable | Used when | Purpose |
|---|---|---|
| `DB_ENGINE` | always | `sqlite` or `mssql` — the switch |
| `MSSQL_DB_NAME` | `DB_ENGINE=mssql` | Database name on the SQL Server instance |
| `MSSQL_DB_USER` | `DB_ENGINE=mssql` | SQL login username |
| `MSSQL_DB_PASSWORD` | `DB_ENGINE=mssql` | SQL login password |
| `MSSQL_DB_HOST` | `DB_ENGINE=mssql` | Server address |
| `MSSQL_DB_PORT` | `DB_ENGINE=mssql` | Default `1433` |
| `MSSQL_ODBC_DRIVER` | `DB_ENGINE=mssql` | Must exactly match an installed driver name |
