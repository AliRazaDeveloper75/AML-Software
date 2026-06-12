import environ
from pathlib import Path
from datetime import timedelta

BASE_DIR = Path(__file__).resolve().parent.parent.parent
env = environ.Env()
environ.Env.read_env(BASE_DIR / '.env')

SECRET_KEY = env('SECRET_KEY')
DEBUG = env.bool('DEBUG', default=False)
ALLOWED_HOSTS = env.list('ALLOWED_HOSTS', default=[])

# ─── Installed Apps ────────────────────────────────────────────
DJANGO_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
]

THIRD_PARTY_APPS = [
    'rest_framework',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',
    'corsheaders',
    'django_filters',
    'drf_spectacular',
    'channels',
    'django_celery_beat',
    'django_celery_results',
    'anymail',
]

LOCAL_APPS = [
    'core',
    'apps.authentication',
    'apps.tenants',
    'apps.users',
    'apps.kyc',
    'apps.aml',
    'apps.accounting',
    'apps.tax',
    'apps.monitoring',
    'apps.reports',
    'apps.billing',
    'apps.notifications',
    'apps.audit',
]

INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS

# ─── Middleware ────────────────────────────────────────────────
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'core.middleware.TenantMiddleware',
    'core.middleware.AuditLogMiddleware',
    'core.middleware.RequestIDMiddleware',
]

ROOT_URLCONF = 'config.urls'
AUTH_USER_MODEL = 'users.User'
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# ─── Templates ────────────────────────────────────────────────
TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
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

WSGI_APPLICATION = 'config.wsgi.application'
ASGI_APPLICATION = 'config.asgi.application'

# ─── Database ─────────────────────────────────────────────────
DATABASES = {
    'default': env.db('DATABASE_URL', default='postgres://almerak:password@localhost:5432/almerak_db')
}
DATABASES['default']['CONN_MAX_AGE'] = 60
DATABASES['default']['OPTIONS'] = {'connect_timeout': 10}

# ─── Cache / Redis ────────────────────────────────────────────
REDIS_URL = env('REDIS_URL', default='redis://localhost:6379/0')
CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': REDIS_URL,
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
            'SOCKET_CONNECT_TIMEOUT': 5,
            'SOCKET_TIMEOUT': 5,
            'CONNECTION_POOL_KWARGS': {'max_connections': 50},
        },
        'KEY_PREFIX': 'almerak',
    }
}
SESSION_ENGINE = 'django.contrib.sessions.backends.cache'
SESSION_CACHE_ALIAS = 'default'

# ─── Channels (WebSocket) ─────────────────────────────────────
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {'hosts': [REDIS_URL]},
    }
}

# ─── REST Framework ───────────────────────────────────────────
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'apps.authentication.backends.JWTCookieAuthentication',
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_PAGINATION_CLASS': 'core.pagination.StandardPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '30/minute',
        'user': '300/minute',
        'auth': '10/minute',
        'screening': '60/minute',
    },
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
    'EXCEPTION_HANDLER': 'core.exceptions.custom_exception_handler',
    'DEFAULT_RENDERER_CLASSES': ['rest_framework.renderers.JSONRenderer'],
}

# ─── JWT ──────────────────────────────────────────────────────
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=env.int('JWT_ACCESS_TOKEN_LIFETIME_MINUTES', default=15)),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=env.int('JWT_REFRESH_TOKEN_LIFETIME_DAYS', default=7)),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'UPDATE_LAST_LOGIN': True,
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
    'AUTH_HEADER_TYPES': ('Bearer',),
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
    'TOKEN_OBTAIN_SERIALIZER': 'apps.authentication.serializers.CustomTokenObtainSerializer',
    'TOKEN_REFRESH_SERIALIZER': 'apps.authentication.serializers.CustomTokenRefreshSerializer',
}

