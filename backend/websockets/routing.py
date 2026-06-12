from django.urls import re_path
from .consumers import ComplianceConsumer

websocket_urlpatterns = [
    re_path(r'^ws/compliance/$', ComplianceConsumer.as_asgi()),
]
