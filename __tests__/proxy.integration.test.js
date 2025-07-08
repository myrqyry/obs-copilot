const request = require('supertest');
const nock = require('nock');
const app = require('../proxy.cjs'); // Path to your proxy app

describe('Proxy Integration Tests', () => {
  afterEach(() => {
    nock.cleanAll(); // Clean up nock interceptors after each test
  });

  // Scenario 1: Normal Proxy Operations
  describe('Normal Operations', () => {
    test('Test Case II.1.1 (Image Proxy - End-to-End Success): Successfully proxies an image request', async () => {
      const targetImageUrl = 'http://external-image-server.com/image.png';
      const mockImageData = 'dummyimagedata';
      const mockImageContentType = 'image/png';

      nock('http://external-image-server.com')
        .get('/image.png')
        .reply(200, mockImageData, { 'Content-Type': mockImageContentType });

      const response = await request(app).get(`/api/image?url=${encodeURIComponent(targetImageUrl)}`);

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toBe(mockImageContentType);
      expect(response.body.toString()).toBe(mockImageData);
      expect(nock.isDone()).toBe(true); // Verifies that the nock interceptor was called
    });

    test('Test Case (Pexels Proxy - End-to-End Success with env key)', async () => {
        const OLD_ENV = process.env;
        jest.resetModules(); // Clear module cache
        process.env = { ...OLD_ENV, PEXELS_API_KEY: 'ENV_PEXELS_KEY_INTEGRATION' };
        const appWithEnv = require('../proxy.cjs'); // Re-require to get new env


        const mockPexelsData = { photos: [{ id: 1, src: { original: 'url' } }] };

        nock('https://api.pexels.com', {
            reqheaders: {
              'Authorization': 'ENV_PEXELS_KEY_INTEGRATION'
            }
          })
          .get('/v1/search')
          .query({ query: 'nature' })
          .reply(200, mockPexelsData, { 'Content-Type': 'application/json' });

        const response = await request(appWithEnv).get('/api/pexels?query=nature');

        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual(mockPexelsData);
        expect(nock.isDone()).toBe(true);

        process.env = OLD_ENV; // Restore
      });
  });

  // Scenario 2: Proxy Failures
  describe('Proxy Failures', () => {
    test('Test Case II.2.1 (Image Proxy - Target Server Error): Handles target server error gracefully', async () => {
      const targetImageUrl = 'http://external-image-server.com/errorimage.png';

      nock('http://external-image-server.com')
        .get('/errorimage.png')
        .reply(503, 'Service Unavailable');

      const response = await request(app).get(`/api/image?url=${encodeURIComponent(targetImageUrl)}`);

      expect(response.statusCode).toBe(500);
      expect(response.body.error).toBe('Failed to fetch image');
      expect(response.body.details).toContain('503 Service Unavailable');
      expect(nock.isDone()).toBe(true);
    });

    test('Test Case II.2.2 (Image Proxy - Target Timeout): Handles target server timeout', async () => {
      const targetImageUrl = 'http://external-image-server.com/timeoutimage.png';

      nock('http://external-image-server.com')
        .get('/timeoutimage.png')
        .reply(504, 'Gateway Timeout'); // Simulate a gateway timeout from the target server

      const response = await request(app).get(`/api/image?url=${encodeURIComponent(targetImageUrl)}`);

      expect(response.statusCode).toBe(500); // Proxy should convert this to a 500
      expect(response.body.error).toBe('Failed to fetch image');
      // The details should reflect the 504 error
      expect(response.body.details).toMatch(/Image fetch failed: 504 Gateway Timeout/i);
      expect(nock.isDone()).toBe(true);
    }, 10000); // Keep increased timeout for now, though it might not be needed with simpler reply

    test('Test Case (Pexels Proxy - Target API Error): Handles Pexels API error', async () => {
        const OLD_ENV = process.env;
        jest.resetModules();
        process.env = { ...OLD_ENV, PEXELS_API_KEY: 'ENV_PEXELS_KEY_FOR_API_ERROR' };
        const appWithEnv = require('../proxy.cjs');

        nock('https://api.pexels.com', {
            reqheaders: {
              'Authorization': 'ENV_PEXELS_KEY_FOR_API_ERROR'
            }
          })
          .get('/v1/search')
          .query({ query: 'forbidden' })
          .reply(403, { error: 'Your account is suspended' }, { 'Content-Type': 'application/json' });

        const response = await request(appWithEnv).get('/api/pexels?query=forbidden');

        expect(response.statusCode).toBe(500); // proxy.cjs returns 500 for upstream errors
        expect(response.body.error).toBe('Proxy error for pexels'); // Updated expected error message
        // Details might include the stringified error or parts of it
        expect(response.body.details).toBeDefined();
        expect(nock.isDone()).toBe(true);

        process.env = OLD_ENV;
      });
  });

  // Scenario 3: Concurrent Proxies (Basic Check)
  describe('Concurrent Proxy Requests', () => {
    test('Test Case II.3.1 (Multiple Image Proxies - Concurrent Success): Handles multiple image proxy requests', async () => {
      const url1 = 'http://image-server-1.com/img1.png';
      const url2 = 'http://image-server-2.com/img2.png';
      const data1 = 'img1data';
      const data2 = 'img2data';

      nock('http://image-server-1.com').get('/img1.png').reply(200, data1, { 'Content-Type': 'image/png' });
      nock('http://image-server-2.com').get('/img2.png').reply(200, data2, { 'Content-Type': 'image/jpeg' });

      const [response1, response2] = await Promise.all([
        request(app).get(`/api/image?url=${encodeURIComponent(url1)}`),
        request(app).get(`/api/image?url=${encodeURIComponent(url2)}`)
      ]);

      expect(response1.statusCode).toBe(200);
      expect(response1.body.toString()).toBe(data1);
      expect(response1.headers['content-type']).toBe('image/png');

      expect(response2.statusCode).toBe(200);
      expect(response2.body.toString()).toBe(data2);
      expect(response2.headers['content-type']).toBe('image/jpeg');

      expect(nock.isDone()).toBe(true);
    });
  });

  // Scenario 4: Edge Cases & Invalid Inputs (Tested more thoroughly in unit tests, but a few here for sanity)
  describe('Edge Cases and Invalid Inputs', () => {
    test('(Image Proxy - Missing URL): Should return 400 if url param is missing', async () => {
      const response = await request(app).get('/api/image');
      expect(response.statusCode).toBe(400);
      expect(response.body.error).toBe('URL parameter is required for image proxy');
      // No nock interceptor needed as it shouldn't make an external call
    });

    test('(Pexels Proxy - Missing API Key, no query key): Should return 500 if Pexels API key is missing', async () => {
        const OLD_ENV = process.env;
        jest.resetModules();
        process.env = { ...OLD_ENV }; // Start fresh
        delete process.env.PEXELS_API_KEY;
        delete process.env.VITE_PEXELS_API_KEY;

        const appWithoutKey = require('../proxy.cjs');

        const response = await request(appWithoutKey).get('/api/pexels?query=nature');
        expect(response.statusCode).toBe(500);
        expect(response.body.error).toContain('Pexels API key not provided');

        process.env = OLD_ENV;
    });
  });
});
