// Functions to be tested will be required dynamically in tests

const OriginalURL = URL;

import * as imageProxy from '../imageProxy';

describe('Image Proxy Utilities', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getProxiedImageUrl', () => {
    test('Test Case III.1 (External URL, Dev Env): Returns local proxy URL for external images in dev', () => {
      jest.spyOn(imageProxy, 'getHostname').mockReturnValue('localhost');
      const { getProxiedImageUrl } = imageProxy;
      const imageUrl = 'http://images.unsplash.com/photo.jpg';
      const expected = `/api/image?url=${encodeURIComponent(imageUrl)}`;
      expect(getProxiedImageUrl(imageUrl)).toBe(expected);
    });

    test('Test Case III.1b (External Wallhaven URL, Dev Env): Returns local proxy URL for wallhaven images in dev', () => {
      jest.spyOn(imageProxy, 'getHostname').mockReturnValue('127.0.0.1');
      const { getProxiedImageUrl } = imageProxy;
      const imageUrl = 'https://th.wallhaven.cc/small/m9/m96g8p.jpg';
      const expected = `/api/image?url=${encodeURIComponent(imageUrl)}`;
      expect(getProxiedImageUrl(imageUrl)).toBe(expected);
    });

    test('Test Case III.2 (External URL, Prod Env): Returns Netlify proxy URL for external images in prod', () => {
      jest.spyOn(imageProxy, 'getHostname').mockReturnValue('my-app.netlify.app');
      const { getProxiedImageUrl } = imageProxy;
      const imageUrl = 'http://images.unsplash.com/photo.jpg';
      const expected = `/.netlify/functions/proxy?api=image&url=${encodeURIComponent(imageUrl)}`;
      expect(getProxiedImageUrl(imageUrl)).toBe(expected);
    });

    test('Test Case III.3 (Internal URL): Returns original URL for internal/non-proxied images', () => {
      const { getProxiedImageUrl } = require('../imageProxy');
      const imageUrl = '/assets/local-image.png';
      expect(getProxiedImageUrl(imageUrl)).toBe(imageUrl);
    });

    test('Test Case (Relative URL): Returns original URL for relative non-proxied images', () => {
      const { getProxiedImageUrl } = require('../imageProxy');
      const imageUrl = 'local-image.png';
      expect(getProxiedImageUrl(imageUrl)).toBe(imageUrl);
    });

    test('Test Case III.4 (Empty URL): Returns empty string for empty URL', () => {
      const { getProxiedImageUrl } = require('../imageProxy');
      expect(getProxiedImageUrl('')).toBe('');
    });

    test('(Null URL): Returns empty string for null URL', () => {
      const { getProxiedImageUrl } = require('../imageProxy');
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      expect(getProxiedImageUrl(null)).toBe('');
    });
  });

  describe('shouldProxyImage', () => {
    let currentShouldProxyImage: (imageUrl: string) => boolean;

    beforeEach(() => {
      currentShouldProxyImage = require('../imageProxy').shouldProxyImage;
    });

    test('Test Case III.5 (Known External Domain - Unsplash): Returns true for Unsplash', () => {
      expect(currentShouldProxyImage('https://images.unsplash.com/test.jpg')).toBe(true);
    });

    test('Test Case (Known External Domain - Wallhaven): Returns true for Wallhaven', () => {
      expect(currentShouldProxyImage('https://w.wallhaven.cc/full/zy/wallhaven-zygeko.jpg')).toBe(true);
    });

    test('Test Case (Known External Domain - Pexels): Returns true for Pexels', () => {
      expect(currentShouldProxyImage('https://images.pexels.com/photos/12345/pexels-photo-12345.jpeg')).toBe(true);
    });

    test('Test Case III.6 (Other External Domain): Returns false for other external domains not in list', () => {
      expect(currentShouldProxyImage('https://www.anotherdomain.com/test.jpg')).toBe(false);
    });

    test('Test Case III.7 (Relative URL): Returns false for relative URLs', () => {
      expect(currentShouldProxyImage('/images/local.jpg')).toBe(false);
    });

    test('(Absolute local path URL): Returns false for absolute local path URLs', () => {
      expect(currentShouldProxyImage('file:///C:/Users/test/image.png')).toBe(false);
    });

    test('(Empty URL): Returns false for empty URL', () => {
      expect(currentShouldProxyImage('')).toBe(false);
    });

    test('(Invalid URL): Returns false for invalid URLs that throw during parsing', () => {
      expect(currentShouldProxyImage('http://[invalid]:port')).toBe(false);
    });
  });
});
