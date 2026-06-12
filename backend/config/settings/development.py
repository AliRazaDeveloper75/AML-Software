from .base import *  # noqa

DEBUG = True

# ── Use SQLite locally so you don't need PostgreSQL running ──
# Set USE_SQLITE=false in .env when PostgreSQL is ready.
import os as _os
if _os.environ.get('USE_SQLITE', 'true').lower() == 'true':
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }
    # Use in-memory cache (no Redis needed)
    CACHES = {
        'default': {
            'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        }
    }
    # Use in-process channel layer (no Redis needed)
    CHANNEL_LAYERS = {
        'default': {
            'BACKEND': 'channels.layers.InMemoryChannelLayer',
        }
    }

# Optional dev tools — only load if installed
try:
    import debug_toolbar  # noqa
    INSTALLED_APPS += ['debug_toolbar']  # noqa
    MIDDLEWARE.insert(1, 'debug_toolbar.middleware.DebugToolbarMiddleware')  # noqa
    INTERNAL_IPS = ['127.0.0.1']
except ImportError:
    pass

try:
    import django_extensions  # noqa
    INSTALLED_APPS += ['django_extensions']  # noqa
except ImportError:
    pass

# Use local filesystem in dev (no Azure needed)
DEFAULT_FILE_STORAGE = 'django.core.files.storage.FileSystemStorage'

# Gmail SMTP — real email delivery in dev
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = env('EMAIL_HOST', default='smtp.gmail.com')
EMAIL_PORT = env.int('EMAIL_PORT', default=587)
EMAIL_HOST_USER = env('EMAIL_HOST_USER', default='')
EMAIL_HOST_PASSWORD = env('EMAIL_HOST_PASSWORD', default='')
EMAIL_USE_TLS = True
DEFAULT_FROM_EMAIL = env('DEFAULT_FROM_EMAIL', default=EMAIL_HOST_USER)

# Run Celery tasks synchronously in dev (no broker/worker needed)
CELERY_TASK_ALWAYS_EAGER = True
CELERY_TASK_EAGER_PROPAGATES = True

# Relax throttling in dev
REST_FRAMEWORK['DEFAULT_THROTTLE_RATES'] = {  # noqa
    'anon': '1000/minute',
    'user': '10000/minute',
    'auth': '100/minute',
    'screening': '1000/minute',
}
