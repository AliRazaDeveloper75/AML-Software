from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import serializers

from core.pagination import StandardPagination
from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = [
            'id', 'notification_type', 'title', 'message',
            'is_read', 'read_at', 'action_url', 'metadata', 'created_at',
        ]
        read_only_fields = fields


class NotificationListView(generics.ListAPIView):
    serializer_class = NotificationSerializer
    pagination_class = StandardPagination
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = Notification.objects.filter(recipient=self.request.user)
        unread_only = self.request.query_params.get('unread')
        if unread_only == 'true':
            qs = qs.filter(is_read=False)
        return qs


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_read(request, pk):
    try:
        notif = Notification.objects.get(pk=pk, recipient=request.user)
        notif.mark_read()
        return Response({'message': 'Notification marked as read.'})
    except Notification.DoesNotExist:
        return Response({'message': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_all_read(request):
    from django.utils import timezone
    count = Notification.objects.filter(
        recipient=request.user, is_read=False
    ).update(is_read=True, read_at=timezone.now())
    return Response({'message': f'{count} notifications marked as read.'})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def unread_count(request):
    count = Notification.objects.filter(recipient=request.user, is_read=False).count()
    return Response({'unread_count': count})
