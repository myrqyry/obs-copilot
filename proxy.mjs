import 'dotenv/config';
import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';
import rateLimit from 'express-rate-limit'; // Import rate-limit
const app = express();

// Rate limiting middleware
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Apply rate limiting to all API routes
app.use('/api/', limiter);

app.use(cors());
app.use(express.json());

// In-memory cache for API responses
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

function setCache(key, data) {
    cache.set(key, { data, timestamp: Date.now() });
    setTimeout(() => {
        cache.delete(key);
    }, CACHE_TTL);
}

function getCache(key) {
    const entry = cache.get(key);
    if (entry && (Date.now() - entry.timestamp < CACHE_TTL)) {
        return entry.data;
    }
    cache.delete(key); // Invalidate if expired
    return null;
}

// --- API Configurations ---
const apiConfigs = {
  wallhaven: {
    label: 'Wallhaven',
    baseUrl: 'https://wallhaven.cc/api/v1/search',
    paramMappings: { q: 'q', categories: 'categories', purity: 'purity', sorting: 'sorting', order: 'order', page: 'page' },
    defaultParams: { categories: '111', purity: '100', sorting: 'relevance', order: 'desc' },
    requiresKey: false, // Wallhaven public API doesn't strictly require a key for basic search
    // apiKey: { queryParam: 'apikey', envVars: ['WALLHAVEN_API_KEY'] }, // Optional key
    responseDataPath: 'data', // Path to array, e.g., if response is { data: [...] }
    // transformResult: (item) => item, // Default: return item as is
  },
  pexels: {
    label: 'Pexels',
    baseUrl: 'https://api.pexels.com/v1/search',
    // Client sends 'query', Pexels API also expects 'query'.
    // Client sends 'per_page', Pexels API also expects 'per_page'.
    paramMappings: { query: 'query', per_page: 'per_page', orientation: 'orientation', page: 'page' },
    authHeader: 'Authorization',
    apiKey: { queryParam: 'key', envVars: ['PEXELS_API_KEY', 'VITE_PEXELS_API_KEY'] },
    requiresKey: true,
    responseDataPath: 'photos',
    // transformResult: (item) => item,
  },
  pixabay: {
    label: 'Pixabay',
    baseUrl: 'https://pixabay.com/api/',
    paramMappings: { q: 'q', image_type: 'image_type', orientation: 'orientation', per_page: 'per_page', page: 'page' },
    apiKey: { queryParam: 'key', envVars: ['PIXABAY_API_KEY', 'VITE_PIXABAY_API_KEY'], paramName: 'key' }, // Pixabay key is a regular param
    requiresKey: true,
    responseDataPath: 'hits',
    // transformResult: (item) => item,
  },
  deviantart: { // Note: DeviantArt's public search might be limited or deprecated. This is a best guess.
    label: 'DeviantArt',
    baseUrl: 'https://www.deviantart.com/api/v1/oauth2/browse/search', // This might require OAuth2 token
    paramMappings: { q: 'q', limit: 'limit', mature_content: 'mature_content' },
    apiKey: { queryParam: 'access_token', envVars: ['DEVIANTART_API_KEY', 'VITE_DEVIANTART_API_KEY'], paramName: 'access_token'},
    requiresKey: true, // Typically yes
    responseDataPath: 'results',
    // transformResult: (item) => item,
  },
  imgflip: { // For memes primarily, but can return GIFs
    label: 'Imgflip',
    baseUrl: 'https://api.imgflip.com/search', // This is likely for their meme search, not generic GIFs
    paramMappings: { q: 'q', limit: 'limit', page: 'page' },
    apiKey: { queryParam: 'api_key', envVars: ['IMGFLIP_API_KEY', 'VITE_IMGFLIP_API_KEY'], paramName: 'api_key' },
    requiresKey: false, // Some endpoints might work without a key but are rate-limited
    responseDataPath: 'data.memes', // Example, adjust if it's for GIFs specifically
    // transformResult: (item) => item,
  },
  imgur: { // Imgur gallery search
    label: 'Imgur',
    baseUrl: 'https://api.imgur.com/3/gallery/search',
    paramMappings: { q: 'q', limit: 'limit', page: 'page', q_type: 'q_type' /* e.g. 'gif' */ },
    authHeader: 'Authorization', // Uses 'Client-ID YOUR_CLIENT_ID'
    apiKey: { envVars: ['IMGUR_API_KEY', 'VITE_IMGUR_API_KEY'], prefix: 'Client-ID ' }, // Special prefix for Imgur
    requiresKey: true,
    responseDataPath: 'data',
    // transformResult: (item) => item,
  },
  artstation: {
    label: 'ArtStation',
    baseUrl: 'https://www.artstation.com/search/projects.json',
    paramMappings: { q: 'q', page: 'page', per_page: 'per_page' },
    requiresKey: false,
    userAgent: 'OBS-Copilot/1.0', // ArtStation might require a User-Agent
    responseDataPath: 'data',
    // transformResult: (item) => item,
  },
  iconfinder: { // For Iconfinder search (not SVG fetch)
    label: 'Iconfinder Search',
    baseUrl: 'https://api.iconfinder.com/v4/icons/search',
    paramMappings: { query: 'query', count: 'count', premium: 'premium', vector: 'vector' },
    authHeader: 'Authorization', // Bearer token
    apiKey: { envVars: ['ICONFINDER_API_KEY', 'VITE_ICONFINDER_API_KEY'], prefix: 'Bearer ' },
    requiresKey: true,
    // responseDataPath: 'icons', // Assuming results are in 'icons' array
    // transformResult: (item) => item, // Or map to a common structure
  },
  // Giphy is handled separately by its SDK usually, but if we proxy search:
  giphy: {
    label: 'Giphy',
    baseUrl: 'https://api.giphy.com/v1/gifs/search',
    paramMappings: { q: 'q', limit: 'limit', offset: 'offset', rating: 'rating', lang: 'lang' },
    apiKey: { queryParam: 'api_key', envVars: ['GIPHY_API_KEY', 'VITE_GIPHY_API_KEY'], paramName: 'api_key' },
    requiresKey: true,
    responseDataPath: 'data',
    cacheable: true, // Mark Giphy as cacheable
    // transformResult: (item) => item,
  },
  unsplash: { // Unsplash API
    label: 'Unsplash',
    baseUrl: 'https://api.unsplash.com/',
    paramMappings: {}, // Handled by specific sub-routes
    authHeader: 'Authorization',
    apiKey: { envVars: ['UNSPLASH_API_KEY'], prefix: 'Client-ID ' },
    requiresKey: true,
    responseDataPath: 'results', // Default for search results
  }
};

