import request from 'supertest';
import { jest } from '@jest/globals';
// This is THE mock function that will replace 'node-fetch'
const mockFetchImplementation = jest.fn();
jest.mock('node-fetch', () => {
    const original = jest.requireActual('node-fetch');
    return {
        __esModule: true,
        default: mockFetchImplementation,
        Response: original.Response,
        Headers: original.Headers,
    };
});

describe('Proxy Unit Tests', () => {
    let app;

    beforeAll(async () => {
        const module = await import('../proxy.mjs');
        app = module.default;
    });

    beforeEach(() => {
        mockFetchImplementation.mockClear();
    });

    describe('/api/image', () => {
        test('Test Case 1.1 (Image Proxy - Success): Should proxy a valid image URL successfully', async () => {
            const mockImageData = 'dummyimagedata';
            const mockImageContentType = 'image/jpeg';
            const targetUrl = 'http://example.com/image.jpg';

            mockFetchImplementation.mockResolvedValueOnce(
                new Response(mockImageData, {
                    status: 200,
                    headers: new Headers({ 'Content-Type': mockImageContentType }),
                })
            );

            const response = await request(app).get(`/api/image?url=${encodeURIComponent(targetUrl)}`);

            expect(mockFetchImplementation).toHaveBeenCalledTimes(1);
            expect(mockFetchImplementation).toHaveBeenCalledWith(targetUrl);
            expect(response.statusCode).toBe(200);
            expect(response.headers['content-type']).toBe(mockImageContentType);
            expect(response.body.toString()).toBe(mockImageData);
        });

        test('Test Case 2.1 (Image Proxy - Target 404): Should return 500 if target image URL returns 404', async () => {
            const targetUrl = 'http://example.com/notfound.jpg';
            mockFetchImplementation.mockResolvedValueOnce(
                new Response('Not Found', {
                    status: 404,
                    statusText: 'Not Found',
                })
            );

            const response = await request(app).get(`/api/image?url=${encodeURIComponent(targetUrl)}`);

            expect(response.statusCode).toBe(500);
            expect(response.body.error).toBe('Failed to fetch image');
        });
    });

    describe('/api/pexels', () => {
        const ORIGINAL_ENV = { ...process.env };

        beforeEach(() => {
            process.env = { ...ORIGINAL_ENV };
        });

        afterAll(() => {
            process.env = { ...ORIGINAL_ENV };
        });

        test('Test Case 1.2 (Pexels Proxy - Success with query key): Should proxy Pexels API successfully with query key', async () => {
            delete process.env.PEXELS_API_KEY;
            const mockPexelsData = { photos: [{ id: 1 }] };
            const apiKey = 'TEST_PEXELS_KEY_QUERY';
            mockFetchImplementation.mockResolvedValueOnce(
                new Response(JSON.stringify(mockPexelsData), {
                    status: 200,
                    headers: new Headers({ 'Content-Type': 'application/json' }),
                })
            );

            const response = await request(app).get(`/api/pexels?query=nature&key=${apiKey}`);

            expect(response.statusCode).toBe(200);
            expect(response.body).toEqual(mockPexelsData);
            expect(mockFetchImplementation.mock.calls[0][1].headers.Authorization).toBe(apiKey);
        });

        test('Test Case 2.3 (Pexels Proxy - Missing API Key): Should return 500 if Pexels API key is missing', async () => {
            delete process.env.PEXELS_API_KEY;
            delete process.env.VITE_PEXELS_API_KEY;

            const response = await request(app).get('/api/pexels?query=nature');

            expect(response.statusCode).toBe(500);
            expect(response.body.error).toContain('Pexels API key not provided');
        });
    });

    describe('General API Handling', () => {
        test('Test Case 4.3b (Unified Proxy - Unknown API through path): Should return 404 for a truly unknown path', async () => {
            const response = await request(app).get('/api/completelyunknownservice');
            expect(response.statusCode).toBe(404);
        });

        test('Test Case (Iconfinder SVG Proxy - Missing API Key): Should return 500 if Iconfinder API key is missing', async () => {
            delete process.env.ICONFINDER_API_KEY;
            const response = await request(app).get('/api/iconfinder/svg?url=https://api.iconfinder.com/some/svg');
            expect(response.statusCode).toBe(500);
        });
    });
});
