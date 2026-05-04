import os
from pathlib import Path
from decouple import config, Csv
import dj_database_url

BASE_DIR = Path(__file__).resolve().parent.parent

# ---------------------------------------------------------------------------
# Core — dev defaults baked in; production must set these in .env
# ---------------------------------------------------------------------------
DEBUG = config('DEBUG', default=True, cast=bool)
SECRET_KEY = config(
    'SECRET_KEY',
    default='django-insecure-dev-only-key-do-not-use-in-production',
)

# ---------------------------------------------------------------------------
# Hosts, CORS & CSRF
# ---------------------------------------------------------------------------
if DEBUG:
    ALLOWED_HOSTS = ['localhost', '127.0.0.1', '[::1]']
    CORS_ALLOWED_ORIGINS = ['http://localhost:3000']
    CSRF_TRUSTED_ORIGINS = ['http://localhost:3000']
    FRONTEND_URL = config('FRONTEND_URL', default='http://localhost:3000')
else:
    ALLOWED_HOSTS = config('ALLOWED_HOSTS', cast=Csv())
    CORS_ALLOWED_ORIGINS = config('CORS_ALLOWED_ORIGINS', cast=Csv())
    CSRF_TRUSTED_ORIGINS = config('CSRF_TRUSTED_ORIGINS', cast=Csv())
    FRONTEND_URL = config('FRONTEND_URL')

# ---------------------------------------------------------------------------
# Application definition
# ---------------------------------------------------------------------------
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'corsheaders',
    'gmailapi_backend',
    'core',
]

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'core.authentication.SecureTokenAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_PARSER_CLASSES': [
        'rest_framework.parsers.JSONParser',
        'rest_framework.parsers.FormParser',
        'rest_framework.parsers.MultiPartParser',
    ],
}

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'cimore_backend.urls'
WSGI_APPLICATION = 'cimore_backend.wsgi.application'

# ---------------------------------------------------------------------------
# Templates
# ---------------------------------------------------------------------------
TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

# ---------------------------------------------------------------------------
# Database
# Dev: falls back to SQLite if DATABASE_URL is not set.
# Production: DATABASE_URL is required in .env.
# ---------------------------------------------------------------------------
if DEBUG:
    _db_url = config('DATABASE_URL', default=None)
    if _db_url:
        DATABASES = {
            'default': dj_database_url.config(
                default=_db_url,
                conn_max_age=600,
                conn_health_checks=True,
            )
        }
    else:
        DATABASES = {
            'default': {
                'ENGINE': 'django.db.backends.sqlite3',
                'NAME': BASE_DIR / 'db.sqlite3',
            }
        }
else:
    DATABASES = {
        'default': dj_database_url.config(
            default=config('DATABASE_URL'),
            conn_max_age=600,
            conn_health_checks=True,
        )
    }

# ---------------------------------------------------------------------------
# CORS extra
# ---------------------------------------------------------------------------
CORS_ALLOW_CREDENTIALS = True

# ---------------------------------------------------------------------------
# Production security — only active when DEBUG=False
# ---------------------------------------------------------------------------
if not DEBUG:
    SECURE_SSL_REDIRECT = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_HSTS_SECONDS = 31536000
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

# ---------------------------------------------------------------------------
# Email
# Dev: prints emails to the console; Gmail credentials are optional.
# Production: Gmail API backend; all credentials required in .env.
# ---------------------------------------------------------------------------
if DEBUG:
    EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'
    GMAIL_API_CLIENT_ID = config('GMAIL_API_CLIENT_ID', default='')
    GMAIL_API_CLIENT_SECRET = config('GMAIL_API_CLIENT_SECRET', default='')
    GMAIL_API_REFRESH_TOKEN = config('GMAIL_API_REFRESH_TOKEN', default='')
    EMAIL_HOST_USER = config('EMAIL_HOST_USER', default='dev@localhost')
    DEFAULT_FROM_EMAIL = config('DEFAULT_FROM_EMAIL', default=f'CiMORe Dev <{EMAIL_HOST_USER}>')
else:
    EMAIL_BACKEND = 'gmailapi_backend.mail.GmailBackend'
    GMAIL_API_CLIENT_ID = config('GMAIL_API_CLIENT_ID')
    GMAIL_API_CLIENT_SECRET = config('GMAIL_API_CLIENT_SECRET')
    GMAIL_API_REFRESH_TOKEN = config('GMAIL_API_REFRESH_TOKEN')
    EMAIL_HOST_USER = config('EMAIL_HOST_USER')
    DEFAULT_FROM_EMAIL = config('DEFAULT_FROM_EMAIL', default=f'CiMORe <{EMAIL_HOST_USER}>')

# ---------------------------------------------------------------------------
# Static & Media files
# ---------------------------------------------------------------------------
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STORAGES = {
    'default': {
        'BACKEND': 'django.core.files.storage.FileSystemStorage',
    },
    'staticfiles': {
        'BACKEND': 'whitenoise.storage.CompressedManifestStaticFilesStorage',
    },
}

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

DATA_UPLOAD_MAX_MEMORY_SIZE = 10 * 1024 * 1024
FILE_UPLOAD_MAX_MEMORY_SIZE = 10 * 1024 * 1024

# ---------------------------------------------------------------------------
# Project constants
# ---------------------------------------------------------------------------
AUTH_USER_MODEL = 'core.User'
ALLOWED_EMAIL_DOMAIN = '@slc-sflu.edu.ph'
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
