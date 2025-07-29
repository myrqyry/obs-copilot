import 'dotenv/config';
import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { apiConfigs } from './config/apis';

const app = express();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

app.use(cors());
app.use(express.json());

const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000;

function setCache(key: string, data: any) {
    cache.set(key, { data, timestamp: Date.now() });
    setTimeout(() => {
        cache.delete(key);
    }, CACHE_TTL);
}

function getCache(key: string) {
    const entry = cache.get(key);
    if (entry && (Date.now() - entry.timestamp < CACHE_TTL)) {
        return entry.data;
    }
    cache.delete(key);
    return null;
}

function isValidApiKey(key: string, serviceName: string) {
    if (!key || typeof key !== 'string') return false;
    const rules: { [key: string]: RegExp } = {
        pexels: /^.{56}$/,
        pixabay: /^\d+-[a-zA-Z0-9]+$/,
        giphy: /^[a-zA-Z0-9]{32}$/,
        unsplash: /^[a-zA-Z0-9_-]{43}$/,
    };
    if (rules[serviceName]) {
        return rules[serviceName].test(key);
    }
    return true;
}

async function fetchFromApiHost(apiConfig: any, queryParamsFromRequest: any, apiKeyOverride: any) {
  const params = new URLSearchParams();

  if (apiConfig.defaultParams) {
    for (const key in apiConfig.defaultParams) {
      params.append(key, apiConfig.defaultParams[key]);
    }
  }

  for (const requestParamName in queryParamsFromRequest) {
    if (apiConfig.paramMappings.hasOwnProperty(requestParamName)) {
      const targetApiParamName = apiConfig.paramMappings[requestParamName];
      if (queryParamsFromRequest[requestParamName] !== undefined) {
        params.append(targetApiParamName, queryParamsFromRequest[requestParamName]);
      }
    }
  }

  let determinedApiKey = apiKeyOverride;
  if (!determinedApiKey && apiConfig.apiKey) {
      for (const envVar of apiConfig.apiKey.envVars) {
          if (process.env[envVar]) {
              determinedApiKey = process.env[envVar];
              break;
          }
      }
  }

  if (apiConfig.apiKey?.paramName && determinedApiKey) {
    params.append(apiConfig.apiKey.paramName, determinedApiKey);
  }

  const targetApiUrl = `${apiConfig.baseUrl}?${params.toString()}`;
  const headers: { [key: string]: string } = {};
  if (apiConfig.authHeader && determinedApiKey) {
    headers[apiConfig.authHeader] = `${apiConfig.apiKey.prefix || ''}${determinedApiKey}`;
  }
  if (apiConfig.userAgent) {
    headers['User-Agent'] = apiConfig.userAgent;
  }

  const response = await fetch(targetApiUrl, { headers });

  if (!response.ok) {
    let errorBody = '';
    try {
      errorBody = await response.text();
    } catch (e) { /* ignore */ }
    throw new Error(`${apiConfig.label} API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  let results = data;
  if (apiConfig.responseDataPath) {
    results = apiConfig.responseDataPath.split('.').reduce((o: any, k: any) => (o || {})[k], data);
    if (results === undefined) {
        results = [];
    }
  }

  if (!Array.isArray(results) && apiConfig.responseDataPath) {
    if (results && results.error && results.message) {
        throw new Error(results.message);
    }
    results = [];
  }

  if (apiConfig.responseDataPath) {
      const rootData = { ...data };
      let current: any = rootData;
      const pathParts = apiConfig.responseDataPath.split('.');
      for(let i=0; i < pathParts.length -1; i++) {
          current = current[pathParts[i]] = current[pathParts[i]] || {};
      }
      current[pathParts[pathParts.length -1]] = results;
      return rootData;
  }

  return results;
}

app.get('/api/iconfinder/svg', async (req, res, next) => {
    const svgUrl = req.query.url as string;
    if (!svgUrl || typeof svgUrl !== 'string' || !svgUrl.startsWith('https://api.iconfinder.com/')) {
        return next({ status: 400, message: 'Invalid or missing SVG url' });
    }

    const clientApiKey = req.headers['x-api-key'] as string;
    const serverApiKey = process.env.ICONFINDER_API_KEY;
    const apiKeyToUse = clientApiKey || serverApiKey;

    if (!apiKeyToUse) {
        return next({ status: 500, message: 'Iconfinder API key not set in server env (ICONFINDER_API_KEY) and no override provided.' });
    }

    try {
        const response = await fetch(svgUrl, {
            headers: { Authorization: `Bearer ${apiKeyToUse}` }
        });
        if (!response.ok) {
            const errText = await response.text();
            return next({ status: response.status, message: 'Iconfinder SVG fetch error', details: errText });
        }
        res.set({
            'Content-Type': 'image/svg+xml',
            'Access-Control-Allow-Origin': '*',
            'Cross-Origin-Resource-Policy': 'cross-origin',
            'Cross-Origin-Embedder-Policy': 'unsafe-none'
        });
        response.body.pipe(res);
    } catch (err: any) {
        res.set({
            'Access-Control-Allow-Origin': '*',
            'Cross-Origin-Resource-Policy': 'cross-origin',
            'Cross-Origin-Embedder-Policy': 'unsafe-none'
        });
        return next({ status: 500, message: 'Proxy error', details: err.message });
    }
});

async function fetchAndServeFavicon(req: express.Request, res: express.Response, next: express.NextFunction) {
    const { domain, sz = 16 } = req.query;
    if (!domain) {
        return next({ status: 400, message: 'Domain parameter is required for favicon proxy' });
    }
    try {
        const googleUrl = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain as string)}&sz=${sz}`;
        const response = await fetch(googleUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; FaviconProxy/1.0)' },
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Favicon fetch failed: ${response.status} ${response.statusText} - ${errorText.substring(0,100)}`);
        }
        const contentType = response.headers.get('content-type') || 'image/x-icon';

        const buffer = await response.arrayBuffer();
        res.set({
            'Access-Control-Allow-Origin': '*',
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=86400',
            'Cross-Origin-Resource-Policy': 'cross-origin',
            'Cross-Origin-Embedder-Policy': 'unsafe-none',
        });
        res.send(Buffer.from(buffer));

    } catch (err: any) {
        return next({ status: 500, message: 'Failed to fetch favicon', details: err.message });
    }
}

app.get('/api/favicon', fetchAndServeFavicon);

app.get('/api/image', async (req, res, next) => {
    const { url } = req.query;
    if (!url) {
        return next({ status: 400, message: 'URL parameter is required for image proxy' });
    }

    try {
        const response = await fetch(url as string);
        if (!response.ok) {
            throw new Error(`Image fetch failed: ${response.status} ${response.statusText}`);
        }

        const contentType = response.headers.get('content-type') || 'image/jpeg';
        const buffer = await response.arrayBuffer();

        res.set({
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=3600',
            'Access-Control-Allow-Origin': '*',
            'Cross-Origin-Resource-Policy': 'cross-origin',
            'Cross-Origin-Embedder-Policy': 'unsafe-none'
        });
        res.send(Buffer.from(buffer));
    } catch (err: any) {
        res.set({
            'Access-Control-Allow-Origin': '*',
            'Cross-Origin-Resource-Policy': 'cross-origin',
            'Cross-Origin-Embedder-Policy': 'unsafe-none'
        });
        return next({ status: 500, message: 'Failed to fetch image', details: err.message });
    }
});

app.get('/api/:apiType', async (req, res, next) => {
    const apiType = req.params.apiType;
    const apiConfig = (apiConfigs as any)[apiType];

    if (!apiConfig) {
        return next({ status: 400, message: `Unknown API endpoint: ${req.path}` });
    }

    if (apiConfig.cacheable) {
        const cacheKey = req.originalUrl;
        const cachedResponse = getCache(cacheKey);
        if (cachedResponse) {
            res.set('Access-Control-Allow-Origin', '*');
            return res.json(cachedResponse);
        }
    }

    let apiKeyToUse = req.headers['x-api-key'] as string;

    if (!apiKeyToUse && apiConfig.apiKey) {
        apiKeyToUse = req.query[apiConfig.apiKey.queryParam] as string || null;
        if (!apiKeyToUse && apiConfig.apiKey.envVars) {
            for (const envVar of apiConfig.apiKey.envVars) {
                if (process.env[envVar]) {
                    apiKeyToUse = process.env[envVar] as string;
                    break;
                }
            }
        }
    }

    if (apiConfig.requiresKey && !apiKeyToUse) {
        return next({ status: 500, message: `${apiConfig.label || apiType} API key not provided by client or server environment.` });
    }

    if (apiKeyToUse && !isValidApiKey(apiKeyToUse, apiType)) {
        return next({ status: 400, message: `Invalid API key format for ${apiConfig.label}.` });
    }

    try {
        const results = await fetchFromApiHost(apiConfig, req.query, apiKeyToUse);
        if (apiConfig.cacheable) {
            setCache(req.originalUrl, results);
        }
        res.set('Access-Control-Allow-Origin', '*');
        return res.json(results);
    } catch (err: any) {
        return next({ status: 500, message: `Proxy error for ${apiType}`, details: err.message });
    }
});

app.post('/api/gemini/generate-content', async (req, res, next) => {
    const clientApiKey = req.headers['x-api-key'] as string;
    const serverApiKey = process.env.GEMINI_API_KEY;
    const apiKeyToUse = clientApiKey || serverApiKey;

    if (!apiKeyToUse) {
        return next({ status: 500, message: 'Gemini API key not set in server environment (GEMINI_API_KEY) and no override provided.' });
    }

    const model = req.body.model || 'gemini-pro';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKeyToUse}`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(req.body),
        });
        const data = await response.json();
        if (data.error) {
            return next({ status: 400, message: "Gemini API Error", details: data.error.message || JSON.stringify(data.error) });
        }
        res.json(data);
    } catch (err: any) {
        return next({ status: 500, message: 'Failed to fetch from Gemini (generate-content)', details: err.message });
    }
});

