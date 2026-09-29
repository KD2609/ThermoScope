"""API endpoint for Real-Time Server-Sent Events (SSE).
"""

from fastapi import APIRouter
from fastapi.responses import StreamingResponse

from backend.app.services.realtime_service import subscribe_event_stream

router = APIRouter(prefix="/api/events", tags=["Real-time Stream"])


@router.get("/stream")
async def event_stream():
    """Subscribe to the real-time event stream for live browser push updates."""
    return StreamingResponse(
        subscribe_event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )
