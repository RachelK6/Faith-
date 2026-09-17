# Account management

There are two account creation paths. They are intentionally separate so a
public visitor cannot create an instructor or administrator account.

## Create the first administrator

After the database is configured and migrations have run:

```powershell
cd backend
.\venv\Scripts\python.exe manage.py createsuperuser
```

Django asks for a username, email, and password. This first account is
automatically given the platform role `admin` and can sign in at:

```text
http://localhost:5173/login
```

It can also open the Django administration site:

```text
http://127.0.0.1:8000/admin/
```

## Create an instructor or another administrator

1. Sign in to `/admin/` with the first administrator.
2. Open **Accounts > Users**.
3. Select **Add user**.
4. Enter the username and password.
5. In **Platform role**, select `Instructor` or `Admin`.
6. Save the account.

That person then uses the normal frontend login page. The backend reads the
stored role and routes instructors to `/dashboard/instructor`. Admins use the
same instructor/admin dashboard permissions plus the admin dashboard API.

## Student accounts

Students self-register at `/register`. The backend always assigns the
`student` role, even if someone submits a different role in the request.

Never share the first administrator password or put it in `.env` files.