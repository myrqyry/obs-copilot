import React, { useCallback, useEffect, useRef, useState } from 'react';
import tmi from 'tmi.js';
import { gsap } from 'gsap';
import emoteService from '@/services/chatEmoteService';
import twitchResolver from '@/services/twitchResolver';
import TwitchEmoticons from '@mkody/twitch-emoticons';
const { EmoteFetcher, EmoteParser } = TwitchEmoticons;

type TmiTags = Record<string, string | undefined> & { emotes?: Record<string, string[]> };

interface TwitchMessage {
  id: string;
  user: string;
  userId?: string;
  messageHtml: string; // safe HTML including img tags for emotes
  raw: string;
  nameColor?: string;
  namePaintStyle?: React.CSSProperties | null;
}

const TwitchChat: React.FC = () => {
  const [channel, setChannel] = useState('');
  const [connected, setConnected] = useState(false);
  const [client, setClient] = useState<any | null>(null);
  const clientRef = useRef<any | null>(null);
  const [messages, setMessages] = useState<TwitchMessage[]>([]);
  const [emoteSize, setEmoteSize] = useState(20);
  const [maxMessages, setMaxMessages] = useState(200);
  const [newMessageAtTop, setNewMessageAtTop] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);

  const listRef = useRef<HTMLDivElement | null>(null);
  const emoteMapRef = useRef<Map<string, { src: string }>>(new Map());
  const emoteFetcherRef = useRef<any | null>(null);
  const emoteParserRef = useRef<any | null>(null);
  const animatedSet = useRef<Set<string>>(new Set());
  const seq = useRef(0);

  const makeId = useCallback(() => `m_${Date.now().toString(36)}_${seq.current++}`, []);

  // helper to escape
  function escapeHtml(s: string) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  // small utility to inject size and lazy attributes into generated img tags
  function adjustHtmlForSizeAndLazy(html: string, sizePx: number) {
    return html.replace(/<img([^>]+?)\/>/g, (_m, attrs) => {
      // remove any existing style attr and re-add
      const attrsNoStyle = attrs.replace(/style="[^\"]*"/, '');
      const dataSrcMatch = /src=\"([^\"]*)\"/.exec(attrs);
      const src = dataSrcMatch ? dataSrcMatch[1] : undefined;
      const data = src ? ` data-src=\"${src}\"` : '';
      const srcAttr = src ? ` src=\"${src}\"` : '';
      return `<img${attrsNoStyle}${srcAttr}${data} style=\"height:${sizePx}px;vertical-align:middle;display:inline-block;margin:0 4px;\" loading=\"lazy\"/>`;
    });
  }

  // lazy loader observer
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const observer = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          const img = e.target as HTMLImageElement;
          const d = img.getAttribute('data-src');
          if (d) img.src = d;
          observer.unobserve(img);
        }
      }
    }, { root: null, rootMargin: '300px', threshold: 0.01 });

    const imgs = Array.from(document.querySelectorAll('img[data-src]')) as HTMLImageElement[];
    imgs.forEach((i) => observer.observe(i));
    return () => observer.disconnect();
  }, [messages]);

  // animate newly added messages
  useEffect(() => {
    const root = listRef.current;
    if (!root) return;
    const nodes = Array.from(root.querySelectorAll('[data-msg-id]')) as HTMLElement[];
    for (const n of nodes) {
      const id = n.getAttribute('data-msg-id') || '';
      if (!animatedSet.current.has(id)) {
        animatedSet.current.add(id);
        gsap.fromTo(n, { y: 8, opacity: 0 }, { y: 0, opacity: 1, duration: 0.28, ease: 'power2.out' });
      }
    }

    if (autoScroll) {
      if (newMessageAtTop) root.scrollTo({ top: 0, behavior: 'smooth' });
      else root.scrollTo({ top: root.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, autoScroll, newMessageAtTop]);

  // format message text: apply twitch tag emotes exactly, then token-scan for third-party emotes
  function buildMessageHtml(text: string, tags?: TmiTags) {
    const twitchEmotes: Array<{ start: number; end: number; src: string; code: string }> = [];
    if (tags?.emotes) {
      for (const emId of Object.keys(tags.emotes)) {
        const occ = tags.emotes[emId] ?? [];
        for (const o of occ) {
          const [sStr, eStr] = String(o).split('-');
          const s = parseInt(sStr, 10);
          const e = parseInt(eStr, 10);
          if (!Number.isNaN(s) && !Number.isNaN(e)) {
            const code = text.substring(s, e + 1);
            const src = `https://static-cdn.jtvnw.net/emoticons/v1/${emId}/3.0`;
            twitchEmotes.push({ start: s, end: e, src, code });
          }
        }
      }
      twitchEmotes.sort((a, b) => a.start - b.start);
    }

    const parts: string[] = [];
    let last = 0;
    for (const te of twitchEmotes) {
      if (te.start > last) {
        parts.push(replaceThirdPartyEmotesInText(text.substring(last, te.start)));
      }
      parts.push(`<img src=\"${te.src}\" alt=\"${escapeHtml(te.code)}\" title=\"${escapeHtml(te.code)}\"/>`);
      last = te.end + 1;
    }
    if (last < text.length) parts.push(replaceThirdPartyEmotesInText(text.substring(last)));
    return parts.join('');
  }

  function replaceThirdPartyEmotesInText(fragment: string) {
    if (!fragment) return '';
    // Prefer using any parser provided by tmi.js runtime when available (some builds expose third-party emote parsing),
    // then fall back to the EmoteParser from @mkody/twitch-emoticons, then to a token-scan using our emote map.
    try {
      const tmiClient = clientRef.current;
      if (tmiClient) {
        // try several common parse entry points if the runtime exposes them
        const possibleParsers = ['parseEmotes', 'parseEmoticons', 'parseEmoticonsInMessage', 'parseMessageEmotes'];
        for (const fn of possibleParsers) {
          const p = (tmiClient as any)[fn];
          if (typeof p === 'function') {
            try {
              const r = p.call(tmiClient, fragment);
              if (typeof r === 'string' && r.length) return r;
            } catch (err) {
              // ignore parser errors and continue to next option
            }
          }
        }
      }
    } catch (e) {
      // ignore
    }

    // Prefer using the EmoteParser when available for richer provider support
    const parser = emoteParserRef.current;
    if (parser) {
      try {
        return parser.parse(fragment);
      } catch (e) {
        console.warn('emote parser parse failed', e);
      }
    }

    const tokens = fragment.split(/(\s+|[.,!?:;()\[\]{}])/g);
    return tokens.map((tok) => {
      if (!tok || /^\s+$/.test(tok) || /^[.,!?:;()\[\]{}]$/.test(tok)) return escapeHtml(tok);
      const em = emoteMapRef.current.get(tok);
      if (em) return `<img src=\"${em.src}\" alt=\"${escapeHtml(tok)}\" title=\"${escapeHtml(tok)}\"/>`;
      return escapeHtml(tok);
    }).join('');
  }

  // connect/disconnect
  const handleConnect = async () => {
    if (!channel) return;
    const c = new tmi.Client({ channels: [channel] });
    try {
      await c.connect();
      setClient(c);
  clientRef.current = c;
      setConnected(true);

      // preload emotes for channel (use combined service)
      try {
        const combined = await emoteService.getCombinedEmotes(undefined, channel);
        emoteMapRef.current = new Map(Object.entries(combined || {}).map(([k, v]: any) => [k, { src: v.src || v.url || '' }]));
      } catch (e) {
        // ignore emote preload failures
        console.warn('emote preload failed', e);
      }

      // preload channel cosmetics (7TV) for channel name
      try {
        const cosmetics = await emoteService.getSevenTVCosmetics(channel);
        if (cosmetics) {
          // channel-level cosmetics not used directly for names, but we cache it in service
          // nothing to do here explicitly — getSevenTVCosmetics does caching
        }
      } catch (e) {
        // ignore
      }

      // instantiate EmoteFetcher/Parser from @mkody/twitch-emoticons to improve parsing & formats
      try {
        const fetcher = new EmoteFetcher();
        emoteFetcherRef.current = fetcher;
        // fetch common providers (global)
        await Promise.all([
          fetcher.fetchBTTVEmotes(),
          fetcher.fetchSevenTVEmotes(),
          fetcher.fetchFFZEmotes(),
        ]);
  // cast fetcher to any to avoid a typing mismatch in the package's d.ts (we use it at runtime)
  const parser = new EmoteParser(fetcher as any, { template: '<img class="emote" alt="{name}" src="{link}">' });
        emoteParserRef.current = parser;
      } catch (e) {
        console.warn('mkody emote fetcher failed', e);
      }

      c.on('message', async (_chan, tagsRaw, message, self) => {
        if (self) return;
        const tags = (tagsRaw || {}) as TmiTags;
        const html = buildMessageHtml(message, tags);
        const msg: TwitchMessage = { id: makeId(), user: (tags['display-name'] || tags.username) || 'unknown', userId: tags['user-id'], messageHtml: html, raw: message, namePaintStyle: null };

  // If the message doesn't include a color from Twitch tags, try FFZ user color as a fallback
        if (!tags.color) {
          // kick off but don't block UI; update message when resolved
          (async () => {
            try {
              const lookupId = await twitchResolver.resolveTwitchId((tags['display-name'] || tags.username) || '', tags['user-id'], clientRef.current);
              if (lookupId) {
                const color = await emoteService.lookupNameColorFFZ(lookupId);
                if (color) setMessages((cur) => cur.map((m) => (m.id === msg.id ? { ...m, nameColor: color } : m)));
              }
            } catch (e) {
              // ignore
            }
          })();
        } else {
          msg.nameColor = tags.color;
        }

        // Try to get 7TV namepaint for this user (if available). Update message in-place when resolved.
        (async () => {
          try {
            const lookupId = await twitchResolver.resolveTwitchId((tags['display-name'] || tags.username) || '', tags['user-id'], clientRef.current);
            if (lookupId) {
              const cos = await emoteService.getSevenTVCosmetics(lookupId);
              if (cos) {
                // build CSS style similar to SevenTVNamepaint
                const style: React.CSSProperties = {};
                if (cos.paintBackground) {
                  style.WebkitTextFillColor = 'transparent';
                  style.backgroundClip = 'text';
                  (style as any).WebkitBackgroundClip = 'text';
                  style.backgroundSize = 'cover';
                  style.backgroundColor = 'currentColor';
                  style.backgroundImage = cos.paintBackground;
                }
                if (cos.paintFilter) style.filter = cos.paintFilter as any;
                if (cos.paintColor) style.color = cos.paintColor;
                setMessages((cur) => cur.map((m) => (m.id === msg.id ? { ...m, namePaintStyle: style } : m)));
              }
            }
          } catch (e) {
            // ignore
          }
        })();

        setMessages((prev) => {
          const next = newMessageAtTop ? [msg, ...prev] : [...prev, msg];
          if (next.length > maxMessages) return newMessageAtTop ? next.slice(0, maxMessages) : next.slice(next.length - maxMessages);
          return next;
        });

        // Best-effort: publish message to overlay SSE endpoint so hosted overlays receive it
        try {
          const payload = {
            channel: channel || _chan.replace(/^#/, ''),
            message: {
              user: (tags['display-name'] || tags.username) || 'unknown',
              userId: tags['user-id'],
              nameColor: tags.color || null,
              namePaintStyle: null,
              messageHtml: html,
              raw: message,
              timestamp: Date.now(),
            }
          };
          // attempt to include basic name paint info if available in msg object
          if (msg.namePaintStyle) {
            // cast to any for serialization across network boundary
            (payload.message as any).namePaintStyle = msg.namePaintStyle as any;
          }

          fetch(`/api/overlays/publish`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          }).catch(() => { /* ignore publish failures */ });
        } catch (e) {
          // ignore
        }
      });

      // Preload cosmetics for users when they join so namepaints are available before their first message
      (c as any).on('join', async (_chan: string, username: any, self: boolean) => {
        if (self) return;
        try {
          if (username) {
            const resolved = await twitchResolver.resolveTwitchId(String(username), undefined, c);
            await emoteService.getSevenTVCosmetics(String(resolved || username));
          }
        } catch (e) {
          // ignore
        }
      });
    } catch (err) {
      console.error('tmi connect failed', err);
    }
  };

  const handleDisconnect = () => {
    if (client) client.disconnect();
    setClient(null);
    clientRef.current = null;
    setConnected(false);
    setMessages([]);
    emoteMapRef.current.clear();
  };

  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold mb-3">Twitch Chat</h3>
      <div className="flex gap-2 mb-3">
        <input value={channel} onChange={(e) => setChannel(e.target.value)} placeholder="channel" className="p-2 rounded border" />
        {connected ? <button onClick={handleDisconnect} className="p-2 bg-destructive hover:bg-destructive/90 text-white rounded transition-colors">Disconnect</button> : <button onClick={handleConnect} className="p-2 bg-accent hover:bg-accent/90 text-white rounded transition-colors">Connect</button>}
      </div>

      <div className="mb-3 flex items-center gap-3">
        <label>Emote size</label>
        <select value={String(emoteSize)} onChange={(e) => setEmoteSize(Number(e.target.value))}>
          <option value="16">16</option>
          <option value="20">20</option>
          <option value="28">28</option>
          <option value="40">40</option>
        </select>

        <label>Max</label>
        <input type="number" value={maxMessages} onChange={(e) => setMaxMessages(Math.max(10, Number(e.target.value || 0)))} className="w-20" />

        <label><input type="checkbox" checked={newMessageAtTop} onChange={(e) => setNewMessageAtTop(e.target.checked)} /> New at top</label>
        <label><input type="checkbox" checked={autoScroll} onChange={(e) => setAutoScroll(e.target.checked)} /> Auto-scroll</label>
      </div>

      <div ref={listRef} className="h-80 overflow-auto border p-2 bg-white">
        {messages.map((m) => (
          <div key={m.id} data-msg-id={m.id} className="mb-2">
            <strong style={{ color: m.nameColor ?? undefined }}>{m.user}</strong>{': '}
            <span dangerouslySetInnerHTML={{ __html: adjustHtmlForSizeAndLazy(m.messageHtml, emoteSize) }} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default TwitchChat;
