import React, { useCallback, useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import _ from 'lodash';
import * as emoteService from '@/services/chatEmoteService';
import tmi from 'tmi.js';
import { useTheme } from '@/hooks/useTheme';
import twitchResolver from '@/services/twitchResolver';
import TwitchEmoticons from '@mkody/twitch-emoticons';
import { handleAppError } from '@/lib/errorUtils';
import useUiStore from '@/store/uiStore';
import type { SevenTVCosmetics } from '@/types/sevenTVCosmetics';

const { EmoteFetcher, EmoteParser } = TwitchEmoticons;

export type TmiTags = Record<string, string | undefined> & { emotes?: Record<string, string[]>; badges?: Record<string, string> };

export interface TwitchMessage {
  id: string;
  user: string;
  userId?: string;
  messageHtml: string;
  raw: string;
  nameColor?: string;
  namePaintStyle?: React.CSSProperties | null;
  pendingPaint?: boolean;
  tags?: TmiTags;
  timestamp: number;
}

export const useTmi = () => {
  const { theme } = useTheme();
  const [channel, setChannel] = useState('');
  const [connected, setConnected] = useState(false);
  const [client, setClient] = useState<any | null>(null);
  const [messages, setMessages] = useState<TwitchMessage[]>([]);
  const [emoteSize, setEmoteSize] = useState(20);
  const [maxMessages, setMaxMessages] = useState(200);
  const [newMessageAtTop, setNewMessageAtTop] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const [isAtBottom, setIsAtBottom] = useState(true);

  const clientRef = useRef<any | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const emoteMapRef = useRef<Map<string, { src: string }>>(new Map());
  const emoteFetcherRef = useRef<any | null>(null);
  const emoteParserRef = useRef<any | null>(null);
  const animatedSet = useRef<Set<string>>(new Set());
  const seq = useRef(0);
  const fetchedUsersRef = useRef<Set<string>>(new Set());
  const joinDebounceRef = useRef<ReturnType<typeof import('lodash').debounce> | null>(null);

  const makeId = useCallback(() => `m_${Date.now().toString(36)}_${seq.current++}`, []);

  // Escape HTML helper
  const escapeHtml = useCallback((s: string) => {
    return String(s).replace(/&/g, '&').replace(/</g, '<').replace(/>/g, '>').replace(/"/g, '"').replace(/'/g, '&#x27;');
  }, []);

  // Adjust HTML for size and lazy loading
  const adjustHtmlForSizeAndLazy = useCallback((html: string, sizePx: number) => {
    return html.replace(/<img([^>]+?)\/>/g, (_m, attrs) => {
      const attrsNoStyle = attrs.replace(/style="[^\"]*"/, '');
      const dataSrcMatch = /src=\"([^\"]*)\"/.exec(attrs);
      const src = dataSrcMatch ? dataSrcMatch[1] : undefined;
      const data = src ? ` data-src=\"${src}\"` : '';
      const srcAttr = src ? ` src=\"${src}\"` : '';
      const isAnimated = src && (src.endsWith('.gif') || src.endsWith('.apng'));
      const animateClass = isAnimated ? ' animate' : '';
      const existingClassesMatch = attrs.match(/class="([^"]*)"/);
      let classAttrValue = `w-4 h-4 sm:w-5 h-5 hover:scale-110 transition-transform${animateClass}`;
      if (existingClassesMatch && existingClassesMatch[1]) {
        classAttrValue = `${existingClassesMatch[1]} ${classAttrValue}`;
      }
      return `<img${attrsNoStyle}${srcAttr}${data} class="${classAttrValue}" style="vertical-align:middle;display:inline-block;margin:0 0.25rem;" loading="lazy" />`;
    });
  }, []);



  // Connect handler
  const handleConnect = useCallback(async () => {
    if (!channel) return;
    const c = new tmi.Client({ channels: [channel] });
    try {
      await c.connect();
      setClient(c);
      clientRef.current = c;
      setConnected(true);
  
      // Preload emotes
      try {
        const combined = await emoteService.getCombinedEmotes(undefined, channel);
        emoteMapRef.current = new Map(Object.entries(combined || {}).map(([k, v]: any) => [k, { src: v.src || v.url || '' }]));
      } catch (e) {
        const errorMsg = handleAppError('TMI emote preload', e, 'Failed to preload emotes');
        useUiStore.getState().addError({
          message: errorMsg,
          source: 'useTmi',
          level: 'error',
          details: { channel, error: e }
        });
      }
  
      // Preload channel cosmetics
      try {
        await emoteService.getSevenTVCosmetics(channel);
      } catch (e) {
        const errorMsg = handleAppError('TMI channel cosmetics preload', e, 'Failed to preload channel cosmetics');
        useUiStore.getState().addError({
          message: errorMsg,
          source: 'useTmi',
          level: 'error',
          details: { channel, error: e }
        });
      }
  
      // Instantiate EmoteFetcher/Parser
      try {
        const fetcher = new EmoteFetcher();
        emoteFetcherRef.current = fetcher;
        await Promise.all([
          fetcher.fetchBTTVEmotes(),
          fetcher.fetchSevenTVEmotes(),
          fetcher.fetchFFZEmotes(),
        ]);
        const parser = new EmoteParser(fetcher as any, { template: '<img class="emote" alt="{name}" src="{link}">' });
        emoteParserRef.current = parser;
      } catch (e) {
        const errorMsg = handleAppError('TMI emote fetcher', e, 'Failed to initialize emote fetcher');
        useUiStore.getState().addError({
          message: errorMsg,
          source: 'useTmi',
          level: 'error',
          details: { error: e }
        });
      }
  
      // Message handler
      c.on('message', async (_chan, tagsRaw, message, self) => {
        if (self) return;
        const tags = (tagsRaw || {}) as TmiTags;
        const html = emoteService.generateSafeMessageHtml(message, tags, emoteMapRef.current, emoteParserRef.current);
        const msg: TwitchMessage = { id: makeId(), user: (tags['display-name'] || tags.username) || 'unknown', userId: tags['user-id'], messageHtml: html, raw: message, tags, timestamp: Date.now(), namePaintStyle: null, pendingPaint: true };
  
        if (!tags.color) {
          (async () => {
            try {
              const lookupId = await twitchResolver.resolveTwitchId((tags['display-name'] || tags.username) || '', tags['user-id'], clientRef.current);
              if (lookupId) {
                const color = await emoteService.lookupNameColorFFZ(lookupId);
                if (color) setMessages((cur) => cur.map((m) => (m.id === msg.id ? { ...m, nameColor: color } : m)));
              }
            } catch (e) {
              const errorMsg = handleAppError('TMI FFZ color fetch', e, 'Failed to fetch name color');
              useUiStore.getState().addError({
                message: errorMsg,
                source: 'useTmi',
                level: 'error',
                details: { userId: tags['user-id'], error: e }
              });
            }
          })();
        } else {
          msg.nameColor = tags.color;
        }
  
        // 7TV namepaint
        (async () => {
          const userName = (tags['display-name'] || tags.username) || '';
          try {
            const lookupId = await twitchResolver.resolveTwitchId(userName, tags['user-id'], clientRef.current);
            if (lookupId && !fetchedUsersRef.current.has(lookupId)) {
              fetchedUsersRef.current.add(lookupId);
              setMessages((cur) => cur.map((m) => (m.id === msg.id ? { ...m, pendingPaint: true } : m)));
              const cos = await emoteService.getSevenTVCosmetics(lookupId);
              if (cos) {
                const style: React.CSSProperties = {};
                if (cos.paintBackground) {
                  style.WebkitTextFillColor = 'transparent';
                  style.backgroundClip = 'text';
                  style.WebkitBackgroundClip = 'text';
                  style.backgroundSize = 'cover';
                  style.backgroundColor = 'currentColor';
                  style.backgroundImage = cos.paintBackground;
                }
                if (cos.paintFilter) style.filter = cos.paintFilter;
                if (cos.paintColor) style.color = cos.paintColor;
                setMessages((cur) => cur.map((m) => (m.id === msg.id ? { ...m, namePaintStyle: style, pendingPaint: false } : m)));
              } else {
                setMessages((cur) => cur.map((m) => (m.id === msg.id ? { ...m, pendingPaint: false } : m)));
              }
            } else if (lookupId) {
              const cached = emoteService.getCachedCosmetics(lookupId);
              if (cached) {
                const style: React.CSSProperties = {};
                if (cached.paintBackground) {
                  style.WebkitTextFillColor = 'transparent';
                  style.backgroundClip = 'text';
                  style.WebkitBackgroundClip = 'text';
                  style.backgroundSize = 'cover';
                  style.backgroundColor = 'currentColor';
                  style.backgroundImage = cached.paintBackground;
                }
                if (cached.paintFilter) style.filter = cached.paintFilter;
                if (cached.paintColor) style.color = cached.paintColor;
                setMessages((cur) => cur.map((m) => (m.id === msg.id ? { ...m, namePaintStyle: style, pendingPaint: false } : m)));
              }
            }
          } catch (e) {
            const errorMsg = handleAppError('TMI 7TV cosmetics fetch', e, 'Failed to fetch 7TV cosmetics');
            useUiStore.getState().addError({
              message: errorMsg,
              source: 'useTmi',
              level: 'error',
              details: { userName, error: e }
            });
            setMessages((cur) => cur.map((m) => (m.id === msg.id ? { ...m, pendingPaint: false } : m)));
          }
        })();
  
        setMessages((prev) => {
          const next = newMessageAtTop ? [msg, ...prev] : [...prev, msg];
          if (next.length > maxMessages) return newMessageAtTop ? next.slice(0, maxMessages) : next.slice(next.length - maxMessages);
          return next;
        });
  
        // Publish to overlay SSE (preserve functionality)
        try {
          const payload = {
            channel: channel || _chan.replace(/^#/, ''),
            message: {
              user: (tags['display-name'] || tags.username) || 'unknown',
              userId: tags['user-id'],
              nameColor: tags.color || null,
              namePaintStyle: msg.namePaintStyle ? JSON.stringify(msg.namePaintStyle) : null,
              messageHtml: html,
              raw: message,
              timestamp: Date.now(),
            }
          };
          fetch('/api/overlays/publish', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          }).catch((err) => {
            const errorMsg = handleAppError('TMI overlay publish', err, 'Failed to publish message to overlay');
            useUiStore.getState().addError({
              message: errorMsg,
              source: 'useTmi',
              level: 'error',
              details: { channel, error: err }
            });
          });
        } catch (e) {
          const errorMsg = handleAppError('TMI overlay publish', e, 'Error during overlay publish');
          useUiStore.getState().addError({
            message: errorMsg,
            source: 'useTmi',
            level: 'error',
            details: { channel, error: e }
          });
        }
      });
  
      // Join handler for preloading cosmetics
      joinDebounceRef.current = _.debounce(async (username: string) => {
        try {
          if (username && !fetchedUsersRef.current.has(username)) {
            const resolved = await twitchResolver.resolveTwitchId(String(username), undefined, clientRef.current);
            if (resolved) {
              fetchedUsersRef.current.add(resolved);
              await emoteService.getSevenTVCosmetics(resolved);
            }
          }
        } catch (e) {
          const errorMsg = handleAppError('TMI 7TV cosmetics preload join', e, 'Failed to preload 7TV cosmetics for join');
          useUiStore.getState().addError({
            message: errorMsg,
            source: 'useTmi',
            level: 'error',
            details: { username, error: e }
          });
        }
      }, 1000);
  
      (c as any).on('join', (_chan: string, username: any, self: boolean) => {
        if (self) return;
        joinDebounceRef.current?.(String(username));
      });
    } catch (err) {
      const errorMsg = handleAppError('TMI connection', err, `Failed to connect to Twitch chat for channel ${channel}`);
      useUiStore.getState().addError({
        message: errorMsg,
        source: 'useTmi',
        level: 'critical',
        details: { channel, error: err }
      });
      console.error(errorMsg);
    }
  }, [channel, newMessageAtTop, maxMessages, makeId]);

  // Disconnect handler
  const handleDisconnect = useCallback(() => {
    try {
      if (clientRef.current) clientRef.current.disconnect();
    } catch (err) {
      const errorMsg = handleAppError('TMI disconnect', err, 'Failed to disconnect from Twitch chat');
      useUiStore.getState().addError({
        message: errorMsg,
        source: 'useTmi',
        level: 'error',
        details: { channel, error: err }
      });
    }
    clientRef.current = null;
    setConnected(false);
    setMessages([]);
    emoteMapRef.current.clear();
    fetchedUsersRef.current.clear();
    emoteService.clearCosmeticsCache();
    if (joinDebounceRef.current) {
      joinDebounceRef.current.cancel();
    }
  }, [channel]);

  // Lazy loader observer
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

  // Scroll listener
  useEffect(() => {
    const handleScroll = () => {
      const el = listRef.current;
      if (el) {
        const { scrollTop, scrollHeight, clientHeight } = el;
        setIsAtBottom(scrollTop + clientHeight >= scrollHeight - 5);
      }
    };

    const el = listRef.current;
    if (el) {
      el.addEventListener('scroll', handleScroll);
      return () => el.removeEventListener('scroll', handleScroll);
    }
  }, []);

  // Animation effect
  useEffect(() => {
    const root = listRef.current;
    if (!root) return;
    const allNodes = Array.from(root.querySelectorAll('[data-msg-id]')) as HTMLElement[];
    const newNodes = allNodes.filter(n => {
      const id = n.getAttribute('data-msg-id') || '';
      return !animatedSet.current.has(id);
    });
    for (const n of newNodes) {
      const id = n.getAttribute('data-msg-id') || '';
      animatedSet.current.add(id);
    }

    if (newNodes.length > 0) {
      gsap.fromTo(newNodes, { y: 8, opacity: 0 }, { y: 0, opacity: 1, duration: 0.28, ease: 'power2.out', stagger: 0.05 });
    }

    if (autoScroll && isAtBottom) {
      if (newMessageAtTop) root.scrollTo({ top: 0, behavior: 'smooth' });
      else root.scrollTo({ top: root.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, autoScroll, newMessageAtTop, isAtBottom]);

  return {
    channel,
    setChannel,
    connected,
    messages,
    setMessages,
    emoteSize,
    setEmoteSize,
    maxMessages,
    setMaxMessages,
    newMessageAtTop,
    setNewMessageAtTop,
    autoScroll,
    setAutoScroll,
    isAtBottom,
    listRef,
    handleConnect,
    handleDisconnect,
    escapeHtml,
    adjustHtmlForSizeAndLazy,
  };
};