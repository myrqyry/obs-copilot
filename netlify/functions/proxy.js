// netlify/functions/proxy.js
// Netlify Function to proxy Wallhaven API requests (and future APIs) to avoid CORS issues
// Place this file in your Netlify Functions directory (e.g., netlify/functions/)

const fetch = require('node-fetch');

exports.handler = async function (event, context) {
    // Support multiple APIs in the future via ?api=wallhaven or path
    const api = event.queryStringParameters.api || 'wallhaven';

    if (api === 'wallhaven') {
        // Build Wallhaven API URL from query params
        const { q, categories, purity, sorting, order, page } = event.queryStringParameters;
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

    // Add more APIs here as needed
    return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Unknown API' }),
    };
};
