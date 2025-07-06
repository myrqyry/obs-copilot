// netlify/functions/proxy.js
// Netlify Function to proxy API requests (Gemini, OBS, Streamer.bot, Wallhaven, etc.) to avoid CORS issues

const fetch = require('node-fetch');

exports.handler = async function (event, context) {
    const api = event.queryStringParameters.api;

    // Proxy Gemini API
    if (api === 'gemini') {
        const url = 'https://generativelanguage.googleapis.com/v1beta/models/' +
            event.queryStringParameters.model +
            ':generateContent?key=' + process.env.GEMINI_API_KEY;
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: event.body,
            });
            const data = await response.json();
            return {
                statusCode: 200,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            };
        } catch (err) {
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'Failed to fetch from Gemini', details: err.message }),
            };
        }
    }

    // Proxy OBS WebSocket API (example: for HTTP endpoints, not WebSocket)
    if (api === 'obs') {
        const obsUrl = process.env.OBS_HTTP_API_URL;
        if (!obsUrl) {
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'OBS_HTTP_API_URL not set in environment' }),
            };
        }
        try {
            const response = await fetch(obsUrl, {
                method: event.httpMethod,
                headers: { 'Content-Type': 'application/json' },
                body: event.body,
            });
            const data = await response.json();
            return {
                statusCode: 200,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            };
        } catch (err) {
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'Failed to fetch from OBS', details: err.message }),
            };
        }
    }

    // Proxy Streamer.bot API
    if (api === 'streamerbot') {
        const streamerBotUrl = process.env.STREAMERBOT_API_URL;
        if (!streamerBotUrl) {
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'STREAMERBOT_API_URL not set in environment' }),
            };
        }
        try {
            const response = await fetch(streamerBotUrl, {
                method: event.httpMethod,
                headers: { 'Content-Type': 'application/json' },
                body: event.body,
            });
            const data = await response.json();
            return {
                statusCode: 200,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            };
        } catch (err) {
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'Failed to fetch from Streamer.bot', details: err.message }),
            };
        }
    }

    // Wallhaven API (existing)
    if (api === 'wallhaven') {
        const { q, categories, purity, sorting, order, page, apikey } = event.queryStringParameters;
        const params = new URLSearchParams();
        if (q) params.append('q', q);
        if (categories) params.append('categories', categories);
        if (purity) params.append('purity', purity);
        if (sorting) params.append('sorting', sorting);
        if (order) params.append('order', order);
        if (page) params.append('page', page);
        if (apikey) params.append('apikey', apikey);
        const url = `https://wallhaven.cc/api/v1/search?${params.toString()}`;
        try {
            const response = await fetch(url);
            const data = await response.json();
            return {
                statusCode: 200,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            };
        } catch (err) {
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'Failed to fetch from Wallhaven', details: err.message }),
            };
        }
    }

    // Pexels API
    if (api === 'pexels') {
        const { key, query, per_page, orientation } = event.queryStringParameters;
        if (!key) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Pexels API key is required' }),
            };
        }
        const params = new URLSearchParams();
        if (query) params.append('query', query);
        if (per_page) params.append('per_page', per_page);
        if (orientation) params.append('orientation', orientation);
        const url = `https://api.pexels.com/v1/search?${params.toString()}`;
        try {
            const response = await fetch(url, {
                headers: {
                    'Authorization': key,
                    'User-Agent': 'OBS-Copilot/1.0'
                }
            });
            const data = await response.json();
            return {
                statusCode: 200,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            };
        } catch (err) {
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'Failed to fetch from Pexels', details: err.message }),
            };
        }
    }

    // Pixabay API
    if (api === 'pixabay') {
        const { key, q, image_type, orientation, per_page } = event.queryStringParameters;
        if (!key) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Pixabay API key is required' }),
            };
        }
        const params = new URLSearchParams();
        params.append('key', key);
        if (q) params.append('q', q);
        if (image_type) params.append('image_type', image_type);
        if (orientation) params.append('orientation', orientation);
        if (per_page) params.append('per_page', per_page);
        const url = `https://pixabay.com/api/?${params.toString()}`;
        try {
            const response = await fetch(url);
            const data = await response.json();
            return {
                statusCode: 200,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            };
        } catch (err) {
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'Failed to fetch from Pixabay', details: err.message }),
            };
        }
    }

    // ArtStation API
    if (api === 'artstation') {
        const { q, page = 1, per_page = 30 } = event.queryStringParameters;
        const params = new URLSearchParams();
        if (q) params.append('q', q);
        params.append('page', page);
        params.append('per_page', per_page);
        const url = `https://www.artstation.com/search/projects.json?${params.toString()}`;
        try {
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'OBS-Copilot/1.0'
                }
            });
            const data = await response.json();
            return {
                statusCode: 200,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            };
        } catch (err) {
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'Failed to fetch from ArtStation', details: err.message }),
            };
        }
    }

    // DeviantArt API
    if (api === 'deviantart') {
        const { key, q, limit, mature_content } = event.queryStringParameters;
        if (!key) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'DeviantArt API key is required' }),
            };
        }
        const params = new URLSearchParams();
        params.append('access_token', key);
        if (q) params.append('q', q);
        if (limit) params.append('limit', limit);
        if (mature_content) params.append('mature_content', mature_content);
        const url = `https://www.deviantart.com/api/v1/oauth2/browse/search?${params.toString()}`;
        try {
            const response = await fetch(url);
            const data = await response.json();
            return {
                statusCode: 200,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            };
        } catch (err) {
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'Failed to fetch from DeviantArt', details: err.message }),
            };
        }
    }

    // Image proxy to handle CORS issues with external images
    if (api === 'image') {
        const { url } = event.queryStringParameters;
        if (!url) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'URL parameter is required for image proxy' }),
            };
        }

        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Image fetch failed: ${response.status} ${response.statusText}`);
            }

            const contentType = response.headers.get('content-type') || 'image/jpeg';
            const buffer = await response.buffer();

            return {
                statusCode: 200,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type',
                    'Content-Type': contentType,
                    'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
                },
                body: buffer.toString('base64'),
                isBase64Encoded: true,
            };
        } catch (err) {
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'Failed to fetch image', details: err.message }),
            };
        }
    }

    // Favicon proxy to handle CORS issues with Google's favicon service
    if (api === 'favicon') {
        const { domain, sz = 16 } = event.queryStringParameters;
        if (!domain) {
            return {
                statusCode: 400,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type',
                    'Cross-Origin-Resource-Policy': 'cross-origin',
                    'Cross-Origin-Embedder-Policy': 'unsafe-none',
                },
                body: JSON.stringify({ error: 'Domain parameter is required for favicon proxy' }),
            };
        }

        try {
            // Try Google's favicon service first
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

            return {
                statusCode: 200,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type',
                    'Content-Type': contentType,
                    'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
                    'Cross-Origin-Resource-Policy': 'cross-origin',
                    'Cross-Origin-Embedder-Policy': 'unsafe-none',
                },
                body: buffer.toString('base64'),
                isBase64Encoded: true,
            };
        } catch (err) {
            return {
                statusCode: 500,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type',
                    'Cross-Origin-Resource-Policy': 'cross-origin',
                    'Cross-Origin-Embedder-Policy': 'unsafe-none',
                },
                body: JSON.stringify({ error: 'Failed to fetch favicon', details: err.message }),
            };
        }
    }

    // Proxy Chutes API
    if (api === 'chutes') {
        const apiToken = process.env.VITE_CHUTES_API_TOKEN || process.env.CHUTES_API_TOKEN;
        if (!apiToken) {
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'Chutes API token not set in environment.' }),
            };
        }
        try {
            const response = await fetch('https://chutes-flux-1-dev.chutes.ai/generate', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiToken}`,
                    'Content-Type': 'application/json'
                },
                body: event.body
            });
            const data = await response.json();
            return {
                statusCode: response.status,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            };
        } catch (err) {
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'Failed to fetch from Chutes API', details: err.message }),
            };
        }
    }

    // Unknown API
    return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Unknown API' }),
    };
};
