require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch');
const app = express();

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

// Allow CORS preflight for all API routes
app.options(['/api/wallhaven', '/api/proxy'], (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.sendStatus(200);
});


// Unified proxy endpoint for multiple APIs (future-proof)
app.get(['/api/wallhaven', '/api/proxy'], async (req, res) => {
    // Support multiple APIs via ?api=wallhaven or path
    const api = req.query.api || (req.path.includes('wallhaven') ? 'wallhaven' : req.query.api);

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

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Proxy server running on port ${PORT}`));