# ─── Password Validation ──────────────────────────────────────
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator', 'OPTIONS': {'min_length': 10}},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]
PASSWORD_HASHERS = [
    'django.contrib.auth.hashers.Argon2PasswordHasher',
    'django.contrib.auth.hashers.PBKDF2PasswordHasher',
]

# ─── CORS ─────────────────────────────────────────────────────
CORS_ALLOWED_ORIGINS = env.list('CORS_ALLOWED_ORIGINS', default=['http://localhost:5173'])
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_HEADERS = [
    'accept', 'accept-encoding', 'authorization', 'content-type',
    'dnt', 'origin', 'user-agent', 'x-csrftoken', 'x-requested-with',
    'x-api-key', 'x-tenant-id', 'x-request-id',
]

# ─── Celery ───────────────────────────────────────────────────
CELERY_BROKER_URL = env('CELERY_BROKER_URL', default='redis://localhost:6379/1')
CELERY_RESULT_BACKEND = env('CELERY_RESULT_BACKEND', default='redis://localhost:6379/2')
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE = 'Asia/Dubai'
CELERY_TASK_TRACK_STARTED = True
CELERY_TASK_TIME_LIMIT = 30 * 60  # 30 minutes
CELERY_TASK_SOFT_TIME_LIMIT = 25 * 60
CELERY_BEAT_SCHEDULER = 'django_celery_beat.schedulers:DatabaseScheduler'
CELERY_WORKER_MAX_TASKS_PER_CHILD = 1000

# ─── Azure Storage ────────────────────────────────────────────
DEFAULT_FILE_STORAGE = 'storages.backends.azure_storage.AzureStorage'
AZURE_ACCOUNT_NAME = env('AZURE_ACCOUNT_NAME', default='')
AZURE_ACCOUNT_KEY = env('AZURE_ACCOUNT_KEY', default='')
AZURE_CONTAINER = env('AZURE_CONTAINER', default='kyc-documents')
AZURE_URL_EXPIRATION_SECS = 900  # 15-minute SAS tokens
AZURE_OVERWRITE_FILES = False
AZURE_OBJECT_PARAMETERS = {
    'content_disposition': 'inline',
    'cache_control': 'max-age=0',
}

# ─── Email ────────────────────────────────────────────────────
EMAIL_BACKEND = 'anymail.backends.sendgrid.EmailBackend'
ANYMAIL = {'SENDGRID_API_KEY': env('SENDGRID_API_KEY', default='')}
DEFAULT_FROM_EMAIL = env('DEFAULT_FROM_EMAIL', default='noreply@almerak.ae')
COMPLIANCE_ALERT_EMAIL = env('COMPLIANCE_ALERT_EMAIL', default='compliance@almerak.ae')

# ─── SMS ──────────────────────────────────────────────────────
TWILIO_ACCOUNT_SID = env('TWILIO_ACCOUNT_SID', default='')
TWILIO_AUTH_TOKEN = env('TWILIO_AUTH_TOKEN', default='')
TWILIO_FROM_NUMBER = env('TWILIO_FROM_NUMBER', default='')

# ─── Stripe ───────────────────────────────────────────────────
STRIPE_SECRET_KEY = env('STRIPE_SECRET_KEY', default='')
STRIPE_WEBHOOK_SECRET = env('STRIPE_WEBHOOK_SECRET', default='')
STRIPE_PLANS = {
    'starter': {'price_id': env('STRIPE_STARTER_PRICE_ID', default=''), 'kyc_limit': 200, 'api_limit': 0, 'user_limit': 2},
    'professional': {'price_id': env('STRIPE_PROFESSIONAL_PRICE_ID', default=''), 'kyc_limit': None, 'api_limit': 10000, 'user_limit': 10},
    'enterprise': {'price_id': None, 'kyc_limit': None, 'api_limit': None, 'user_limit': None},
}

# ─── External APIs ────────────────────────────────────────────
OFAC_API_KEY        = env('OFAC_API_KEY', default='')
WORLD_CHECK_API_KEY = env('WORLD_CHECK_API_KEY', default='')
NEWS_API_KEY        = env('NEWS_API_KEY', default='')
FRONTEND_URL        = env('FRONTEND_URL', default='http://localhost:5173')

