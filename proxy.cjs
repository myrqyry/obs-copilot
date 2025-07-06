require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// Proxy endpoint to fetch and stream SVGs from Iconfinder (avoids CORS/auth issues)
app.get('/api/iconfinder/svg', async (req, res) => {
    const svgUrl = req.query.url;
    if (!svgUrl || typeof svgUrl !== 'string' || !svgUrl.startsWith('https://api.iconfinder.com/')) {
        res.status(400).json({ error: 'Invalid or missing SVG url' });
        return;
    }
    const apiKey = process.env.VITE_ICONFINDER_API_KEY || process.env.ICONFINDER_API_KEY;
    if (!apiKey) {
        res.status(500).json({ error: 'Iconfinder API key not set in server env' });
        return;
    }
    try {
        const response = await fetch(svgUrl, {
            headers: { Authorization: `Bearer ${apiKey}` }
        });
        if (!response.ok) {
            const errText = await response.text();
            res.status(response.status).json({ error: 'Iconfinder SVG fetch error', details: errText });
            return;
        }
        res.set('Content-Type', 'image/svg+xml');
        response.body.pipe(res);
    } catch (err) {
        res.status(500).json({ error: 'Proxy error', details: err.message });
    }
});

// Proxy endpoint to fetch favicons from Google and serve with CORS headers
app.get('/api/favicon', async (req, res) => {
    const { domain, sz = 16 } = req.query;
    if (!domain) return res.status(400).send('Missing domain');
    const url = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=${sz}`;
    try {
        const response = await fetch(url);
        if (!response.ok) {
            res.status(response.status).send('Failed to fetch favicon');
            return;
        }
        res.set('Access-Control-Allow-Origin', '*');
        res.set('Content-Type', response.headers.get('content-type') || 'image/png');
        response.body.pipe(res);
    } catch (e) {
        res.status(500).send('Failed to fetch favicon');
    }
});

// Enhanced favicon proxy with COEP headers
app.get('/api/proxy', async (req, res) => {
    const { api, domain, sz = 16 } = req.query;

    if (api === 'favicon') {
        if (!domain) {
            return res.status(400).json({
                error: 'Domain parameter is required for favicon proxy',
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type',
                    'Cross-Origin-Resource-Policy': 'cross-origin',
                    'Cross-Origin-Embedder-Policy': 'unsafe-none',
                }
            });
        }

        try {
            // Try Google's favicon service
            const googleUrl = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=${sz}`;
            const response = await fetch(googleUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; FaviconProxy/1.0)',
                },
            });

            if (!response.ok) {
                throw new Error(`Favicon fetch failed: ${response.status} ${response.statusText}`);
            }

            const contentType = response.headers.get('content-type') || 'image/x-icon';
            const buffer = await response.buffer();

            res.set({
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
                'Cross-Origin-Resource-Policy': 'cross-origin',
                'Cross-Origin-Embedder-Policy': 'unsafe-none',
            });

            res.send(buffer);
        } catch (err) {
            res.set({
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Cross-Origin-Resource-Policy': 'cross-origin',
                'Cross-Origin-Embedder-Policy': 'unsafe-none',
            });
            res.status(500).json({ error: 'Failed to fetch favicon', details: err.message });
        }
        return;
    }

    // Handle other API types here if needed
    res.status(400).json({ error: 'Unknown API type' });
});

// Allow CORS preflight for all API routes
app.options(['/api/wallhaven', '/api/proxy', '/api/favicon', '/api/pexels', '/api/pixabay', '/api/deviantart', '/api/artstation'], (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.sendStatus(200);
});

