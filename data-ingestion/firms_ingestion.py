"""Standalone NASA FIRMS Ingestion Worker CLI.
Can be executed as a background cron job or continuous service.
Usage: python data-ingestion/firms_ingestion.py [--once] [--interval 15]
"""

import argparse
import os
import sys
import time

# Ensure project root is on sys.path
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

from backend.app.database import SessionLocal, engine, Base
from backend.app.services.firms_service import firms_service


def run_ingestion_cycle():
    print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] Starting NASA FIRMS ingestion cycle...")
    db = SessionLocal()
    try:
        res = firms_service.sync_firms_data(db)
        print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] Sync Complete -> Status: {res['status']}, Fetched: {res['records_fetched']}, Inserted: {res['records_inserted']} (Duration: {res['duration_seconds']}s)")
        if res.get("error_message"):
            print(f"Notice: {res['error_message']}")
    except Exception as e:
        print(f"Error during ingestion cycle: {e}")
    finally:
        db.close()


def main():
    parser = argparse.ArgumentParser(description="ThermoScope NASA FIRMS Ingestion Worker")
    parser.add_argument("--once", action="store_true", help="Run once and exit")
    parser.add_argument("--interval", type=int, default=15, help="Polling interval in minutes (default 15)")
    args = parser.parse_args()

    # Ensure tables exist
    Base.metadata.create_all(bind=engine)

    if args.once:
        run_ingestion_cycle()
        return

    print(f"Starting FIRMS Ingestion Loop. Polling every {args.interval} minutes. Press Ctrl+C to stop.")
    while True:
        run_ingestion_cycle()
        time.sleep(args.interval * 60)


if __name__ == "__main__":
    main()