// --- Generic API Fetch Function ---
async function fetchFromApiHost(apiConfig, queryParamsFromRequest, apiKeyOverride) {
  const params = new URLSearchParams();

  // Apply default params from config
  if (apiConfig.defaultParams) {
    for (const key in apiConfig.defaultParams) {
      params.append(key, apiConfig.defaultParams[key]);
    }
  }

  // Map and append query params from the original request
  for (const requestParamName in queryParamsFromRequest) {
    // Check if this request param is defined in our mappings for the current API
    // The key in paramMappings is the name we use internally/in client request (e.g. 'q')
    // The value is the name the target API expects (e.g. 'query')
    if (apiConfig.paramMappings.hasOwnProperty(requestParamName)) {
      const targetApiParamName = apiConfig.paramMappings[requestParamName];
      if (queryParamsFromRequest[requestParamName] !== undefined) {
        params.append(targetApiParamName, queryParamsFromRequest[requestParamName]);
      }
    } else if (requestParamName === apiConfig.apiKey?.queryParam && queryParamsFromRequest[requestParamName]) {
      // If the param is the API key itself (passed via query), it's handled by apiKey logic later
      // but we don't want to pass it as a regular param if it's not in paramMappings.
      // This 'else if' might be redundant if API key query params are excluded from paramMappings.
    } else {
      // Optionally, pass through unknown parameters if the API supports it, or ignore them.
      // For now, only mapped parameters are passed.
      // If you wanted to pass all, you'd do: params.append(requestParamName, queryParamsFromRequest[requestParamName]);
    }
  }

  let determinedApiKey = apiKeyOverride; // Use override if provided
  if (!determinedApiKey && apiConfig.apiKey) { // If no override, try to get from env
      for (const envVar of apiConfig.apiKey.envVars) {
          if (process.env[envVar]) {
              determinedApiKey = process.env[envVar];
              break;
          }
      }
  }

  // If API key is configured to be a URL parameter (e.g., Pixabay, Giphy)
  if (apiConfig.apiKey?.paramName && determinedApiKey) {
    params.append(apiConfig.apiKey.paramName, determinedApiKey);
  }

  const targetApiUrl = `${apiConfig.baseUrl}?${params.toString()}`;
  const headers = {};
  if (apiConfig.authHeader && determinedApiKey) {
    headers[apiConfig.authHeader] = `${apiConfig.apiKey.prefix || ''}${determinedApiKey}`;
  }
  if (apiConfig.userAgent) {
    headers['User-Agent'] = apiConfig.userAgent;
  }

  console.log(`[Proxy] Fetching from ${apiConfig.label}: ${targetApiUrl} with headers:`, headers);


  const response = await fetch(targetApiUrl, { headers });

  if (!response.ok) {
    let errorBody = '';
    try {
      errorBody = await response.text();
    } catch (e) { /* ignore, if can't read body */ }
    console.error(`[Proxy] Error from ${apiConfig.label}: ${response.status} ${response.statusText}. Body: ${errorBody.substring(0, 200)}`);
    throw new Error(`${apiConfig.label} API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  // Extract results using responseDataPath if provided
  let results = data;
  if (apiConfig.responseDataPath) {
    results = apiConfig.responseDataPath.split('.').reduce((o, k) => (o || {})[k], data);
    if (results === undefined) { // Path was valid but led to undefined
        console.warn(`[Proxy] Data path '${apiConfig.responseDataPath}' resulted in undefined for ${apiConfig.label}. Full response:`, JSON.stringify(data).substring(0,500));
        results = []; // Default to empty array if path leads to undefined
    }
  }

  if (!Array.isArray(results) && apiConfig.responseDataPath) { // Only warn if a path was specified and didn't yield an array
    console.warn(`[Proxy] Expected array from ${apiConfig.label} at path '${apiConfig.responseDataPath}', but got: ${typeof results}. Full data:`, JSON.stringify(data).substring(0,500));
    // If it's an error object from the API itself (e.g. ArtStation { error: ..., message: ...})
    if (results && results.error && results.message) {
        throw new Error(results.message);
    }
    results = []; // Default to empty array if not an array
  } else if (!Array.isArray(results) && !apiConfig.responseDataPath) {
    // If no path, data itself should be the array or an object that the client handles
    // For search APIs, we typically expect an array.
    // This case is fine if the API returns a single object instead of an array (e.g. getPhoto)
  }


  // Apply transformation if defined, otherwise return as is
  // This is disabled for now to return raw API data, client will handle transformation if needed or proxy already structures it.
  // if (apiConfig.transformResult && Array.isArray(results)) {
  //   results = results.map(apiConfig.transformResult);
  // }

  // The client usually expects the original structure, so we re-wrap if responseDataPath was used to extract.
  // This is a bit simplistic; a better way might be for client to always expect a flat array `items: []`.
  // For now, trying to match existing behavior.
  if (apiConfig.responseDataPath) {
      const rootData = { ...data }; // clone original data
      // set the extracted (and potentially transformed) results back onto the path
      let current = rootData;
      const pathParts = apiConfig.responseDataPath.split('.');
      for(let i=0; i < pathParts.length -1; i++) {
          current = current[pathParts[i]] = current[pathParts[i]] || {};
      }
      current[pathParts[pathParts.length -1]] = results;
      return rootData;
  }

  return results; // If no responseDataPath, return the whole data object
}


// --- Special Proxy Endpoints (Iconfinder SVG, Favicon, Image, Gemini, OBS, StreamerBot, Chutes) ---
// These are kept separate due to their unique logic or streaming nature.

console.log('[Proxy] Attempting to register /api/iconfinder/svg route');
app.get('/api/iconfinder/svg', async (req, res) => {
    const svgUrl = req.query.url;
    if (!svgUrl || typeof svgUrl !== 'string' || !svgUrl.startsWith('https://api.iconfinder.com/')) {
        res.status(400).json({ error: 'Invalid or missing SVG url' });
        return;
    }

    const clientApiKey = req.headers['x-api-key'];
    const serverApiKey = process.env.ICONFINDER_API_KEY; // Primary server-side key
    // VITE_ICONFINDER_API_KEY was a fallback, but client should send override if it has one from VITE_ var.
    const apiKeyToUse = clientApiKey || serverApiKey;

    if (!apiKeyToUse) {
        console.log(`[Proxy Iconfinder SVG] No API key available.`);
        res.status(500).json({ error: 'Iconfinder API key not set in server env (ICONFINDER_API_KEY) and no override provided.' });
        return;
    }

    if (clientApiKey) {
        console.log(`[Proxy Iconfinder SVG] Using client-provided API key.`);
    } else {
        console.log(`[Proxy Iconfinder SVG] Using server default API key.`);
    }

    try {
        const response = await fetch(svgUrl, {
            headers: { Authorization: `Bearer ${apiKeyToUse}` }
        });
        if (!response.ok) {
            const errText = await response.text();
            res.status(response.status).json({ error: 'Iconfinder SVG fetch error', details: errText });
            return;
        }
        res.set({
            'Content-Type': 'image/svg+xml',
            'Access-Control-Allow-Origin': '*',
            'Cross-Origin-Resource-Policy': 'cross-origin',
            'Cross-Origin-Embedder-Policy': 'unsafe-none'
        });
        response.body.pipe(res);
    } catch (err) {
        res.set({
            'Access-Control-Allow-Origin': '*',
            'Cross-Origin-Resource-Policy': 'cross-origin',
            'Cross-Origin-Embedder-Policy': 'unsafe-none'
        });
        res.status(500).json({ error: 'Proxy error', details: err.message });
    }
});


// Unified Favicon Fetch Function
async function fetchAndServeFavicon(req, res) {
    const { domain, sz = 16 } = req.query;
    if (!domain) {
        // Standard headers for error responses
        res.set({
            'Access-Control-Allow-Origin': '*',
            'Cross-Origin-Resource-Policy': 'cross-origin', // Consider if needed for error JSON
            'Cross-Origin-Embedder-Policy': 'unsafe-none',  // Consider if needed for error JSON
        });
        return res.status(400).json({ error: 'Domain parameter is required for favicon proxy' });
    }
    try {
        const googleUrl = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=${sz}`;
        const response = await fetch(googleUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; FaviconProxy/1.0)' },
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Favicon fetch failed: ${response.status} ${response.statusText} - ${errorText.substring(0,100)}`);
        }
        const contentType = response.headers.get('content-type') || 'image/x-icon'; // Default to x-icon if not provided

        // For streaming directly:
        // res.set({
        //     'Access-Control-Allow-Origin': '*',
        //     'Content-Type': contentType,
        //     'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
        //     'Cross-Origin-Resource-Policy': 'cross-origin',
        //     'Cross-Origin-Embedder-Policy': 'unsafe-none',
        // });
        // response.body.pipe(res);

        // For sending as buffer (as in original /api/proxy?api=favicon):
        const buffer = await response.buffer();
        res.set({
            'Access-Control-Allow-Origin': '*',
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=86400',
            'Cross-Origin-Resource-Policy': 'cross-origin',
            'Cross-Origin-Embedder-Policy': 'unsafe-none',
            // 'Access-Control-Allow-Headers': 'Content-Type', // Typically for OPTIONS or if request has custom headers
        });
        res.send(buffer);

    } catch (err) {
        res.set({
            'Access-Control-Allow-Origin': '*',
            // 'Access-Control-Allow-Headers': 'Content-Type', // Less critical for error response
            'Cross-Origin-Resource-Policy': 'cross-origin',
            'Cross-Origin-Embedder-Policy': 'unsafe-none',
        });
        console.error(`Favicon fetch error for domain "${domain}":`, err.message);
        res.status(500).json({ error: 'Failed to fetch favicon', details: err.message });
    }
}

// Original /api/favicon route now uses the unified function
console.log('[Proxy] Attempting to register /api/favicon route');
app.get('/api/favicon', fetchAndServeFavicon);

// --- Unified Path-Based Proxy Endpoint ---
const pathBasedApiRoutes = Object.keys(apiConfigs).map(key => `/api/${key}`);

console.log('[Proxy] Attempting to register path-based API routes:', pathBasedApiRoutes);
app.get('/api/:apiType', async (req, res) => {
    const apiType = req.params.apiType;
    const apiConfig = apiConfigs[apiType];

    if (!apiConfig) {
        return res.status(400).json({ error: `Unknown API endpoint: ${req.path}` });
    }

    // Caching check
    if (apiConfig.cacheable) {
        const cacheKey = req.originalUrl;
        const cachedResponse = getCache(cacheKey);
        if (cachedResponse) {
            console.log(`[Proxy ${apiType}] Serving from cache: ${cacheKey}`);
            res.set('Access-Control-Allow-Origin', '*');
            return res.json(cachedResponse);
        }
    }

    let apiKeyToUse = req.headers['x-api-key'];

    if (!apiKeyToUse && apiConfig.apiKey) {
        apiKeyToUse = req.query[apiConfig.apiKey.queryParam] || null;
        if (!apiKeyToUse && apiConfig.apiKey.envVars) {
            for (const envVar of apiConfig.apiKey.envVars) {
                if (process.env[envVar]) {
                    apiKeyToUse = process.env[envVar];
                    break;
                }
            }
        }
    }

    if (apiConfig.requiresKey && !apiKeyToUse) {
        console.log(`[Proxy ${apiType || 'Generic'}] API key required but none available (checked client override, query params, server env).`);
        return res.status(500).json({ error: `${apiConfig.label || apiType} API key not provided by client or server environment.` });
    }

    if (req.headers['x-api-key']) {
        console.log(`[Proxy ${apiType || 'Generic'}] Using client-provided API key.`);
    } else if (apiKeyToUse) {
        console.log(`[Proxy ${apiType || 'Generic'}] Using server default or query param API key for ${apiConfig.label}.`);
    } else if (apiConfig.requiresKey) {
        console.log(`[Proxy ${apiType || 'Generic'}] No API key available for ${apiConfig.label}, but one is required.`);
    } else {
        console.log(`[Proxy ${apiType || 'Generic'}] No API key needed or provided for ${apiConfig.label}.`);
    }

    try {
        const results = await fetchFromApiHost(apiConfig, req.query, apiKeyToUse);
        if (apiConfig.cacheable) {
            setCache(req.originalUrl, results);
        }
        res.set('Access-Control-Allow-Origin', '*');
        return res.json(results);
    } catch (err) {
        return res.status(500).json({ error: `Proxy error for ${apiType}`, details: err.message });
    }
});


// Allow CORS preflight for all API routes
const allApiRoutesForOptions = [
    // '/api/:apiType', // Handles all from apiConfigs - Temporarily removed for debugging
    '/api/favicon',
    '/api/iconfinder/svg',
    '/api/gemini/generate-content',
    '/api/gemini/generate-image',
    '/api/obs/:action',
    '/api/streamerbot/:action',
    '/api/image',
    '/api/chutes',
    '/api/unsplash/search-photos',
    '/api/unsplash/get-random-photo',
    '/api/unsplash/get-photo/:id',
    '/api/unsplash/track-download',
    '/api/unsplash/list-photos',
    '/api/unsplash/list-collections',
    '/api/unsplash/get-collection-photos/:id',
    '/api/unsplash/list-topics',
    '/api/unsplash/get-topic-photos/:id',
    '/api/unsplash/get-user-photos/:username',
];
app.options(allApiRoutesForOptions, (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.sendStatus(200);
});


console.log('[Proxy] Attempting to register /api/gemini/generate-content route');
app.post('/api/gemini/generate-content', async (req, res) => {
    const clientApiKey = req.headers['x-api-key'];
    const serverApiKey = process.env.GEMINI_API_KEY;
    const apiKeyToUse = clientApiKey || serverApiKey;

    if (!apiKeyToUse) {
        return res.status(500).json({ error: 'Gemini API key not set in server environment (GEMINI_API_KEY) and no override provided.' });
    }

    // Determine model from request body or a default
    const model = req.body.model || 'gemini-pro'; // Assuming model might be in body, else default

    if (clientApiKey) {
        console.log(`[Proxy Gemini Content] Using client-provided API key.`);
    } else if (serverApiKey) {
        console.log(`[Proxy Gemini Content] Using server default API key.`);
    } else {
        console.log(`[Proxy Gemini Content] No API key available.`);
    }
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKeyToUse}`;

    try {
        // The client sends { prompt, history }
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(req.body), // Forwarding { prompt, history }
        });
        const data = await response.json();
        if (data.error) {
            console.error("Gemini API Error (generate-content):", data.error);
            return res.status(400).json({ error: "Gemini API Error", details: data.error.message || JSON.stringify(data.error) });
        }
        res.json(data);
    } catch (err) {
        console.error("Gemini Proxy Fetch Error (generate-content):", err);
        res.status(500).json({ error: 'Failed to fetch from Gemini (generate-content)', details: err.message });
    }
});

