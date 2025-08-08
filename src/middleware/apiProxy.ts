import express from 'express';
import fetch from 'node-fetch';
import { apiConfigs } from '../config/apis';

export const apiProxy = express.Router();

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

apiProxy.get('/:apiType', async (req, res, next) => {
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

apiProxy.get('/iconify/search', async (req, res, next) => {
    const { query, limit, prefix } = req.query;
    if (!query) {
        return next({ status: 400, message: 'Missing query parameter' });
    }

    try {
        const apiUrl = `https://api.iconify.design/search?query=${encodeURIComponent(query as string)}&limit=${limit || 48}${prefix ? `&prefix=${prefix}` : ''}`;
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error(`Iconify API error: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        res.json(data);
    } catch (err: any) {
        return next({ status: 500, message: 'Failed to fetch from Iconify search', details: err.message });
    }
});

apiProxy.get('/iconify/svg/:iconName', async (req, res, next) => {
    const { iconName } = req.params;
    try {
        const response = await fetch(`https://api.iconify.design/${iconName}.svg`);
        if (!response.ok) {
            throw new Error(`Iconify SVG error: ${response.status} ${response.statusText}`);
        }
        const svgText = await response.text();
        res.header('Content-Type', 'image/svg+xml');
        res.send(svgText);
    } catch (err: any) {
        return next({ status: 500, message: 'Failed to fetch SVG from Iconify', details: err.message });
    }
});

apiProxy.post('/gemini/generate-content', async (req, res, next) => {
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

apiProxy.post('/gemini/generate-image', async (req, res, next) => {
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

apiProxy.all('/obs/:action', async (req, res, next) => {
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

apiProxy.all('/streamerbot/:action', async (req, res, next) => {
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

apiProxy.post('/chutes', async (req, res, next) => {
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
