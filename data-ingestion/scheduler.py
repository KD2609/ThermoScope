"""Background periodic task scheduler for automated FIRMS ingestion and pipeline runs.
"""

import asyncio
from datetime import datetime
from backend.app.config import settings
from backend.app.database import SessionLocal
from backend.app.services.firms_service import firms_service

_scheduler_task = None


async def firms_periodic_worker():
    """Asynchronous background loop polling NASA FIRMS at configured interval."""
    interval_seconds = max(60, settings.POLL_INTERVAL_MINUTES * 60)
    print(f"[Scheduler] Background FIRMS ingestion worker active (interval: {settings.POLL_INTERVAL_MINUTES} mins).")

    while True:
        try:
            db = SessionLocal()
            try:
                res = firms_service.sync_firms_data(db)
                print(f"[Scheduler] Periodic Sync: {res['status']} ({res['records_inserted']} new records)")
            finally:
                db.close()
        except Exception as e:
            print(f"[Scheduler] Error during scheduled FIRMS sync: {e}")

        await asyncio.sleep(interval_seconds)


def start_background_scheduler():
    global _scheduler_task
    if _scheduler_task is None:
        _scheduler_task = asyncio.create_task(firms_periodic_worker())
    return _scheduler_task


def stop_background_scheduler():
    global _scheduler_task
    if _scheduler_task and not _scheduler_task.done():
        _scheduler_task.cancel()
        _scheduler_task = None