// Unified proxy endpoint for multiple APIs (future-proof)
app.get(['/api/wallhaven', '/api/pexels', '/api/pixabay', '/api/deviantart', '/api/imgflip', '/api/imgur', '/api/artstation', '/api/proxy'], async (req, res) => {
    // Support multiple APIs via ?api=wallhaven or path
    const api = req.query.api || (req.path.includes('wallhaven') ? 'wallhaven' :
        req.path.includes('pexels') ? 'pexels' :
            req.path.includes('pixabay') ? 'pixabay' :
                req.path.includes('deviantart') ? 'deviantart' :
                    req.path.includes('imgflip') ? 'imgflip' :
                        req.path.includes('imgur') ? 'imgur' :
                            req.path.includes('artstation') ? 'artstation' :
                                req.query.api);

    if (api === 'wallhaven') {
        const { q, categories, purity, sorting, order, page } = req.query;
        const params = new URLSearchParams();
        if (q) params.append('q', q);
        if (categories) params.append('categories', categories);
        if (purity) params.append('purity', purity);
        if (sorting) params.append('sorting', sorting);
        if (order) params.append('order', order);
        if (page) params.append('page', page);
        // You can add your Wallhaven API key here if needed
        // params.append('apikey', 'YOUR_API_KEY');
        const url = `https://wallhaven.cc/api/v1/search?${params.toString()}`;
        try {
            const response = await fetch(url);
            const data = await response.json();
            res.set('Access-Control-Allow-Origin', '*');
            res.json(data);
        } catch (err) {
            res.status(500).json({ error: 'Proxy error', details: err.message });
        }
        return;
    }

    if (api === 'pexels') {
        const { query, per_page, orientation, key } = req.query;
        const pexelsKey = key || process.env.VITE_PEXELS_API_KEY || process.env.PEXELS_API_KEY;
        if (!pexelsKey) {
            res.set('Access-Control-Allow-Origin', '*');
            res.status(500).json({ error: 'Pexels API key not provided. Add ?key=YOUR_API_KEY to the URL or set VITE_PEXELS_API_KEY in environment.' });
            return;
        }
        const params = new URLSearchParams();
        if (query) params.append('query', query);
        if (per_page) params.append('per_page', per_page);
        if (orientation) params.append('orientation', orientation);
        const url = `https://api.pexels.com/v1/search?${params.toString()}`;
        try {
            const response = await fetch(url, {
                headers: { 'Authorization': pexelsKey }
            });
            const data = await response.json();
            res.set('Access-Control-Allow-Origin', '*');
            res.json(data);
        } catch (err) {
            res.status(500).json({ error: 'Proxy error', details: err.message });
        }
        return;
    }

    if (api === 'pixabay') {
        const { key, q, image_type, orientation, per_page } = req.query;
        const pixabayKey = key || process.env.VITE_PIXABAY_API_KEY || process.env.PIXABAY_API_KEY;
        if (!pixabayKey) {
            res.set('Access-Control-Allow-Origin', '*');
            res.status(500).json({ error: 'Pixabay API key not provided. Add ?key=YOUR_API_KEY to the URL or set VITE_PIXABAY_API_KEY in environment.' });
            return;
        }
        const params = new URLSearchParams();
        params.append('key', pixabayKey);
        if (q) params.append('q', q);
        if (image_type) params.append('image_type', image_type);
        if (orientation) params.append('orientation', orientation);
        if (per_page) params.append('per_page', per_page);
        const url = `https://pixabay.com/api/?${params.toString()}`;
        try {
            const response = await fetch(url);
            const data = await response.json();
            res.set('Access-Control-Allow-Origin', '*');
            res.json(data);
        } catch (err) {
            res.status(500).json({ error: 'Proxy error', details: err.message });
        }
        return;
    }

    if (api === 'deviantart') {
        const { q, limit, mature_content, key } = req.query;
        const deviantartKey = key || process.env.VITE_DEVIANTART_API_KEY || process.env.DEVIANTART_API_KEY;
        if (!deviantartKey) {
            res.set('Access-Control-Allow-Origin', '*');
            res.status(500).json({ error: 'DeviantArt API key not provided. Add ?key=YOUR_API_KEY to the URL or set VITE_DEVIANTART_API_KEY in environment.' });
            return;
        }
        const params = new URLSearchParams();
        params.append('access_token', deviantartKey);
        if (q) params.append('q', q);
        if (limit) params.append('limit', limit);
        if (mature_content) params.append('mature_content', mature_content);
        const url = `https://www.deviantart.com/api/v1/oauth2/browse/search?${params.toString()}`;
        try {
            const response = await fetch(url);
            const data = await response.json();
            res.set('Access-Control-Allow-Origin', '*');
            res.json(data);
        } catch (err) {
            res.status(500).json({ error: 'Proxy error', details: err.message });
        }
        return;
    }

    if (api === 'imgflip') {
        // Imgflip API for GIFs
        const { q, limit, page } = req.query;
        const imgflipKey = process.env.VITE_IMGFLIP_API_KEY || process.env.IMGFLIP_API_KEY;
        const params = new URLSearchParams();
        if (q) params.append('q', q);
        if (limit) params.append('limit', limit);
        if (page) params.append('page', page);
        if (imgflipKey) params.append('api_key', imgflipKey);
        const url = `https://api.imgflip.com/search?${params.toString()}`;
        try {
            const response = await fetch(url);
            const data = await response.json();
            res.set('Access-Control-Allow-Origin', '*');
            res.json(data);
        } catch (err) {
            res.status(500).json({ error: 'Proxy error', details: err.message });
        }
        return;
    }

    if (api === 'imgur') {
        // Imgur API implementation
        const { q, limit, page } = req.query;
        const imgurKey = process.env.VITE_IMGUR_API_KEY || process.env.IMGUR_API_KEY;
        const params = new URLSearchParams();
        if (q) params.append('q', q);
        if (limit) params.append('limit', limit);
        if (page) params.append('page', page);
        if (imgurKey) params.append('client_id', imgurKey);
        const url = `https://api.imgur.com/3/gallery/search?${params.toString()}`;
        try {
            const response = await fetch(url);
            const data = await response.json();
            res.set('Access-Control-Allow-Origin', '*');
            res.json(data);
        } catch (err) {
            res.status(500).json({ error: 'Proxy error', details: err.message });
        }
        return;
    }

    if (api === 'artstation') {
        // ArtStation API - no API key required
        const { q, page, per_page } = req.query;
        const params = new URLSearchParams();
        if (q) params.append('q', q);
        if (page) params.append('page', page);
        if (per_page) params.append('per_page', per_page);
        const url = `https://www.artstation.com/search/projects.json?${params.toString()}`;
        try {
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'OBS-Copilot/1.0'
                }
            });

            if (!response.ok) {
                throw new Error(`ArtStation API returned ${response.status}: ${response.statusText}`);
            }

            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                // ArtStation API has changed or requires authentication
                res.set('Access-Control-Allow-Origin', '*');
                res.json({
                    error: 'ArtStation API is not available',
                    message: 'The ArtStation API has changed and is no longer publicly accessible. Please use a different background service like Wallhaven or Unsplash.',
                    data: []
                });
                return;
            }

            const data = await response.json();
            res.set('Access-Control-Allow-Origin', '*');
            res.json(data);
        } catch (err) {
            res.status(500).json({
                error: 'ArtStation API error',
                details: err.message,
                message: 'ArtStation API is not available. Please use a different background service.',
                data: []
            });
        }
        return;
    }

    if (api === 'iconfinder') {
        // Proxy for Iconfinder API (free SVG icons only)
        const { query, count, premium, vector } = req.query;
        const params = new URLSearchParams();
        if (query) params.append('query', query);
        params.append('count', count || '48');
        params.append('premium', premium || '0');
        params.append('vector', vector || '1');
        // No license param: return all free icons
        const url = `https://api.iconfinder.com/v4/icons/search?${params.toString()}`;
        // DEBUG: Log which env var is being used and the first 6 chars of the key (never log full secrets in production!)
        const apiKey = process.env.VITE_ICONFINDER_API_KEY || process.env.ICONFINDER_API_KEY;
        const apiKeySource = process.env.VITE_ICONFINDER_API_KEY ? 'VITE_ICONFINDER_API_KEY' : (process.env.ICONFINDER_API_KEY ? 'ICONFINDER_API_KEY' : 'none');
        console.log(`[DEBUG] Iconfinder API key source: ${apiKeySource}, value starts with: ${apiKey ? apiKey.slice(0, 6) : 'undefined'}`);
        if (!apiKey) {
            res.set('Access-Control-Allow-Origin', '*');
            res.status(500).json({ error: 'Iconfinder API key not set in server env' });
            return;
        }
        try {
            const headers = { Authorization: `Bearer ${apiKey}` };
            console.log(`[DEBUG] Outgoing Iconfinder request: ${url}`);
            console.log('[DEBUG] Outgoing headers:', headers);
            const response = await fetch(url, { headers });
            if (!response.ok) {
                const errText = await response.text();
                res.set('Access-Control-Allow-Origin', '*');
                res.status(response.status).json({ error: 'Iconfinder API error', details: errText });
                return;
            }
            const data = await response.json();
            console.log('[DEBUG] Iconfinder API response:', JSON.stringify(data, null, 2));
            res.set('Access-Control-Allow-Origin', '*');
            res.json(data);
        } catch (err) {
            res.set('Access-Control-Allow-Origin', '*');
            res.status(500).json({ error: 'Proxy error', details: err.message });
        }
        return;
    }

    // Add more APIs here as needed
    res.status(400).json({ error: 'Unknown API' });
});