console.log('[Proxy] Attempting to register /api/gemini/generate-image route');
app.post('/api/gemini/generate-image', async (req, res) => {
    const clientApiKey = req.headers['x-api-key'];
    const serverApiKey = process.env.GEMINI_API_KEY;
    const apiKeyToUse = clientApiKey || serverApiKey;

    if (!apiKeyToUse) {
        return res.status(500).json({ error: 'Gemini API key not set for image generation and no override provided.' });
    }

    // Input validation for image generation
    const { model, prompt, contents } = req.body;

    if (!prompt && !contents) {
        return res.status(400).json({ error: 'Missing prompt or contents in request body for image generation.' });
    }
    if (prompt && typeof prompt !== 'string') {
        return res.status(400).json({ error: 'Prompt must be a string for image generation.' });
    }
    if (contents && !Array.isArray(contents)) {
        return res.status(400).json({ error: 'Contents must be an array for image generation.' });
    }
    // Further validation could be added for contents array structure if needed

    // Placeholder: Actual image generation API endpoint and request structure for Gemini (or other service)
    // When implementing, ensure `apiKeyToUse` is used for the actual API call.
    if (clientApiKey) {
        console.log(`[Proxy Gemini Image] Using client-provided API key.`);
    } else if (serverApiKey) {
        console.log(`[Proxy Gemini Image] Using server default API key.`);
    } else {
        console.log(`[Proxy Gemini Image] No API key available.`);
    }
    // would need to be determined. This assumes a hypothetical endpoint or a model that handles image prompts.
    // For this example, we'll assume it's a different model or a specific API call.
    // This part would need to be updated with actual Gemini image generation API details.
    const imageModel = model || 'gemini-pro-vision'; // Default model for image input

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
            console.error("Gemini API Error (generate-image):", data.error);
            return res.status(400).json({ error: "Gemini API Error", details: data.error.message || JSON.stringify(data.error) });
        }
        res.json(data);
    } catch (err) {
        console.error("Gemini Proxy Fetch Error (generate-image):", err);
        res.status(500).json({ error: 'Failed to fetch from Gemini (generate-image)', details: err.message });
    }
});

