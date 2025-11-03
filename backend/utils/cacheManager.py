import time
import re
from typing import Any, Dict, Optional

class CacheEntry:
    def __init__(self, data: Any, ttl: int):
        self.data = data
        self.ttl = ttl
        self.timestamp = time.time()

class CacheManager:
    def __init__(self):
        self.cache: Dict[str, CacheEntry] = {}

    def set(self, key: str, data: Any, ttl: int = 5000):
        self.cache[key] = CacheEntry(data, ttl)

    def get(self, key: str) -> Optional[Any]:
        entry = self.cache.get(key)
        if not entry:
            return None

        if time.time() - entry.timestamp > entry.ttl:
            del self.cache[key]
            return None

        return entry.data

    def invalidate(self, pattern: Optional[str] = None):
        if not pattern:
            self.cache.clear()
            return

        keys_to_delete = [key for key in self.cache.keys() if re.match(pattern, key)]
        for key in keys_to_delete:
            del self.cache[key]

cache_manager = CacheManager()