// Proxy Gemini API
app.post('/api/gemini', async (req, res) => {
    const url = 'https://generativelanguage.googleapis.com/v1beta/models/' +
        req.query.model +
        ':generateContent?key=' + process.env.GEMINI_API_KEY;
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(req.body),
        });
        const data = await response.json();
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch from Gemini', details: err.message });
    }
});

// Proxy OBS WebSocket API (example: for HTTP endpoints, not WebSocket)
app.all('/api/obs/:action', async (req, res) => {
    const obsUrl = process.env.OBS_HTTP_API_URL;
    if (!obsUrl) {
        return res.status(500).json({ error: 'OBS_HTTP_API_URL not set in environment' });
    }
    try {
        const response = await fetch(obsUrl, {
            method: req.method,
            headers: { 'Content-Type': 'application/json' },
            body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined,
        });
        const data = await response.json();
        res.json(data);
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
            method: req.method,
            headers: { 'Content-Type': 'application/json' },
            body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined,
        });
        const data = await response.json();
        res.json(data);
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
            'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        });

        res.send(buffer);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch image', details: err.message });
    }
});

app.post('/api/chutes', async (req, res) => {
    const apiToken = process.env.VITE_CHUTES_API_TOKEN || process.env.CHUTES_API_TOKEN;
    if (!apiToken) {
        return res.status(500).json({ error: 'Chute API token not set in environment.' });
    }
    try {
        const response = await fetch('https://chutes-flux-1-dev.chutes.ai/generate', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiToken}`,
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

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Proxy server running on port ${PORT}`));