console.log('[Proxy] Attempting to register /api/obs/:action route');
app.all('/api/obs/:action', async (req, res) => {
    const obsUrl = process.env.OBS_HTTP_API_URL;
    if (!obsUrl) {
        return res.status(500).json({ error: 'OBS_HTTP_API_URL not set in environment' });
    }
    try {
        const response = await fetch(`${obsUrl}/${req.params.action}`, { // This should be the OBS HTTP server URL
            method: req.method,
            headers: { 'Content-Type': 'application/json', ...(req.headers.authorization && { 'Authorization': req.headers.authorization }) },
            body: req.method !== 'GET' && req.body ? JSON.stringify(req.body) : undefined,
        });
        const data = await response.json();
        res.status(response.status).json(data);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch from OBS', details: err.message });
    }
});

console.log('[Proxy] Attempting to register /api/streamerbot/:action route');
app.all('/api/streamerbot/:action', async (req, res) => {
    const streamerBotUrl = process.env.STREAMERBOT_API_URL; // e.g. http://localhost:8080/
    if (!streamerBotUrl) {
        return res.status(500).json({ error: 'STREAMERBOT_API_API_URL not set in environment' });
    }
    // Streamer.bot actions are typically POST requests, sending a JSON body.
    // The action is usually part of the body, or the path for specific endpoint actions.
    // Assuming for now it's a generic endpoint that takes action in body or path.
    // Adjust URL construction based on actual Streamer.bot HTTP server setup.
    try {
        const targetUrl = `${streamerBotUrl}${req.params.action}`; // Example: http://localhost:8080/actionName
        console.log(`[Proxy Streamer.bot] Forwarding to ${targetUrl}`);
        const response = await fetch(targetUrl, {
            method: 'POST', // Streamer.bot actions are typically POST
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(req.body), // Forward the entire request body
        });
        const data = await response.json();
        res.status(response.status).json(data);
    } catch (err) {
        console.error("Streamer.bot Proxy Fetch Error:", err);
        res.status(500).json({ error: 'Failed to fetch from Streamer.bot', details: err.message });
    }
});

