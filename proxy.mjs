import 'dotenv/config';
import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';
const app = express();

app.use(cors());
app.use(express.json());

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
    // transformResult: (item) => item,
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
    // This case is fine if the API returns a single object instead of an array (e.g. getPhoto)
    // For search APIs, we typically expect an array.
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

app.get('/api/favicon', async (req, res) => {
    // This specific logic for Google Favicons is kept as is
    const { domain, sz = 16 } = req.query;
    if (!domain) {
        res.set({
            'Access-Control-Allow-Origin': '*',
            'Cross-Origin-Resource-Policy': 'cross-origin',
            'Cross-Origin-Embedder-Policy': 'unsafe-none'
        });
        return res.status(400).json({ error: 'Missing domain parameter' });
    }
    const url = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=${sz}`;
    try {
        const response = await fetch(url);
        if (!response.ok) {
            const errorText = await response.text();
            res.set({
                'Access-Control-Allow-Origin': '*',
                'Cross-Origin-Resource-Policy': 'cross-origin',
                'Cross-Origin-Embedder-Policy': 'unsafe-none'
            });
            res.status(response.status).json({ error: 'Failed to fetch favicon', details: errorText });
            return;
        }
        res.set({
            'Access-Control-Allow-Origin': '*',
            'Content-Type': response.headers.get('content-type') || 'image/png',
            'Cross-Origin-Resource-Policy': 'cross-origin',
            'Cross-Origin-Embedder-Policy': 'unsafe-none'
        });
        response.body.pipe(res);
    } catch (e) {
        res.set({
            'Access-Control-Allow-Origin': '*',
            'Cross-Origin-Resource-Policy': 'cross-origin',
            'Cross-Origin-Embedder-Policy': 'unsafe-none'
        });
        res.status(500).json({ error: 'Failed to fetch favicon', details: e.message });
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
app.get('/api/favicon', fetchAndServeFavicon);

// --- Unified Path-Based Proxy Endpoint ---
const pathBasedApiRoutes = Object.keys(apiConfigs).map(key => `/api/${key}`);

app.get(pathBasedApiRoutes, async (req, res) => {
    const pathSegments = req.path.split('/'); // e.g., ['', 'api', 'wallhaven']
    const apiType = pathSegments.length > 2 ? pathSegments[2] : null;

    const apiConfig = apiConfigs[apiType];
    if (!apiConfig) {
      // This case should ideally not be hit if routes are specific enough
      // or a final catch-all 404 is desired from Express.
      // However, if it does, it means an /api/something route was matched but not in apiConfigs.
      return res.status(400).json({ error: `Unknown API endpoint: ${req.path}` });
    }

    // Prioritize X-Api-Key header from client for overrides
    let apiKeyToUse = req.headers['x-api-key'];

    if (!apiKeyToUse) {
        // If no client override, try query parameter (some APIs might use this, though header is preferred)
        apiKeyToUse = req.query[apiConfig.apiKey?.queryParam] || null;
        if (!apiKeyToUse && apiConfig.apiKey?.envVars) { // Then check server environment variables
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
        console.log(`[Proxy ${apiType || 'Generic'}] Using client-provided API key for ${apiConfig.label}.`);
    } else if (apiKeyToUse) { // Indicates it came from query or server env
        console.log(`[Proxy ${apiType || 'Generic'}] Using server default or query param API key for ${apiConfig.label}.`);
    } else if (apiConfig.requiresKey) {
        // This case should ideally be caught by the check above
        console.log(`[Proxy ${apiType || 'Generic'}] No API key available for ${apiConfig.label}, but one is required.`);
    } else {
        console.log(`[Proxy ${apiType || 'Generic'}] No API key needed or provided for ${apiConfig.label}.`);
    }

    try {
        // Pass the determined apiKeyToUse to fetchFromApiHost
        const results = await fetchFromApiHost(apiConfig, req.query, apiKeyToUse);
        res.set('Access-Control-Allow-Origin', '*');
        return res.json(results); // fetchFromApiHost returns the full data structure as API provides it
    } catch (err) {
        return res.status(500).json({ error: `Proxy error for ${apiType}`, details: err.message });
    }
});


// Allow CORS preflight for all API routes
const allApiRoutesForOptions = [
    ...pathBasedApiRoutes, // Includes all from apiConfigs
    // '/api/proxy', // Removed as it's deprecated by path-based routes
    '/api/favicon',
    '/api/iconfinder/svg',
    '/api/gemini/generate-content',
    '/api/gemini/generate-image',
    '/api/obs/:action',
    '/api/streamerbot/:action',
    '/api/image',
    '/api/chutes'
];
app.options(allApiRoutesForOptions, (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.sendStatus(200);
});


// Proxy Gemini API
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

app.post('/api/gemini/generate-image', async (req, res) => {
    const clientApiKey = req.headers['x-api-key'];
    const serverApiKey = process.env.GEMINI_API_KEY;
    const apiKeyToUse = clientApiKey || serverApiKey;

    if (!apiKeyToUse) {
        return res.status(500).json({ error: 'Gemini API key not set for image generation and no override provided.' });
    }

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
    const imageModel = req.body.model || 'gemini-pro-vision'; // Example, might be different
    // const imageUrl = `https://generativelanguage.googleapis.com/v1beta/models/${imageModel}:generateImage?key=${geminiApiKey}`;
    console.log(`[Proxy /api/gemini/generate-image] Called with body:`, req.body);
    // Since the actual Google Gemini API for direct image generation from text like this is typically part of multimodal models
    // or might have a different request structure, we'll return a placeholder or error for now.
    // If using a specific image generation model via Vertex AI or other Google Cloud services, the URL and body would change.

    // For now, let's simulate an error or a not implemented response,
    // as the original proxy didn't have image generation logic.
    // If you have a specific image generation endpoint for Gemini, replace this.
    console.warn("/api/gemini/generate-image is a placeholder and not fully implemented for actual image generation with Gemini API in this proxy version.");
    res.status(501).json({
        error: 'Not Implemented',
        message: 'Gemini image generation endpoint is not fully configured in the proxy.',
        details: 'The proxy needs to be updated with the correct Google API for image generation if available directly or via a specific model.'
    });
    // Example of how it might look if there was a direct API (this is hypothetical):
    /*
    try {
        const response = await fetch(imageUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: req.body.prompt }), // Assuming body has a prompt for image
        });
        const data = await response.json();
        if (data.error) {
            console.error("Gemini API Error (generate-image):", data.error);
            return res.status(400).json({ error: "Gemini API Error", details: data.error.message || JSON.stringify(data.error) });
        }
        res.json(data); // data should contain imageUrl
    } catch (err) {
        console.error("Gemini Proxy Fetch Error (generate-image):", err);
        res.status(500).json({ error: 'Failed to fetch from Gemini (generate-image)', details: err.message });
    }
    */
});