app.post('/api/gemini/generate-image', async (req, res, next) => {
    const clientApiKey = req.headers['x-api-key'] as string;
    const serverApiKey = process.env.GEMINI_API_KEY;
    const apiKeyToUse = clientApiKey || serverApiKey;

    if (!apiKeyToUse) {
        return next({ status: 500, message: 'Gemini API key not set for image generation and no override provided.' });
    }

    const { model, prompt, contents } = req.body;

    if (!prompt && !contents) {
        return next({ status: 400, message: 'Missing prompt or contents in request body for image generation.' });
    }
    if (prompt && typeof prompt !== 'string') {
        return next({ status: 400, message: 'Prompt must be a string for image generation.' });
    }
    if (contents && !Array.isArray(contents)) {
        return next({ status: 400, message: 'Contents must be an array for image generation.' });
    }
    const imageModel = model || 'gemini-pro-vision';

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${imageModel}:generateContent?key=${apiKeyToUse}`;

    try {
        const requestBody = {
            contents: contents || [{
                parts: [{ text: prompt }]
            }]
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
        });

        const data = await response.json();

        if (data.error) {
            return next({ status: 400, message: "Gemini API Error", details: data.error.message || JSON.stringify(data.error) });
        }
        res.json(data);
    } catch (err: any) {
        return next({ status: 500, message: 'Failed to fetch from Gemini (generate-image)', details: err.message });
    }
});

app.all('/api/obs/:action', async (req, res, next) => {
    const obsUrl = process.env.OBS_HTTP_API_URL;
    if (!obsUrl) {
        return next({ status: 500, message: 'OBS_HTTP_API_URL not set in environment' });
    }
    try {
        const response = await fetch(`${obsUrl}/${req.params.action}`, {
            method: req.method,
            headers: { 'Content-Type': 'application/json', ...(req.headers.authorization && { 'Authorization': req.headers.authorization }) },
            body: req.method !== 'GET' && req.body ? JSON.stringify(req.body) : undefined,
        });
        const data = await response.json();
        res.status(response.status).json(data);
    } catch (err: any) {
        return next({ status: 500, message: 'Failed to fetch from OBS', details: err.message });
    }
});

app.all('/api/streamerbot/:action', async (req, res, next) => {
    const streamerBotUrl = process.env.STREAMERBOT_API_URL;
    if (!streamerBotUrl) {
        return next({ status: 500, message: 'STREAMERBOT_API_API_URL not set in environment' });
    }
    try {
        const targetUrl = `${streamerBotUrl}${req.params.action}`;
        const response = await fetch(targetUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(req.body),
        });
        const data = await response.json();
        res.status(response.status).json(data);
    } catch (err: any) {
        return next({ status: 500, message: 'Failed to fetch from Streamer.bot', details: err.message });
    }
});

app.post('/api/chutes', async (req, res, next) => {
    const clientApiKey = req.headers['x-api-key'] as string;
    const serverApiKey = process.env.CHUTES_API_TOKEN;
    const apiKeyToUse = clientApiKey || serverApiKey;

    if (!apiKeyToUse) {
        return next({ status: 500, message: 'Chute API token not set in server environment (CHUTES_API_TOKEN) and no override provided.' });
    }

    try {
        const response = await fetch('https://chutes-flux-1-dev.chutes.ai/generate', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKeyToUse}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(req.body)
        });
        const data = await response.json();
        res.status(response.status).json(data);
    } catch (err: any) {
        return next({ status: 500, message: 'Failed to fetch from Chute API', details: err.message });
    }
});

app.use('/api', (req, res) => {
    res.status(404).json({ error: `API endpoint not found: ${req.originalUrl}` });
});

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    const status = err.status || 500;
    const message = err.message || 'Something went wrong on the server.';
    const details = err.details || (process.env.NODE_ENV === 'development' ? err.stack : undefined);

    if (res.headersSent) {
        return next(err);
    }

    res.status(status).json({
        error: message,
        ...(details && { details })
    });
});

export default app;