console.log('[Proxy] Attempting to register /api/image route');
app.get('/api/image', async (req, res) => {
    const { url } = req.query;
    if (!url) {
        return res.status(400).json({ error: 'URL parameter is required for image proxy' });
    }

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Image fetch failed: ${response.status} ${response.statusText}`);
        }

        const contentType = response.headers.get('content-type') || 'image/jpeg';
        const buffer = await response.buffer();

        res.set({
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=3600',
            'Access-Control-Allow-Origin': '*',
            'Cross-Origin-Resource-Policy': 'cross-origin',
            'Cross-Origin-Embedder-Policy': 'unsafe-none'
        });
        res.send(buffer);
    } catch (err) {
        res.set({
            'Access-Control-Allow-Origin': '*',
            'Cross-Origin-Resource-Policy': 'cross-origin',
            'Cross-Origin-Embedder-Policy': 'unsafe-none'
        });
        res.status(500).json({ error: 'Failed to fetch image', details: err.message });
    }
});

console.log('[Proxy] Attempting to register /api/chutes route');
app.post('/api/chutes', async (req, res) => {
    const clientApiKey = req.headers['x-api-key'];
    // For Chutes, the proxy.cjs used to check CHUTES_API_TOKEN then VITE_CHUTES_API_TOKEN.
    // We'll simplify: client key, then proxy's CHUTES_API_TOKEN.
    const serverApiKey = process.env.CHUTES_API_TOKEN;
    const apiKeyToUse = clientApiKey || serverApiKey;

    if (!apiKeyToUse) {
        return res.status(500).json({ error: 'Chute API token not set in server environment (CHUTES_API_TOKEN) and no override provided.' });
    }

    if (clientApiKey) {
        console.log(`[Proxy Chutes] Using client-provided API key.`);
    } else if (serverApiKey) {
        console.log(`[Proxy Chutes] Using server default API key.`);
    } else {
        // This case should be caught by !apiKeyToUse above, but for completeness:
        console.log(`[Proxy Chutes] No API key available.`);
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
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch from Chute API', details: err.message });
    }
});

// Unsplash proxy routes
app.post('/api/unsplash/search-photos', async (req, res) => {
    const { query, options } = req.body;
    const unsplashConfig = apiConfigs.unsplash;
    const apiKeyToUse = process.env.UNSPLASH_API_KEY; // Only use server-side key

    if (!apiKeyToUse) {
        return res.status(500).json({ error: 'Unsplash API key not set in server environment (UNSPLASH_API_KEY).' });
    }

    try {
        const params = new URLSearchParams();
        if (options) {
            if (options.page) params.append('page', options.page);
            if (options.perPage) params.append('per_page', options.perPage);
            if (options.orientation) params.append('orientation', options.orientation);
            if (options.orderBy) params.append('order_by', options.orderBy);
        }

        const url = `${unsplashConfig.baseUrl}search/photos?${params.toString()}`;
        const response = await fetch(url, {
            headers: {
                'Authorization': `${unsplashConfig.apiKey.prefix}${apiKeyToUse}`,
                'Accept-Version': 'v1',
            }
        });

        const data = await response.json();
        res.status(response.status).json(data);
    } catch (err) {
        console.error("Unsplash Proxy Error (search-photos):", err);
        res.status(500).json({ error: 'Failed to fetch from Unsplash (search-photos)', details: err.message });
    }
});

app.post('/api/unsplash/get-random-photo', async (req, res) => {
    const { options } = req.body;
    const unsplashConfig = apiConfigs.unsplash;
    const apiKeyToUse = process.env.UNSPLASH_API_KEY;

    if (!apiKeyToUse) {
        return res.status(500).json({ error: 'Unsplash API key not set in server environment (UNSPLASH_API_KEY).' });
    }

    try {
        const params = new URLSearchParams();
        if (options) {
            if (options.query) params.append('query', options.query);
            if (options.count) params.append('count', options.count);
            if (options.orientation) params.append('orientation', options.orientation);
            if (options.featured) params.append('featured', options.featured);
            if (options.username) params.append('username', options.username);
            if (options.collectionIds) params.append('collection', options.collectionIds.join(','));
            if (options.topicIds) params.append('topics', options.topicIds.join(','));
        }
        const url = `${unsplashConfig.baseUrl}photos/random?${params.toString()}`;
        const response = await fetch(url, {
            headers: {
                'Authorization': `${unsplashConfig.apiKey.prefix}${apiKeyToUse}`,
                'Accept-Version': 'v1',
            }
        });
        const data = await response.json();
        res.status(response.status).json({ photos: data }); // Unsplash returns an array directly for random photos
    } catch (err) {
        console.error("Unsplash Proxy Error (get-random-photo):", err);
        res.status(500).json({ error: 'Failed to fetch from Unsplash (get-random-photo)', details: err.message });
    }
});

app.get('/api/unsplash/get-photo/:id', async (req, res) => {
    const { id } = req.params;
    const unsplashConfig = apiConfigs.unsplash;
    const apiKeyToUse = process.env.UNSPLASH_API_KEY;

    if (!apiKeyToUse) {
        return res.status(500).json({ error: 'Unsplash API key not set in server environment (UNSPLASH_API_KEY).' });
    }

    try {
        const url = `${unsplashConfig.baseUrl}photos/${id}`;
        const response = await fetch(url, {
            headers: {
                'Authorization': `${unsplashConfig.apiKey.prefix}${apiKeyToUse}`,
                'Accept-Version': 'v1',
            }
        });
        const data = await response.json();
        res.status(response.status).json(data);
    } catch (err) {
        console.error("Unsplash Proxy Error (get-photo):", err);
        res.status(500).json({ error: 'Failed to fetch from Unsplash (get-photo)', details: err.message });
    }
});

app.post('/api/unsplash/track-download', async (req, res) => {
    const { downloadLocation } = req.body;
    const unsplashConfig = apiConfigs.unsplash;
    const apiKeyToUse = process.env.UNSPLASH_API_KEY;

    if (!apiKeyToUse) {
        return res.status(500).json({ error: 'Unsplash API key not set in server environment (UNSPLASH_API_KEY).' });
    }

    try {
        const response = await fetch(downloadLocation, {
            method: 'GET', // Unsplash track download is a GET request to the downloadLocation URL
            headers: {
                'Authorization': `${unsplashConfig.apiKey.prefix}${apiKeyToUse}`,
                'Accept-Version': 'v1',
            }
        });
        // We don't need to return the response body, just confirm success
        res.status(response.status).send();
    } catch (err) {
        console.error("Unsplash Proxy Error (track-download):", err);
        res.status(500).json({ error: 'Failed to track download from Unsplash', details: err.message });
    }
});

app.post('/api/unsplash/list-photos', async (req, res) => {
    const { options } = req.body;
    const unsplashConfig = apiConfigs.unsplash;
    const apiKeyToUse = process.env.UNSPLASH_API_KEY;

    if (!apiKeyToUse) {
        return res.status(500).json({ error: 'Unsplash API key not set in server environment (UNSPLASH_API_KEY).' });
    }

    try {
        const params = new URLSearchParams();
        if (options) {
            if (options.page) params.append('page', options.page);
            if (options.perPage) params.append('per_page', options.perPage);
            if (options.orderBy) params.append('order_by', options.orderBy);
        }
        const url = `${unsplashConfig.baseUrl}photos?${params.toString()}`; // Trending photos use the /photos endpoint
        const response = await fetch(url, {
            headers: {
                'Authorization': `${unsplashConfig.apiKey.prefix}${apiKeyToUse}`,
                'Accept-Version': 'v1',
            }
        });
        const data = await response.json();
        res.status(response.status).json({ results: data }); // Unsplash returns an array directly for list photos
    } catch (err) {
        console.error("Unsplash Proxy Error (list-photos):", err);
        res.status(500).json({ error: 'Failed to fetch from Unsplash (list-photos)', details: err.message });
    }
});

app.post('/api/unsplash/list-collections', async (req, res) => {
    const { options } = req.body;
    const unsplashConfig = apiConfigs.unsplash;
    const apiKeyToUse = process.env.UNSPLASH_API_KEY;

    if (!apiKeyToUse) {
        return res.status(500).json({ error: 'Unsplash API key not set in server environment (UNSPLASH_API_KEY).' });
    }

    try {
        const params = new URLSearchParams();
        if (options) {
            if (options.page) params.append('page', options.page);
            if (options.perPage) params.append('per_page', options.perPage);
        }
        const url = `${unsplashConfig.baseUrl}collections?${params.toString()}`;
        const response = await fetch(url, {
            headers: {
                'Authorization': `${unsplashConfig.apiKey.prefix}${apiKeyToUse}`,
                'Accept-Version': 'v1',
            }
        });
        const data = await response.json();
        res.status(response.status).json({ results: data });
    } catch (err) {
        console.error("Unsplash Proxy Error (list-collections):", err);
        res.status(500).json({ error: 'Failed to fetch from Unsplash (list-collections)', details: err.message });
    }
});

app.post('/api/unsplash/get-collection-photos/:id', async (req, res) => {
    const { id } = req.params;
    const { options } = req.body;
    const unsplashConfig = apiConfigs.unsplash;
    const apiKeyToUse = process.env.UNSPLASH_API_KEY;

    if (!apiKeyToUse) {
        return res.status(500).json({ error: 'Unsplash API key not set in server environment (UNSPLASH_API_KEY).' });
    }

    try {
        const params = new URLSearchParams();
        if (options) {
            if (options.page) params.append('page', options.page);
            if (options.perPage) params.append('per_page', options.perPage);
            if (options.orientation) params.append('orientation', options.orientation);
        }
        const url = `${unsplashConfig.baseUrl}collections/${id}/photos?${params.toString()}`;
        const response = await fetch(url, {
            headers: {
                'Authorization': `${unsplashConfig.apiKey.prefix}${apiKeyToUse}`,
                'Accept-Version': 'v1',
            }
        });
        const data = await response.json();
        res.status(response.status).json({ results: data });
    } catch (err) {
        console.error("Unsplash Proxy Error (get-collection-photos):", err);
        res.status(500).json({ error: 'Failed to fetch from Unsplash (get-collection-photos)', details: err.message });
    }
});

app.post('/api/unsplash/list-topics', async (req, res) => {
    const { options } = req.body;
    const unsplashConfig = apiConfigs.unsplash;
    const apiKeyToUse = process.env.UNSPLASH_API_KEY;

    if (!apiKeyToUse) {
        return res.status(500).json({ error: 'Unsplash API key not set in server environment (UNSPLASH_API_KEY).' });
    }

    try {
        const params = new URLSearchParams();
        if (options) {
            if (options.page) params.append('page', options.page);
            if (options.perPage) params.append('per_page', options.perPage);
            if (options.orderBy) params.append('order_by', options.orderBy);
        }
        const url = `${unsplashConfig.baseUrl}topics?${params.toString()}`;
        const response = await fetch(url, {
            headers: {
                'Authorization': `${unsplashConfig.apiKey.prefix}${apiKeyToUse}`,
                'Accept-Version': 'v1',
            }
        });
        const data = await response.json();
        res.status(response.status).json({ results: data });
    } catch (err) {
        console.error("Unsplash Proxy Error (list-topics):", err);
        res.status(500).json({ error: 'Failed to fetch from Unsplash (list-topics)', details: err.message });
    }
});

app.post('/api/unsplash/get-topic-photos/:id', async (req, res) => {
    const { id } = req.params;
    const { options } = req.body;
    const unsplashConfig = apiConfigs.unsplash;
    const apiKeyToUse = process.env.UNSPLASH_API_KEY;

    if (!apiKeyToUse) {
        return res.status(500).json({ error: 'Unsplash API key not set in server environment (UNSPLASH_API_KEY).' });
    }

    try {
        const params = new URLSearchParams();
        if (options) {
            if (options.page) params.append('page', options.page);
            if (options.perPage) params.append('per_page', options.perPage);
            if (options.orientation) params.append('orientation', options.orientation);
        }
        const url = `${unsplashConfig.baseUrl}topics/${id}/photos?${params.toString()}`;
        const response = await fetch(url, {
            headers: {
                'Authorization': `${unsplashConfig.apiKey.prefix}${apiKeyToUse}`,
                'Accept-Version': 'v1',
            }
        });
        const data = await response.json();
        res.status(response.status).json({ results: data });
    } catch (err) {
        console.error("Unsplash Proxy Error (get-topic-photos):", err);
        res.status(500).json({ error: 'Failed to fetch from Unsplash (get-topic-photos)', details: err.message });
    }
});

app.post('/api/unsplash/get-user-photos/:username', async (req, res) => {
    const { username } = req.params;
    const { options } = req.body;
    const unsplashConfig = apiConfigs.unsplash;
    const apiKeyToUse = process.env.UNSPLASH_API_KEY;

    if (!apiKeyToUse) {
        return res.status(500).json({ error: 'Unsplash API key not set in server environment (UNSPLASH_API_KEY).' });
    }

    try {
        const params = new URLSearchParams();
        if (options) {
            if (options.page) params.append('page', options.page);
            if (options.perPage) params.append('per_page', options.perPage);
            if (options.orderBy) params.append('order_by', options.orderBy);
            if (options.orientation) params.append('orientation', options.orientation);
        }
        const url = `${unsplashConfig.baseUrl}users/${username}/photos?${params.toString()}`;
        const response = await fetch(url, {
            headers: {
                'Authorization': `${unsplashConfig.apiKey.prefix}${apiKeyToUse}`,
                'Accept-Version': 'v1',
            }
        });
        const data = await response.json();
        res.status(response.status).json({ results: data });
    } catch (err) {
        console.error("Unsplash Proxy Error (get-user-photos):", err);
        res.status(500).json({ error: 'Failed to fetch from Unsplash (get-user-photos)', details: err.message });
    }
});

console.log('[Proxy] Attempting to register /api/* fallback route');
app.all('/api/*', (req, res) => {
    res.status(404).json({ error: 'API endpoint not found.' });
});


const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Proxy server running on port ${PORT}`));

export default app;