// Proxy OBS WebSocket API (example: for HTTP endpoints, not WebSocket)
app.all('/api/obs/:action', async (req, res) => {
    const obsUrl = process.env.OBS_HTTP_API_URL;
    if (!obsUrl) {
        return res.status(500).json({ error: 'OBS_HTTP_API_URL not set in environment' });
    }
    try {
        const response = await fetch(obsUrl, { // This should be the OBS HTTP server URL
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

// Proxy Streamer.bot API
app.all('/api/streamerbot/:action', async (req, res) => {
    const streamerBotUrl = process.env.STREAMERBOT_API_URL; // e.g. http://localhost:8080/
    if (!streamerBotUrl) {
        return res.status(500).json({ error: 'STREAMERBOT_API_URL not set in environment' });
    }
    // Construct the full URL to Streamer.bot, assuming actions are POST requests to the base URL
    // This might need adjustment based on how Streamer.bot's HTTP server actually works.
    // Typically, actions are sent as JSON body to a single endpoint if it's a generic action handler.
    // If actions are separate paths, then `${streamerBotUrl}${req.params.action}` might be needed.
    // For now, assuming a single endpoint that takes action in body or query.
    try {
        const response = await fetch(streamerBotUrl, { // This should be the Streamer.bot HTTP server URL
            method: 'POST', // Streamer.bot actions are typically POST
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(req.body), // Send the whole body which should contain the action details
        });
        const data = await response.json();
        res.status(response.status).json(data);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch from Streamer.bot', details: err.message });
    }
});

// Image proxy to handle CORS issues with external images
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

// Fallback for any /api routes not caught by specific handlers or the generic one
app.all('/api/*', (req, res) => {
    res.status(404).json({ error: 'API endpoint not found.' });
});


const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Proxy server running on port ${PORT}`));

export default app;
