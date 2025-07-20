const fetch = require('node-fetch');

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
    if (apiConfig.paramMappings.hasOwnProperty(requestParamName)) {
      const targetApiParamName = apiConfig.paramMappings[requestParamName];
      if (queryParamsFromRequest[requestParamName] !== undefined) {
        params.append(targetApiParamName, queryParamsFromRequest[requestParamName]);
      }
    } else if (requestParamName === apiConfig.apiKey?.queryParam && queryParamsFromRequest[requestParamName]) {
      // This 'else if' might be redundant if API key query params are excluded from paramMappings.
    } else {
      // For now, only mapped parameters are passed.
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
    if (results && results.error && results.message) {
        throw new Error(results.message);
    }
    results = []; // Default to empty array if not an array
  } else if (!Array.isArray(results) && !apiConfig.responseDataPath) {
    // This case is fine if the API returns a single object instead of an array (e.g. getPhoto)
  }

  if (apiConfig.responseDataPath) {
      const rootData = { ...data }; // clone original data
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

async function fetchAndServeFavicon(req, res) {
    const { domain, sz = 16 } = req.query;
    if (!domain) {
        res.set({
            'Access-Control-Allow-Origin': '*',
            'Cross-Origin-Resource-Policy': 'cross-origin',
            'Cross-Origin-Embedder-Policy': 'unsafe-none',
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
        const contentType = response.headers.get('content-type') || 'image/x-icon';

        const buffer = await response.buffer();
        res.set({
            'Access-Control-Allow-Origin': '*',
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=86400',
            'Cross-Origin-Resource-Policy': 'cross-origin',
            'Cross-Origin-Embedder-Policy': 'unsafe-none',
        });
        res.send(buffer);

    } catch (err) {
        res.set({
            'Access-Control-Allow-Origin': '*',
            'Cross-Origin-Resource-Policy': 'cross-origin',
            'Cross-Origin-Embedder-Policy': 'unsafe-none',
        });
        console.error(`Favicon fetch error for domain "${domain}":`, err.message);
        res.status(500).json({ error: 'Failed to fetch favicon', details: err.message });
    }
}

module.exports = { fetchFromApiHost, fetchAndServeFavicon };
