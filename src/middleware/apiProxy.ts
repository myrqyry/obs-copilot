// @ts-nocheck
import express, { Request } from 'express';
import axios from 'axios';
import { logger } from '@/utils/logger';
import * as apiConfigs from '@/config/apis'; // Corrected import
import { DEFAULT_OBS_WEBSOCKET_URL } from '@/constants'; // Corrected import
import { loadConnectionSettings } from '@/utils/persistence';
const router = express.Router();
const isServer = typeof window === 'undefined';


// Cache for API responses
const apiCache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Safely gets a value from a nested object using a dot-separated path.
 * @param obj The object to traverse.
 * @param path The dot-separated path string.
 * @returns The value at the specified path, or undefined if not found.
 */
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path
    .split('.')
    .reduce((o: unknown, k: string) => (o as Record<string, unknown>)?.[k], obj);
}

/**
 * Fetches data from an external API based on configuration.
 * @param apiConfig Configuration for the API request.
 * @param req The incoming request object.
 * @param apiKeyOverride Optional API key to use.
 * @returns The fetched data.
 */
async function fetchFromApiHost(apiConfig: any, req: Request, apiKeyOverride?: string) {
  const params = new URLSearchParams();

  // Add query parameters from request, respecting API config
  if (apiConfig.queryParams) {
    for (const param of apiConfig.queryParams) {
      if (req.query[param.name]) {
        params.append(param.name, req.query[param.name] as string);
      } else if (param.required && !req.query[param.name]) {
        throw new Error(`Missing required query parameter: ${param.name}`);
      }
    }
  }

  // Add API key if provided or configured
  const apiKey = apiKeyOverride || apiConfig.apiKey;
  if (apiKey) {
    if (apiConfig.apiKeyLocation === 'header') {
      // Add API key to headers
    } else {
      params.append(apiConfig.apiKeyParamName || 'apiKey', apiKey);
    }
  }

  const url = `${apiConfig.host}${apiConfig.path}?${params.toString()}`;

  try {
    const response = await axios.get(url, {
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey &&
          apiConfig.apiKeyLocation === 'header' && {
            [apiConfig.apiKeyHeaderName || 'X-API-Key']: apiKey,
          }),
      },
    });

    let data = response.data;

    // Apply responseDataPath if specified
    if (apiConfig.responseDataPath) {
      data = getNestedValue(data, apiConfig.responseDataPath);
    }

    return data;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    logger.error(`API request failed for ${apiConfig.host}${apiConfig.path}: ${message}`);
    throw new Error(`API request failed: ${message}`);
  }
}

router.get('/:apiType/:url(*)', async (req, res, next) => {
  const apiType = req.params.apiType;
  const apiConfig = (apiConfigs as any)[apiType];

  if (!apiConfig) {
    return next({ status: 404, message: `API type '${apiType}' not found.` });
  }

  const cacheKey = `api_${apiType}_${req.originalUrl}`;

  // Check cache first
  if (apiCache.has(cacheKey)) {
    const cached = apiCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      logger.info(`Cache hit for API: ${apiType}`);
      return res.json(cached.data);
    } else {
      apiCache.delete(cacheKey); // Remove expired cache entry
    }
  }

  try {
    const apiKey = req.query.apiKey as string | undefined; // Allow API key override via query param
    const data = await fetchFromApiHost(apiConfig, req, apiKey);

    // Cache the response
    apiCache.set(cacheKey, { data, timestamp: Date.now() });

    res.json(data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    logger.error(`Proxy error for ${apiType}: ${message}`);
    return next({ status: 500, message: `Proxy error for ${apiType}`, details: message });
  }
});

