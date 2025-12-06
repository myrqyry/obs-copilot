// src/lib/chatOverlayUtils.ts
import type { ChatBackgroundType, ChatPattern } from '@/types/chatBackground';
import { generatePatternCSS } from './backgroundPatterns';

export const baseChatOverlayHTML = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Chat Overlay</title>
  <style>
    :root{--bg:rgba(0,0,0,0.0);--bubble:rgba(10,10,12,0.5);--muted:#d1d5db}
    body{margin:0;padding:0;font-family:Inter,Segoe UI,Arial,sans-serif;background:transparent;color:#fff}
    .chat-root {
      position: relative;
      width: 100vw;
      height: 100vh;
      overflow: hidden;
      /* BACKGROUND-STYLE */
    }
    .messages {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 10;
      pointer-events: none;
      padding: 10px;
      box-sizing: border-box;
      max-height: 100vh;
      overflow: auto;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .row{display:flex;align-items:flex-start;gap:8px;pointer-events: auto;}
    .avatar{width:36px;height:36px;border-radius:8px;background:linear-gradient(135deg,#222,#111);flex:0 0 36px;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700}
    .msg{background:var(--bubble);padding:8px 10px;border-radius:10px;backdrop-filter:blur(4px);display:block;min-width:0}
    .meta{font-weight:700;margin-right:6px;display:inline-block}
    .meta .name{margin-right:6px}
    .msg .timestamp{color:var(--muted);font-size:11px;margin-left:8px}
    .content{display:inline;word-break:break-word}
    img.emote{height:20px;vertical-align:middle;margin:0 3px}
  </style>
</head>
<body>
  <div id="chat-root" class="chat-root">
    <div id="messages" class="messages"></div>
  </div>
  <script>
    // simple sanitizer shim so overlay runtime can sanitize incoming HTML safely
    (function(){
      try{
        if(window.DOMPurify && typeof window.DOMPurify.sanitize === 'function'){
          window.__sanitizeHtml__ = function(html){ return window.DOMPurify.sanitize(html, { FORBID_TAGS:['script','iframe','object','embed','form'], FORBID_ATTR:['on*','xmlns','xlink:href'] }); };
        } else {
          window.__sanitizeHtml__ = function(html){ var t=document.createElement('div'); t.textContent = html || ''; return t.innerHTML; };
        }
      }catch(e){ window.__sanitizeHtml__ = function(html){ var t=document.createElement('div'); t.textContent = html || ''; return t.innerHTML; }; }
    })();

    // parse query params
    const params = new URLSearchParams(location.search);
    const channel = params.get('channel') || 'default';
    const token = params.get('token');

    // helper to append HTML safely (messageHtml is produced by frontend and expected to be safe)
    function appendMessage(m){
      const container = document.getElementById('messages');
      const row = document.createElement('div');
      row.className = 'row';
      const avatar = document.createElement('div');
      avatar.className = 'avatar';
      avatar.textContent = (m.user||'U').slice(0,2).toUpperCase();

      const msgWrap = document.createElement('div');
      msgWrap.className = 'msg';

      const meta = document.createElement('div');
      meta.className = 'meta';
      const nameEl = document.createElement('span');
      nameEl.className = 'name';
      nameEl.textContent = m.user || 'unknown';
      if (m.nameColor) nameEl.style.color = m.nameColor;
      if (m.namePaintStyle) {
        try{ Object.assign(nameEl.style, m.namePaintStyle); }catch(e){}
      }
      const ts = document.createElement('span');
      ts.className = 'timestamp';
      ts.textContent = new Date(m.timestamp || Date.now()).toLocaleTimeString();
      meta.appendChild(nameEl);
      meta.appendChild(ts);

      const body = document.createElement('div');
      body.className = 'content';
      try{
        // sanitize message HTML if provided
        const sanitized = (window.__sanitizeHtml__ && typeof window.__sanitizeHtml__ === 'function')
          ? window.__sanitizeHtml__(m.messageHtml || '')
          : (function(html){ const t=document.createElement('div'); t.textContent=html; return t.innerHTML;})(m.messageHtml || '');
        body.innerHTML = sanitized;
        Array.from(body.querySelectorAll('img')).forEach(i=>i.classList.add('emote'));
      }catch(e){
        // fallback to textContent
        body.textContent = m.message || '';
      }

      msgWrap.appendChild(meta);
      msgWrap.appendChild(body);
      row.appendChild(avatar);
      row.appendChild(msgWrap);
      container.appendChild(row);
      // keep scroll to bottom
      container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
      // trim to a reasonable number
      const msgs = container.children;
      if (msgs.length > 300) container.removeChild(msgs[0]);
    }

    function connectSSE(){
      const url = \`/api/overlays/stream?channel=\${encodeURIComponent(channel)}\` + (token ? \`&token=\${encodeURIComponent(token)}\` : '');
      const es = new EventSource(url);
      es.onmessage = (ev) => {
        try{
          const data = JSON.parse(ev.data);
          appendMessage(data);
        }catch(e){console.warn('bad overlay message', e)}
      };
      es.onerror = (e) => {
        console.warn('SSE error, reconnecting in 2s', e);
        es.close();
        setTimeout(connectSSE, 2000);
      };
    }

    connectSSE();
  </script>
</body>
</html>`;

export function generateChatOverlayHTML(
  type: ChatBackgroundType,
  customBg: string | undefined,
  pattern: ChatPattern | undefined
): string {
  let backgroundStyle = '';
  if (type === 'image' && customBg) {
    backgroundStyle = `
      background-image: url(${customBg});
      background-size: cover;
      background-attachment: fixed;
      background-position: center;
    `;
  } else if (type === 'css' && pattern) {
    const cssImage = generatePatternCSS(pattern);
    backgroundStyle = `
      background-image: ${cssImage};
      background-size: ${pattern.spacing};
      background-repeat: repeat;
    `;
  }
  return baseChatOverlayHTML.replace('/* BACKGROUND-STYLE */', backgroundStyle);
}

export async function saveChatOverlayHTML(html: string): Promise<void> {
  if (!('showDirectoryPicker' in window)) {
    console.warn('File System Access API not supported');
    return;
  }
  try {
    // Get or create public/overlays directory
    const root = await navigator.storage.getDirectory();
    const publicDir = await root.getDirectoryHandle('public', { create: true });
    const overlaysDir = await publicDir.getDirectoryHandle('overlays', { create: true });
    const fileHandle = await overlaysDir.getFileHandle('chat-overlay.html', { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(html);
    await writable.close();
    console.log('Chat overlay HTML saved successfully');
  } catch (err) {
    console.error('Failed to save chat overlay HTML:', err);
    throw err;
  }
}