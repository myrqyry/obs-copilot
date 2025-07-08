// Functions to be tested will be required dynamically in tests

const OriginalURL = URL;
const originalLocation = window.location;

describe('Image Proxy Utilities', () => {

  const resetGlobalsAndMochaSpecificURL = (hostnameForWindow: string, urlToParseInSUT: string, resultingHostnameFromParse: string) => {
    jest.resetModules();

    delete (global as any).window.location;
    (global as any).window.location = {
      hostname: hostnameForWindow,
      href: `http://${hostnameForWindow}/`,
      protocol: 'http:', pathname: '/', search: '', hash: '',
    };

    global.URL = class MockURL {
      public hostname: string;
      public href: string;
      public protocol: string;
      public pathname: string;
      public search: string;
      public hash: string;

      constructor(url: string, base?: string | URL) {
        if (url === urlToParseInSUT) {
          this.hostname = resultingHostnameFromParse;
        } else {
          // Fallback to original URL parsing for other URLs if any
          try {
            const realUrl = new OriginalURL(url, base);
            this.href = realUrl.href; this.protocol = realUrl.protocol; this.pathname = realUrl.pathname;
            this.search = realUrl.search; this.hash = realUrl.hash; this.hostname = realUrl.hostname;
          } catch (e) { // Handle relative or invalid URLs
            this.href = url; this.protocol = 'http:'; this.pathname = url.startsWith('/') ? url : `/${url}`;
            this.search = ''; this.hash = ''; this.hostname = '';
          }
        }
      }
    } as any;
  };

  afterEach(() => {
    global.URL = OriginalURL;
    (global as any).window.location = originalLocation;
    jest.resetModules();
  });

  describe('getProxiedImageUrl', () => {
    test('Test Case III.1 (External URL, Dev Env): Returns local proxy URL for external images in dev', () => {
      resetGlobalsAndMochaSpecificURL('localhost', 'http://images.unsplash.com/photo.jpg', 'images.unsplash.com');
      const { getProxiedImageUrl } = require('../imageProxy');
      const imageUrl = 'http://images.unsplash.com/photo.jpg';
      const expected = `/api/image?url=${encodeURIComponent(imageUrl)}`;
      expect(getProxiedImageUrl(imageUrl)).toBe(expected);
    });

    test('Test Case III.1b (External Wallhaven URL, Dev Env): Returns local proxy URL for wallhaven images in dev', () => {
        resetGlobalsAndMochaSpecificURL('127.0.0.1', 'https://th.wallhaven.cc/small/m9/m96g8p.jpg', 'th.wallhaven.cc');
        const { getProxiedImageUrl } = require('../imageProxy');
        const imageUrl = 'https://th.wallhaven.cc/small/m9/m96g8p.jpg';
        const expected = `/api/image?url=${encodeURIComponent(imageUrl)}`;
        expect(getProxiedImageUrl(imageUrl)).toBe(expected);
    });

    test('Test Case III.2 (External URL, Prod Env): Returns Netlify proxy URL for external images in prod', () => {
      // Step 1: Set window.location.hostname to the "production" value
      delete (global as any).window.location;
      (global as any).window.location = {
        hostname: 'my-app.netlify.app', // Production hostname
        href: 'https://my-app.netlify.app/', protocol: 'https:', pathname: '/', search: '', hash: '',
      };

      // Step 2: Reset modules so imageProxy is re-imported and sees the new window.location
      jest.resetModules();

      // Step 3: Mock global.URL for how 'http://images.unsplash.com/photo.jpg' will be parsed
      // This is crucial for the shouldProxyImage -> new URL(imageUrl).hostname check
      global.URL = class TestURL extends OriginalURL {
          constructor(url: string, base?: string | URL) {
              super(url, base); // Call original URL constructor
              if (url === 'http://images.unsplash.com/photo.jpg') {
                  // Ensure this specific URL is parsed to have a hostname that shouldProxy will catch
                  this.hostname = 'images.unsplash.com';
              }
          }
      } as any;

      // Step 4: Require the function to test *after* all global mocks are set up
      const { getProxiedImageUrl } = require('../imageProxy');

      const imageUrl = 'http://images.unsplash.com/photo.jpg';
      const expected = `/.netlify/functions/proxy?api=image&url=${encodeURIComponent(imageUrl)}`;
      expect(getProxiedImageUrl(imageUrl)).toBe(expected);
    });

    test('Test Case III.3 (Internal URL): Returns original URL for internal/non-proxied images', () => {
      resetGlobalsAndMochaSpecificURL('localhost', '/assets/local-image.png', ''); // Hostname for relative URL is empty
      const { getProxiedImageUrl } = require('../imageProxy');
      const imageUrl = '/assets/local-image.png';
      expect(getProxiedImageUrl(imageUrl)).toBe(imageUrl);
    });

    test('Test Case (Relative URL): Returns original URL for relative non-proxied images', () => {
        resetGlobalsAndMochaSpecificURL('localhost', 'local-image.png', '');
        const { getProxiedImageUrl } = require('../imageProxy');
        const imageUrl = 'local-image.png';
        expect(getProxiedImageUrl(imageUrl)).toBe(imageUrl);
    });

    test('Test Case III.4 (Empty URL): Returns empty string for empty URL', () => {
      resetGlobalsAndMochaSpecificURL('localhost', '', '');
      const { getProxiedImageUrl } = require('../imageProxy');
      expect(getProxiedImageUrl('')).toBe('');
    });

    test('(Null URL): Returns empty string for null URL', () => {
        resetGlobalsAndMochaSpecificURL('localhost', '', '');
        const { getProxiedImageUrl } = require('../imageProxy');
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        expect(getProxiedImageUrl(null)).toBe('');
      });
  });

  describe('shouldProxyImage', () => {
    let currentShouldProxyImage: (imageUrl: string) => boolean;

    // Helper to set up mocks for URL parsing for this suite
    const setupShouldProxyTest = (urlToParse: string, parsedHostname: string) => {
        resetGlobalsAndMochaSpecificURL('localhost', urlToParse, parsedHostname); // window.location.hostname doesn't matter for shouldProxyImage
        currentShouldProxyImage = require('../imageProxy').shouldProxyImage;
    };

    const setupShouldProxyThrowingTest = (urlThatThrows: string) => {
        resetGlobalsAndMochaSpecificURL('localhost', '', ''); // Default URL mock
        global.URL = class MockURLThrows extends OriginalURL {
            constructor(url: string, base?: string | URL) {
                if (url === urlThatThrows) throw new TypeError("Invalid URL for test");
                super(url, base); // Call original for other URLs
            }
        } as any;
        currentShouldProxyImage = require('../imageProxy').shouldProxyImage;
    };


    test('Test Case III.5 (Known External Domain - Unsplash): Returns true for Unsplash', () => {
      setupShouldProxyTest('https://images.unsplash.com/test.jpg', 'images.unsplash.com');
      expect(currentShouldProxyImage('https://images.unsplash.com/test.jpg')).toBe(true);
    });

    test('Test Case (Known External Domain - Wallhaven): Returns true for Wallhaven', () => {
      setupShouldProxyTest('https://w.wallhaven.cc/full/zy/wallhaven-zygeko.jpg', 'w.wallhaven.cc');
      expect(currentShouldProxyImage('https://w.wallhaven.cc/full/zy/wallhaven-zygeko.jpg')).toBe(true);
    });

    test('Test Case (Known External Domain - Pexels): Returns true for Pexels', () => {
        setupShouldProxyTest('https://images.pexels.com/photos/12345/pexels-photo-12345.jpeg', 'images.pexels.com');
        expect(currentShouldProxyImage('https://images.pexels.com/photos/12345/pexels-photo-12345.jpeg')).toBe(true);
    });

    test('Test Case III.6 (Other External Domain): Returns false for other external domains not in list', () => {
      setupShouldProxyTest('https://www.anotherdomain.com/test.jpg', 'www.anotherdomain.com');
      expect(currentShouldProxyImage('https://www.anotherdomain.com/test.jpg')).toBe(false);
    });

    test('Test Case III.7 (Relative URL): Returns false for relative URLs', () => {
      // For relative URLs, new URL() would throw, caught by SUT.
      // The mock for URL should reflect this by providing an empty hostname or letting it use OriginalURL which would throw.
      setupShouldProxyTest('/images/local.jpg', ''); // Parsed hostname for relative path is empty
      expect(currentShouldProxyImage('/images/local.jpg')).toBe(false);
    });

    test('(Absolute local path URL): Returns false for absolute local path URLs', () => {
        setupShouldProxyTest('file:///C:/Users/test/image.png', ''); // Hostname for file protocol is empty
        expect(currentShouldProxyImage('file:///C:/Users/test/image.png')).toBe(false);
    });

    test('(Empty URL): Returns false for empty URL', () => {
      resetGlobalsAndMochaSpecificURL('localhost', '', '');
      currentShouldProxyImage = require('../imageProxy').shouldProxyImage;
      expect(currentShouldProxyImage('')).toBe(false);
    });

    test('(Invalid URL): Returns false for invalid URLs that throw during parsing', () => {
        setupShouldProxyThrowingTest('http://[invalid]:port');
        expect(currentShouldProxyImage('http://[invalid]:port')).toBe(false);
      });
  });
});
