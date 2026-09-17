"""
Django settings for Optimum ERP LMS.
"""
import os
from datetime import timedelta
from pathlib import Path

from dotenv import load_dotenv
from django.core.exceptions import ImproperlyConfigured

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

SECRET_KEY = os.environ.get("DJANGO_SECRET_KEY", "dev-only-change-this-in-production")
DEBUG = os.environ.get("DJANGO_DEBUG", "True") == "True"
ALLOWED_HOSTS = os.environ.get("DJANGO_ALLOWED_HOSTS", "localhost,127.0.0.1,testserver").split(",")

if not DEBUG:
    required_production_settings = {
        "DJANGO_SECRET_KEY": os.environ.get("DJANGO_SECRET_KEY"),
        "DJANGO_ALLOWED_HOSTS": os.environ.get("DJANGO_ALLOWED_HOSTS"),
        "CORS_ALLOWED_ORIGINS": os.environ.get("CORS_ALLOWED_ORIGINS"),
    }
    missing_settings = [name for name, value in required_production_settings.items() if not value]
    if missing_settings or SECRET_KEY == "dev-only-change-this-in-production":
        raise ImproperlyConfigured(
            "Production requires real values for: " + ", ".join(missing_settings or ["DJANGO_SECRET_KEY"])
        )


# --------------------------------------------------------------------------
# Applications
# --------------------------------------------------------------------------
INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",

    # third party
    "rest_framework",
    "rest_framework_simplejwt",
    "rest_framework_simplejwt.token_blacklist",
    "corsheaders",

    # our apps
    "apps.accounts",
    "apps.courses",
    "apps.enrollment",
    "apps.progress",
    "apps.submissions",
    "apps.quizzes",
    "apps.execution",
    "apps.dashboards",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"


# --------------------------------------------------------------------------
# Database
#
# DB_ENGINE controls which backend is used:
#   DB_ENGINE=sqlite  -> local dev, zero setup (default)
#   DB_ENGINE=mssql   -> real SQL Server, needs the ODBC driver installed
#                        on the machine running this (see README).
# --------------------------------------------------------------------------
DB_ENGINE = os.environ.get("DB_ENGINE", "sqlite")

if not DEBUG and DB_ENGINE != "mssql":
    raise ImproperlyConfigured("Production must use DB_ENGINE=mssql; SQLite is for local development only.")

if DB_ENGINE == "mssql":
    DATABASES = {
        "default": {
            "ENGINE": "config.mssql",
            "NAME": os.environ.get("MSSQL_DB_NAME", "coding_elearning"),
            "USER": os.environ.get("MSSQL_DB_USER", ""),
            "PASSWORD": os.environ.get("MSSQL_DB_PASSWORD", ""),
            "HOST": os.environ.get("MSSQL_DB_HOST", "localhost"),
            "PORT": os.environ.get("MSSQL_DB_PORT", "1433"),
            "OPTIONS": {
                "driver": os.environ.get("MSSQL_ODBC_DRIVER", "ODBC Driver 18 for SQL Server"),
                "extra_params": os.environ.get(
                    "MSSQL_EXTRA_PARAMS",
                    "Encrypt=yes;TrustServerCertificate=no;" if not DEBUG
                    else "Encrypt=yes;TrustServerCertificate=yes;",
                ),
            },
            "CONN_MAX_AGE": int(os.environ.get("DB_CONN_MAX_AGE", "60")),
        }
    }
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",
        }
    }


# --------------------------------------------------------------------------
# Auth
# --------------------------------------------------------------------------
AUTH_USER_MODEL = "accounts.User"

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticated",
    ),
    "DEFAULT_THROTTLE_CLASSES": (
        "rest_framework.throttling.ScopedRateThrottle",
    ),
    "DEFAULT_THROTTLE_RATES": {
        # applied only to views that opt in via throttle_scope —
        # login/register specifically, to blunt brute-force/credential-
        # stuffing attempts without throttling normal API usage.
        "auth": "10/minute",
    },
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=15),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "AUTH_HEADER_TYPES": ("Bearer",),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "UPDATE_LAST_LOGIN": True,
}

# Allow the Vite frontend (different port) to call this API.
# Tighten this to your real frontend URL before deploying.
CORS_ALLOWED_ORIGINS = os.environ.get(
    "CORS_ALLOWED_ORIGINS", "http://localhost:5173"
).split(",")
CSRF_TRUSTED_ORIGINS = [origin.strip() for origin in CORS_ALLOWED_ORIGINS if origin.strip().startswith("https://")]

# External code-execution sandbox service (see apps/execution/views.py)
SANDBOX_URL = os.environ.get("SANDBOX_URL", "http://localhost:9000")


# --------------------------------------------------------------------------
# HTTPS / security hardening
#
# These are only turned on when DEBUG=False. Locally (DEBUG=True) they stay
# off so `runserver` over plain http keeps working — turning on
# SECURE_SSL_REDIRECT with no TLS in front of you just breaks local dev.
# In production, this app MUST sit behind a reverse proxy (nginx, a cloud
# load balancer, etc.) that terminates real TLS and forwards the
# X-Forwarded-Proto header; SECURE_PROXY_SSL_HEADER below tells Django to
# trust that header when deciding if a request was actually HTTPS.
# --------------------------------------------------------------------------
if not DEBUG:
    SECURE_SSL_REDIRECT = True
    SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True

    SECURE_HSTS_SECONDS = 31536000  # 1 year, standard once you're confident HTTPS is stable
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True

# These are safe to leave on always, dev or prod:
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_REFERRER_POLICY = "same-origin"
X_FRAME_OPTIONS = "DENY"  # blocks this site from being iframed elsewhere (clickjacking)


# --------------------------------------------------------------------------
# I18N / static
# --------------------------------------------------------------------------
LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True
STATIC_URL = "static/"
MEDIA_URL = "media/"
MEDIA_ROOT = BASE_DIR / "media"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
