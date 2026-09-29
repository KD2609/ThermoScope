"""Real-Time Event Broadcasting Service for ThermoScope.
Provides a lightweight Server-Sent Events (SSE) event bus for live browser notifications
without introducing bulky external message brokers.
"""

import asyncio
import json
from typing import AsyncGenerator, Dict, Any, List

# In-memory subscriber queues
_subscribers: List[asyncio.Queue] = []


async def subscribe_event_stream() -> AsyncGenerator[str, None]:
    """Yield Server-Sent Events to connected client sessions."""
    q = asyncio.Queue(maxsize=50)
    _subscribers.append(q)
    try:
        # Send initial connection handshake
        yield f"event: connected\ndata: {json.dumps({'message': 'Connected to ThermoScope Real-time Event Stream'})}\n\n"

        while True:
            try:
                # Wait for next event or send periodic heartbeat every 20 seconds
                event_data = await asyncio.wait_for(q.get(), timeout=20.0)
                event_type = event_data.get("type", "message")
                payload = json.dumps(event_data.get("payload", {}))
                yield f"event: {event_type}\ndata: {payload}\n\n"
            except asyncio.TimeoutError:
                # Keep-alive heartbeat comment
                yield ": heartbeat\n\n"
    finally:
        if q in _subscribers:
            _subscribers.remove(q)


def broadcast_event(event_type: str, payload: Dict[str, Any]):
    """Broadcast an event to all active SSE subscribers non-blockingly."""
    msg = {"type": event_type, "payload": payload}
    for q in list(_subscribers):
        try:
            q.put_nowait(msg)
        except asyncio.QueueFull:
            pass
