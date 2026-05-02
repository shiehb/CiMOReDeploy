import os
from pathlib import Path
from decouple import config, Csv
import dj_database_url

# Build paths inside the project
BASE_DIR = Path(__file__).resolve().parent.parent

# ---------------------------------------------------------------------------
# Security & Debug Configuration
# ---------------------------------------------------------------------------
SECRET_KEY = config('SECRET_KEY')
DEBUG = config('DEBUG', default=False, cast=bool)

if DEBUG:
    # Local/Offline Network Settings
    ALLOWED_HOSTS = ['localhost', '127.0.0.1', '[::1]']
    
    CORS_ALLOWED_ORIGINS = [
        'http://localhost:3000',
    ]
    
    CSRF_TRUSTED_ORIGINS = [
        'http://localhost:3000',
    ]
else:
    # Online/Production Settings
    ALLOWED_HOSTS = config(
        'ALLOWED_HOSTS',
        default='cimoredeploy.onrender.com,cimore.vercel.app',
        cast=Csv(),
    )
    
    CORS_ALLOWED_ORIGINS = config(
        'CORS_ALLOWED_ORIGINS',
        default='https://cimore.vercel.app,https://cimoredeploy.onrender.com',
        cast=Csv(),
    )
    
    CSRF_TRUSTED_ORIGINS = [
        "https://cimore.vercel.app",
        "https://cimoredeploy.onrender.com",
    ]

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
    'gmailapi_backend',  # Required for Gmail API support
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
# Templates configuration
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
# Database (Supabase)
# ---------------------------------------------------------------------------
DATABASES = {
    'default': dj_database_url.config(
        default=config('DATABASE_URL'),
        conn_max_age=600,
        conn_health_checks=True,
    )
}

# CORS & CSRF Extra Tweaks
CORS_ALLOW_CREDENTIALS = True

# ---------------------------------------------------------------------------
# Production Security (Required for Render)
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
# Email Configuration (Gmail API - Bypasses Render Port Blocks)
# ---------------------------------------------------------------------------
EMAIL_BACKEND = 'gmailapi_backend.mail.GmailBackend'

# Credentials from your Google Cloud Console
GMAIL_API_CLIENT_ID = config('GMAIL_API_CLIENT_ID')
GMAIL_API_CLIENT_SECRET = config('GMAIL_API_CLIENT_SECRET')
GMAIL_API_REFRESH_TOKEN = config('GMAIL_API_REFRESH_TOKEN')

# Sender details
EMAIL_HOST_USER = config('EMAIL_HOST_USER')
DEFAULT_FROM_EMAIL = config('DEFAULT_FROM_EMAIL', default=f"CiMORe <{EMAIL_HOST_USER}>")

# ---------------------------------------------------------------------------
# Static & Media files
# ---------------------------------------------------------------------------
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STORAGES = {
    # Required by Django 4.2+: must be present whenever STORAGES is overridden.
    # FileSystemStorage writes uploads to MEDIA_ROOT on disk.
    "default": {
        "BACKEND": "django.core.files.storage.FileSystemStorage",
    },
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
    },
}

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# Allow multipart uploads up to 10 MB (matches the per-file limit enforced in views)
DATA_UPLOAD_MAX_MEMORY_SIZE = 10 * 1024 * 1024   # 10 MB
FILE_UPLOAD_MAX_MEMORY_SIZE  = 10 * 1024 * 1024   # 10 MB

# ---------------------------------------------------------------------------
# Project Constants
# ---------------------------------------------------------------------------
AUTH_USER_MODEL = 'core.User'
FRONTEND_URL = config('FRONTEND_URL', default='https://cimore.vercel.app')
ALLOWED_EMAIL_DOMAIN = '@slc-sflu.edu.ph'
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'