// Proxy for Iconify API
router.get('/iconify/:provider/:iconSet/:iconName', async (req, res, next) => {
  const { provider, iconSet, iconName } = req.params;
  const iconUrl = `https://api.iconify.design/${provider}/${iconSet}/${iconName}.json`;

  try {
    const response = await axios.get(iconUrl, { responseType: 'json' });
    res.json(response.data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    logger.error(`Failed to fetch from Iconify search: ${message}`);
    return next({ status: 500, message: 'Failed to fetch from Iconify search', details: message });
  }
});

// Proxy for Gemini API (generate-content)
router.post('/gemini/generate-content', async (req, res, next) => {
  const geminiApiKey = req.query.apiKey as string | undefined;
  const prompt = req.body.prompt;

  if (!prompt) {
    return next({ status: 400, message: 'Missing prompt in request body' });
  }

  try {
    const response = await axios.post(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
      { contents: [{ parts: [{ text: prompt }] }] },
      {
        params: { key: geminiApiKey || process.env.GEMINI_API_KEY },
      },
    );
    res.json(response.data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    logger.error(`Failed to fetch from Gemini (generate-content): ${message}`);
    return next({
      status: 500,
      message: 'Failed to fetch from Gemini (generate-content)',
      details: message,
    });
  }
});

// Proxy for Gemini API (generate-image)
router.post('/gemini/generate-image', async (req, res, next) => {
  const geminiApiKey = req.query.apiKey as string | undefined;
  const prompt = req.body.prompt;

  if (!prompt) {
    return next({ status: 400, message: 'Missing prompt in request body' });
  }

  try {
    const response = await axios.post(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent',
      { contents: [{ parts: [{ text: prompt }] }] },
      {
        params: { key: geminiApiKey || process.env.GEMINI_API_KEY },
      },
    );
    res.json(response.data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    logger.error(`Failed to fetch from Gemini (generate-image): ${message}`);
    return next({
      status: 500,
      message: 'Failed to fetch from Gemini (generate-image)',
      details: message,
    });
  }
});

// Proxy for OBS API (placeholder)
router.get('/obs/:action', async (req, res, next) => {
  const { action } = req.params;
  const obsUrl = loadConnectionSettings().obsWebSocketUrl || DEFAULT_OBS_WEBSOCKET_URL;
  const obsPassword = loadConnectionSettings().obsWebSocketPassword;

  try {
    // This is a placeholder. In a real implementation, you would establish a WebSocket
    // connection to OBS and send the appropriate commands based on the 'action' parameter.
    // For now, we'll just return a success message.
    logger.info(`Proxying OBS action: ${action}`);
    res.status(200).json({ message: `Proxied OBS action: ${action}`, obsUrl, obsPassword });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    logger.error(`Failed to fetch from OBS: ${message}`);
    return next({ status: 500, message: 'Failed to fetch from OBS', details: message });
  }
});

// Proxy for Streamer.bot API (placeholder)
router.get('/streamerbot/:action', async (req, res, next) => {
  const { action } = req.params;
  const { streamerBotAddress, streamerBotPort } = loadConnectionSettings();

  try {
    // This is a placeholder. In a real implementation, you would establish a WebSocket
    // connection to Streamer.bot and send the appropriate commands based on the 'action' parameter.
    // For now, we'll just return a success message.
    logger.info(`Proxying Streamer.bot action: ${action}`);
    res.status(200).json({
      message: `Proxied Streamer.bot action: ${action}`,
      streamerBotAddress,
      streamerBotPort,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    logger.error(`Failed to fetch from Streamer.bot: ${message}`);
    return next({ status: 500, message: 'Failed to fetch from Streamer.bot', details: message });
  }
});

// Proxy for Chute API (placeholder)
router.get('/chute/:action', async (req, res, next) => {
  const { action } = req.params;

  try {
    // This is a placeholder.
    logger.info(`Proxying Chute action: ${action}`);
    res.status(200).json({ message: `Proxied Chute action: ${action}` });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    logger.error(`Failed to fetch from Chute API: ${message}`);
    return next({ status: 500, message: 'Failed to fetch from Chute API', details: message });
  }
});

// Silence unused isServer
void isServer;
export default router;
