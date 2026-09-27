import math
from datetime import datetime, timezone
from typing import Dict, Any, Optional

class DeduplicationEngine:
    """Handles suppression of duplicate alerts for the same physical event."""
    
    def __init__(self, spatial_threshold_km: float = 3.0, temporal_threshold_hours: float = 12.0):
        self.spatial_threshold_km = spatial_threshold_km
        self.temporal_threshold_hours = temporal_threshold_hours
        # In-memory store of recent active alerts (in production this would be Redis/DB)
        self._active_events = []

    def _haversine_distance(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        R = 6371.0 # Earth radius in km
        lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
        c = 2 * math.asin(math.sqrt(a))
        return R * c

    def check_duplicate(self, lat: float, lon: float, timestamp_iso: str, classification: str) -> Optional[str]:
        """
        Checks if the detection belongs to an ongoing event.
        Returns the alert_id of the existing event if duplicate, else None.
        """
        try:
            current_time = datetime.fromisoformat(timestamp_iso.replace("Z", "+00:00"))
        except ValueError:
            current_time = datetime.now(timezone.utc)

        # Clean up old events
        self._active_events = [
            ev for ev in self._active_events 
            if (current_time - ev["last_seen"]).total_seconds() / 3600.0 <= self.temporal_threshold_hours
        ]

        for ev in self._active_events:
            # We match strictly by classification type (e.g. don't merge a Gas Flare with a Wildfire)
            if ev["classification"] != classification:
                continue
                
            dist = self._haversine_distance(lat, lon, ev["lat"], ev["lon"])
            if dist <= self.spatial_threshold_km:
                # Update last seen
                ev["last_seen"] = current_time
                return ev["alert_id"]
                
        return None
        
    def register_event(self, alert_id: str, lat: float, lon: float, timestamp_iso: str, classification: str):
        """Registers a newly created alert so subsequent detections are deduplicated."""
        try:
            current_time = datetime.fromisoformat(timestamp_iso.replace("Z", "+00:00"))
        except ValueError:
            current_time = datetime.now(timezone.utc)
            
        self._active_events.append({
            "alert_id": alert_id,
            "lat": lat,
            "lon": lon,
            "classification": classification,
            "last_seen": current_time
        })