# ─── ComplyAdvantage (AML · PEP · Sanctions · Adverse Media) ──
COMPLYADVANTAGE_API_KEY = env('COMPLYADVANTAGE_API_KEY', default='')

# ─── Sumsub (KYC · OCR · Face Verification · Liveness) ────────
SUMSUB_APP_TOKEN      = env('SUMSUB_APP_TOKEN', default='')
SUMSUB_SECRET_KEY     = env('SUMSUB_SECRET_KEY', default='')
SUMSUB_WEBHOOK_SECRET = env('SUMSUB_WEBHOOK_SECRET', default='')
SUMSUB_LEVEL_NAME     = env('SUMSUB_LEVEL_NAME', default='basic-kyc-level')

# ─── SEON (Fraud Detection · Email · Phone · IP Risk) ─────────
SEON_API_KEY = env('SEON_API_KEY', default='')

# ─── Static / Media ───────────────────────────────────────────
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# ─── Internationalization ─────────────────────────────────────
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Asia/Dubai'
USE_I18N = True
USE_TZ = True

# ─── Logging ──────────────────────────────────────────────────
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {'format': '[{asctime}] {levelname} {name} {process:d} {thread:d} {message}', 'style': '{'},
        'simple': {'format': '[{asctime}] {levelname} {message}', 'style': '{'},
    },
    'handlers': {
        'console': {'class': 'logging.StreamHandler', 'formatter': 'verbose'},
    },
    'root': {'handlers': ['console'], 'level': 'INFO'},
    'loggers': {
        'django': {'handlers': ['console'], 'level': 'WARNING', 'propagate': False},
        'apps': {'handlers': ['console'], 'level': 'DEBUG', 'propagate': False},
        'services': {'handlers': ['console'], 'level': 'DEBUG', 'propagate': False},
        'tasks': {'handlers': ['console'], 'level': 'DEBUG', 'propagate': False},
    },
}

# ─── DRF Spectacular (OpenAPI) ────────────────────────────────
SPECTACULAR_SETTINGS = {
    'TITLE': 'Al Merak AML API',
    'DESCRIPTION': 'UAE-compliant AML & Accounting platform API',
    'VERSION': '1.0.0',
    'SERVE_INCLUDE_SCHEMA': False,
    'COMPONENT_SPLIT_REQUEST': True,
    'TAGS': [
        {'name': 'auth', 'description': 'Authentication & 2FA'},
        {'name': 'kyc', 'description': 'Know Your Customer'},
        {'name': 'aml', 'description': 'AML Screening & Alerts'},
        {'name': 'accounting', 'description': 'Invoices, Transactions, GL'},
        {'name': 'tax', 'description': 'UAE VAT & Corporate Tax'},
        {'name': 'monitoring', 'description': 'Real-time Transaction Monitoring'},
        {'name': 'reports', 'description': 'Compliance & Financial Reports'},
        {'name': 'billing', 'description': 'Subscriptions & Usage'},
        {'name': 'users', 'description': 'Users, Roles & Permissions'},
    ],
}

# ─── App-level Constants ──────────────────────────────────────
UAE_VAT_RATE = 0.05          # 5%
UAE_CT_RATE = 0.09           # 9%
UAE_CT_THRESHOLD = 375000    # AED - below this, 0%
UAE_SMALL_BUSINESS_RELIEF = 3000000  # AED revenue limit
CBUAE_CASH_REPORTING_THRESHOLD = 55000  # AED - mandatory report
AML_STRUCTURING_THRESHOLD = 40000   # AED - structuring detection

OTP_EXPIRY_SECONDS = 300     # 5 minutes
OTP_LENGTH = 6
MAX_FAILED_OTP_ATTEMPTS = 5
JWT_COOKIE_NAME = 'almerak_refresh'
