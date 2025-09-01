/**
 * API endpoint resolution utility
 * Centralizes the logic for determining whether to use local development proxy
 * or production Netlify functions based on the current environment
 */

/**
 * Check if we're running in a local development environment
 */
export const isLocalEnvironment = (): boolean => {
  return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
};

/**
 * Get the appropriate API endpoint for a given service and path
 * @param service The API service name (e.g., 'giphy', 'iconfinder', 'iconify')
 * @param subPath Optional sub-path for the API (e.g., 'search', 'svg')
 * @param params Optional URL parameters to append
 * @returns The complete API endpoint URL
 */
export const getApiEndpoint = (
  service: string,
  subPath?: string,
  params?: URLSearchParams,
): string => {
  const isLocal = isLocalEnvironment();
  const normalizedService = service.startsWith('/') ? service.substring(1) : service;

  if (isLocal) {
    // Local development: use Vite proxy
    let url = `/api/${normalizedService}`;
    if (normalizedService === 'image') {
      url = `/api/assets/proxy-image`; // Use the new backend route for image proxy
      if (params) {
        // Change 'url' param to 'image_url' for the backend proxy-image endpoint
        const imageUrlParam = params.get('url');
        if (imageUrlParam) {
          params.delete('url');
          params.append('image_url', imageUrlParam);
        }
      }
    }
    if (subPath) {
      url += `/${subPath}`;
    }
    if (params) {
      url += `?${params.toString()}`;
    }
    return url;
  } else {
    // Production: use Netlify functions
    let url: string;

    // Handle different Netlify function URL patterns based on the service
    switch (normalizedService) {
      case 'image':
        // Image proxy uses query parameter format
        url = '/.netlify/functions/proxy?api=image';
        if (params) {
          // For image proxy, params are typically added to the base URL
          url += `&${params.toString()}`;
        }
        break;

      case 'iconfinder':
        // Some services use query parameter format
        url = '/.netlify/functions/proxy?api=iconfinder';
        if (subPath) {
          url += `&path=${subPath}`;
        }
        if (params) {
          url += `&${params.toString()}`;
        }
        break;

      default:
        // Most services use path-based routing
        url = `/.netlify/functions/proxy/${normalizedService}`;
        if (subPath) {
          url += `/${subPath}`;
        }
        if (params) {
          url += `?${params.toString()}`;
        }
        break;
    }

    return url;
  }
};

/**
 * Get a simple API endpoint without parameters (most common use case)
 * @param service The API service name
 * @param subPath Optional sub-path
 * @returns The API endpoint URL
 */
export const getSimpleApiEndpoint = (service: string, subPath?: string): string => {
  return getApiEndpoint(service, subPath);
};

/**
 * Build API URL with parameters
 * @param service The API service name
 * @param subPath Optional sub-path
 * @param searchParams Parameters to include in the URL
 * @returns Complete URL with parameters
 */
export const buildApiUrl = (
  service: string,
  subPath?: string,
  searchParams?: Record<string, string | number | boolean>,
): string => {
  const params = searchParams ? new URLSearchParams() : undefined;

  if (params && searchParams) {
    Object.entries(searchParams).forEach(([key, value]) => {
      params.append(key, String(value));
    });
  }

  return getApiEndpoint(service, subPath, params);
};
