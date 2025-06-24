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
        const { q, categories, purity, sorting, order, page } = event.queryStringParameters;
        const params = new URLSearchParams();
        if (q) params.append('q', q);
        if (categories) params.append('categories', categories);
        if (purity) params.append('purity', purity);
        if (sorting) params.append('sorting', sorting);
        if (order) params.append('order', order);
        if (page) params.append('page', page);
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

    // Unknown API
    return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Unknown API' }),
    };
};
