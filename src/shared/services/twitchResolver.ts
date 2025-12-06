import axios from 'axios';

const CACHE_KEY = 'obs-copilot:twitch-id-cache:v1';
const TTL = 1000 * 60 * 60 * 24; // 24h

type CacheEntry = { ts: number; id: string | null };

const cache = new Map<string, CacheEntry>();

function persist() {
  try {
    const obj: Record<string, [number, string | null]> = {};
    cache.forEach((v, k) => { obj[k] = [v.ts, v.id]; });
    localStorage.setItem(CACHE_KEY, JSON.stringify(obj));
  } catch (e) {}
}

function restore() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as Record<string, [number, string | null]>;
    for (const k of Object.keys(parsed)) {
      const [ts, id] = parsed[k];
      cache.set(k, { ts, id });
    }
  } catch (e) {}
}

try { restore(); } catch (e) {}

function setCache(key: string, id: string | null) {
  cache.set(key, { ts: Date.now(), id });
  try { persist(); } catch (e) {}
}

function getCache(key: string) {
  const e = cache.get(key);
  if (!e) return null;
  if (Date.now() - e.ts > TTL) { cache.delete(key); return null; }
  return e.id;
}

// Resolve using multiple strategies. If tags.userId is provided, prefer it.
export async function resolveTwitchId(username: string, tagsUserId?: string, tmiClient?: any): Promise<string | null> {
  if (!username && !tagsUserId) return null;
  // if tags provided, return it directly and cache
  if (tagsUserId) {
    setCache(username.toLowerCase(), tagsUserId);
    return tagsUserId;
  }

  const key = username.toLowerCase();
  const cached = getCache(key);
  if (cached !== null) return cached;

  // try tmi client api helper if available (some environments expose it)
  try {
    if (tmiClient && typeof tmiClient.api === 'function') {
      try {
        // older tmi.js clients expose an api wrapper that can fetch Twitch endpoints
        const res = await tmiClient.api({ url: `/users?login=${encodeURIComponent(username)}` });
        // response shape may vary; try common patterns
        if (res && res.data && Array.isArray(res.data) && res.data[0] && res.data[0].id) {
          setCache(key, String(res.data[0].id));
          return String(res.data[0].id);
        }
        if (res && res[0] && res[0].id) {
          setCache(key, String(res[0].id));
          return String(res[0].id);
        }
      } catch (e) {
        // ignore and continue
      }
    }
  } catch (e) {}

  // Try Twitch Helix API if credentials exist in env
  try {
    // Prefer explicit environment variables. Vite's import.meta.env is not referenced here to avoid
    // requiring specific TS module settings; if you're building for the browser, ensure VITE_* vars
    // are injected at build-time.
    const clientId = process.env.TWITCH_CLIENT_ID || process.env.VITE_TWITCH_CLIENT_ID || null;
    const bearer = process.env.TWITCH_BEARER || process.env.VITE_TWITCH_BEARER || null;
    if (clientId && bearer) {
      const url = `https://api.twitch.tv/helix/users?login=${encodeURIComponent(username)}`;
      const res = await axios.get(url, { headers: { 'Client-ID': clientId, Authorization: `Bearer ${bearer}` }, timeout: 5000 });
      if (res.data && Array.isArray(res.data.data) && res.data.data[0] && res.data.data[0].id) {
        setCache(key, String(res.data.data[0].id));
        return String(res.data.data[0].id);
      }
    }
  } catch (e) {
    // ignore
  }

  // mark negative cache to avoid repeated lookups for same username
  setCache(key, null);
  return null;
}

export default { resolveTwitchId };
