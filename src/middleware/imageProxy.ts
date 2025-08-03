import express from 'express';
import fetch from 'node-fetch';

export const imageProxy = express.Router();

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

imageProxy.get('/favicon', fetchAndServeFavicon);

imageProxy.get('/image', async (req, res, next) => {
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

imageProxy.get('/iconfinder/svg', async (req, res, next) => {
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
