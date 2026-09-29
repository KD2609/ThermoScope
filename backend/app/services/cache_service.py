"""In-memory thread-safe TTL Cache Service for ThermoScope.
Provides microsecond-level cached reads for relatively stable data
(subscriptions, industrial sites, alert counts, dashboard metrics, metadata)
to eliminate redundant network round trips to Supabase.
"""

import time
import threading
from typing import Any, Optional, Dict, Tuple


class TTLCache:
    def __init__(self):
        self._cache: Dict[str, Tuple[Any, float]] = {}
        self._lock = threading.Lock()

    def get(self, key: str) -> Optional[Any]:
        with self._lock:
            entry = self._cache.get(key)
            if entry is None:
                return None
            val, expiry = entry
            if time.time() > expiry:
                del self._cache[key]
                return None
            return val

    def set(self, key: str, value: Any, ttl: float = 60.0):
        with self._lock:
            expiry = time.time() + ttl
            self._cache[key] = (value, expiry)

    def delete(self, key: str):
        with self._lock:
            self._cache.pop(key, None)

    def invalidate_prefix(self, prefix: str):
        with self._lock:
            keys_to_remove = [k for k in self._cache if k.startswith(prefix)]
            for k in keys_to_remove:
                del self._cache[k]

    def clear(self):
        with self._lock:
            self._cache.clear()


# Global singleton cache instance
memory_cache = TTLCache()
