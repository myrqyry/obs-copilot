require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
const { apiConfigs } = require('./api-config.js');
const { fetchFromApiHost, fetchAndServeFavicon } = require('./proxy-helpers.js');

const app = express();

app.use(cors());
app.use(express.json());

// --- Special Proxy Endpoints (Iconfinder SVG, Favicon, Image, Gemini, OBS, StreamerBot, Chutes) ---

app.get('/api/iconfinder/svg', async (req, res) => {
    const svgUrl = req.query.url;
    if (!svgUrl || typeof svgUrl !== 'string' || !svgUrl.startsWith('https://api.iconfinder.com/')) {
        return res.status(400).json({ error: 'Invalid or missing SVG url' });
    }

    const clientApiKey = req.headers['x-api-key'];
    const serverApiKey = process.env.ICONFINDER_API_KEY;
    const apiKeyToUse = clientApiKey || serverApiKey;

    if (!apiKeyToUse) {
        console.log(`[Proxy Iconfinder SVG] No API key available.`);
        return res.status(500).json({ error: 'Iconfinder API key not set in server env (ICONFINDER_API_KEY) and no override provided.' });
    }

    try {
        const response = await fetch(svgUrl, {
            headers: { Authorization: `Bearer ${apiKeyToUse}` }
        });
        if (!response.ok) {
            const errText = await response.text();
            return res.status(response.status).json({ error: 'Iconfinder SVG fetch error', details: errText });
        }
        res.set({
            'Content-Type': 'image/svg+xml',
            'Access-Control-Allow-Origin': '*',
            'Cross-Origin-Resource-Policy': 'cross-origin',
            'Cross-Origin-Embedder-Policy': 'unsafe-none'
        });
        response.body.pipe(res);
    } catch (err) {
        res.status(500).json({ error: 'Proxy error', details: err.message });
    }
});

app.get('/api/favicon', fetchAndServeFavicon);

// --- Unified Path-Based Proxy Endpoint ---
const pathBasedApiRoutes = Object.keys(apiConfigs).map(key => `/api/${key}`);

app.get(pathBasedApiRoutes, async (req, res) => {
    const pathSegments = req.path.split('/'); // e.g., ['', 'api', 'wallhaven']
    const apiType = pathSegments.length > 2 ? pathSegments[2] : null;

    const apiConfig = apiConfigs[apiType];
    if (!apiConfig) {
      return res.status(400).json({ error: `Unknown API endpoint: ${req.path}` });
    }

    let apiKeyToUse = req.headers['x-api-key'];

    if (!apiKeyToUse) {
        apiKeyToUse = req.query[apiConfig.apiKey?.queryParam] || null;
        if (!apiKeyToUse && apiConfig.apiKey?.envVars) {
            for (const envVar of apiConfig.apiKey.envVars) {
                if (process.env[envVar]) {
                    apiKeyToUse = process.env[envVar];
                    break;
                }
            }
        }
    }

    if (apiConfig.requiresKey && !apiKeyToUse) {
        return res.status(500).json({ error: `${apiConfig.label || apiType} API key not provided by client or server environment.` });
    }

    try {
        const results = await fetchFromApiHost(apiConfig, req.query, apiKeyToUse);
        res.set('Access-Control-Allow-Origin', '*');
        return res.json(results);
    } catch (err) {
        return res.status(500).json({ error: `Proxy error for ${apiType}`, details: err.message });
    }
});


// Allow CORS preflight for all API routes
const allApiRoutesForOptions = [
    ...pathBasedApiRoutes,
    '/api/favicon',
    '/api/iconfinder/svg',
    '/api/gemini/generate-content',
    '/api/gemini/generate-image',
    '/api/obs/:action',
    '/api/streamerbot/:action',
    '/api/image',
    '/api/chutes'
];
app.options(allApiRoutesForOptions, cors());


// Proxy Gemini API
app.post('/api/gemini/generate-content', async (req, res) => {
    const clientApiKey = req.headers['x-api-key'];
    const serverApiKey = process.env.GEMINI_API_KEY;
    const apiKeyToUse = clientApiKey || serverApiKey;

    if (!apiKeyToUse) {
        return res.status(500).json({ error: 'Gemini API key not set in server environment (GEMINI_API_KEY) and no override provided.' });
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
            return res.status(400).json({ error: "Gemini API Error", details: data.error.message || JSON.stringify(data.error) });
        }
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch from Gemini (generate-content)', details: err.message });
    }
});

app.post('/api/gemini/generate-image', async (req, res) => {
    res.status(501).json({
        error: 'Not Implemented',
        message: 'Gemini image generation endpoint is not fully configured in the proxy.',
    });
});

// Proxy OBS WebSocket API
app.all('/api/obs/:action', async (req, res) => {
    const obsUrl = process.env.OBS_HTTP_API_URL;
    if (!obsUrl) {
        return res.status(500).json({ error: 'OBS_HTTP_API_URL not set in environment' });
    }
    try {
        const response = await fetch(obsUrl, {
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
    const streamerBotUrl = process.env.STREAMERBOT_API_URL;
    if (!streamerBotUrl) {
        return res.status(500).json({ error: 'STREAMERBOT_API_URL not set in environment' });
    }
    try {
        const response = await fetch(streamerBotUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(req.body),
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
    const serverApiKey = process.env.CHUTES_API_TOKEN;
    const apiKeyToUse = clientApiKey || serverApiKey;

    if (!apiKeyToUse) {
        return res.status(500).json({ error: 'Chute API token not set in server environment (CHUTES_API_TOKEN) and no override provided.' });
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
if (require.main === module) {
  app.listen(PORT, () => console.log(`Proxy server running on port ${PORT}`));
}

module.exports = app;
