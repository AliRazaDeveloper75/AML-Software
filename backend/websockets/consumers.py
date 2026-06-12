"""
WebSocket consumers for real-time AML compliance notifications.

Groups:
- compliance_{org_id}: org-wide alerts broadcast to all connected compliance users
- user_{user_id}: per-user notifications (report ready, etc.)
"""
import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer

logger = logging.getLogger('websockets')


class ComplianceConsumer(AsyncWebsocketConsumer):
    """
    Real-time compliance dashboard feed.
    Authenticated users receive:
    - New AML alerts
    - Sanctions screening results
    - Transaction flags
    - System announcements
    """

    async def connect(self):
        user = self.scope.get('user')
        if not user or not user.is_authenticated:
            await self.close(code=4001)
            return

        self.org_id = str(user.organization_id)
        self.user_id = str(user.id)
        self.org_group = f'compliance_{self.org_id}'
        self.user_group = f'user_{self.user_id}'

        # Join org group and personal group
        await self.channel_layer.group_add(self.org_group, self.channel_name)
        await self.channel_layer.group_add(self.user_group, self.channel_name)

        await self.accept()
        logger.info('WS connect: user=%s org=%s', self.user_id, self.org_id)

        # Send connection ack with current unread count
        await self.send_json({
            'type': 'connected',
            'message': 'Real-time compliance feed connected.',
        })

    async def disconnect(self, close_code):
        if hasattr(self, 'org_group'):
            await self.channel_layer.group_discard(self.org_group, self.channel_name)
        if hasattr(self, 'user_group'):
            await self.channel_layer.group_discard(self.user_group, self.channel_name)
        logger.info('WS disconnect: code=%s', close_code)

    async def receive(self, text_data=None, bytes_data=None):
        """Accept ping/ack messages from client."""
        if not text_data:
            return
        try:
            data = json.loads(text_data)
            if data.get('type') == 'ping':
                await self.send_json({'type': 'pong'})
        except json.JSONDecodeError:
            pass

    # --- Channel layer message handlers ---

    async def compliance_message(self, event):
        """Broadcast AML event to all org members."""
        await self.send_json({
            'type': event.get('type', 'compliance_event'),
            'data': {k: v for k, v in event.items() if k != 'type'},
        })

    async def user_message(self, event):
        """Personal notification (report ready, etc.)."""
        await self.send_json({
            'type': event.get('type', 'user_event'),
            'data': {k: v for k, v in event.items() if k != 'type'},
        })

    async def aml_alert(self, event):
        """New AML alert raised."""
        await self.send_json({
            'type': 'aml_alert',
            'severity': event.get('severity'),
            'customer_id': event.get('customer_id'),
            'message': event.get('message'),
        })

    async def send_json(self, content):
        await self.send(text_data=json.dumps(content))
