// Functions to be tested will be required dynamically in tests

const OriginalURL = URL;
const originalLocation = window.location;

describe('Image Proxy Utilities', () => {

  // Helper to set up global mocks. Call this *inside* tests or beforeEach/beforeAll
  // if the test/suite needs a specific global state *before* module import.
  const setupGlobalMocks = (hostnameForWindow: string = 'localhost', urlToParseInSUT?: string, resultingHostnameFromParse?: string) => {
    // Delete and recreate window.location
    // Use delete only if sure it's okay; JSDOM can be tricky.
    // More often, you might want to mock properties of the existing window.location if possible,
    // or use jest.spyOn(window, 'location', 'get').mockReturnValue(...);
    // However, since imageProxy.ts directly reads window.location.hostname, we need to control it.
    // The delete and reassign approach is aggressive but can work if done right before module load.
    delete (global as any).window.location;
    (global as any).window.location = {
      hostname: hostnameForWindow,
      href: `http://${hostnameForWindow}/`, // Keep href consistent
      protocol: hostnameForWindow.startsWith('https') ? 'https:' : 'http:',
      pathname: '/',
      search: '',
      hash: '',
      // assign: jest.fn(), reload: jest.fn(), replace: jest.fn(), // Add if needed by SUT
    };

    // Reset global.URL mock
    global.URL = class MockURL {
      public hostname: string;
      public href: string;
      public protocol: string;
      public pathname: string;
      public search: string;
      public hash: string;

      constructor(url: string, base?: string | URL) {
        if (urlToParseInSUT && url === urlToParseInSUT && resultingHostnameFromParse !== undefined) {
          this.hostname = resultingHostnameFromParse;
        } else {
          // Fallback to original URL parsing for other URLs or if specific mock isn't set
          try {
            const realUrl = new OriginalURL(url, base);
            this.href = realUrl.href; this.protocol = realUrl.protocol; this.pathname = realUrl.pathname;
            this.search = realUrl.search; this.hash = realUrl.hash; this.hostname = realUrl.hostname;
          } catch (e) { // Handle relative or invalid URLs
            this.href = url; this.protocol = 'http:'; this.pathname = url.startsWith('/') ? url : `/${url}`;
            this.search = ''; this.hash = ''; this.hostname = ''; // Default for relative/invalid
          }
        }
      }
    } as any;
  };

  // General cleanup
  afterEach(() => {
    global.URL = OriginalURL;
    (global as any).window.location = originalLocation;
    jest.resetModules(); // Clean up for other test files
  });

  describe('getProxiedImageUrl', () => {
    beforeEach(() => {
        // Default setup for this suite. Tests can override by calling setupGlobalMocks themselves.
        setupGlobalMocks('localhost');
        jest.resetModules();
    });

    test('Test Case III.1 (External URL, Dev Env): Returns local proxy URL for external images in dev', () => {
      // setupGlobalMocks('localhost', 'http://images.unsplash.com/photo.jpg', 'images.unsplash.com'); // Already default
      // jest.resetModules(); // Already done in describe's beforeEach
      const { getProxiedImageUrl } = require('../imageProxy');

      // Override global.URL specifically for how this image string is parsed by `new URL()`
      global.URL = class extends OriginalURL { constructor(url: string) { super(url); if (url === 'http://images.unsplash.com/photo.jpg') this.hostname = 'images.unsplash.com'; } } as any;

      const imageUrl = 'http://images.unsplash.com/photo.jpg';
      const expected = `/api/image?url=${encodeURIComponent(imageUrl)}`;
      expect(getProxiedImageUrl(imageUrl)).toBe(expected);
    });

    test('Test Case III.1b (External Wallhaven URL, Dev Env): Returns local proxy URL for wallhaven images in dev', () => {
        setupGlobalMocks('127.0.0.1', 'https://th.wallhaven.cc/small/m9/m96g8p.jpg', 'th.wallhaven.cc');
        jest.resetModules();
        const { getProxiedImageUrl } = require('../imageProxy');

        const imageUrl = 'https://th.wallhaven.cc/small/m9/m96g8p.jpg';
        const expected = `/api/image?url=${encodeURIComponent(imageUrl)}`;
        expect(getProxiedImageUrl(imageUrl)).toBe(expected);
    });

    test('Test Case III.2 (External URL, Prod Env): Returns Netlify proxy URL for external images in prod', () => {
      // Specific setup for this test:
      // 1. Set window.location to production hostname
      delete (global as any).window.location;
      (global as any).window.location = {
        hostname: 'my-app.netlify.app', // Production hostname
        href: 'https://my-app.netlify.app/', protocol: 'https:', pathname: '/', search: '', hash: '',
      };

      // 2. Reset modules so imageProxy is re-imported and sees the new window.location
      jest.resetModules();

      // 3. Mock global.URL for how 'http://images.unsplash.com/photo.jpg' will be parsed
      global.URL = class TestURLForProd extends OriginalURL {
          constructor(url: string, base?: string | URL) {
              super(url, base);
              if (url === 'http://images.unsplash.com/photo.jpg') {
                  this.hostname = 'images.unsplash.com';
              }
          }
      } as any;

      // 4. Require the function to test *after* all global mocks are set up
      const { getProxiedImageUrl } = require('../imageProxy');

      const imageUrl = 'http://images.unsplash.com/photo.jpg';
      const expected = `/.netlify/functions/proxy?api=image&url=${encodeURIComponent(imageUrl)}`;
      expect(getProxiedImageUrl(imageUrl)).toBe(expected);
    });

    test('Test Case III.3 (Internal URL): Returns original URL for internal/non-proxied images', () => {
      setupGlobalMocks('localhost', '/assets/local-image.png', '');
      jest.resetModules();
      const { getProxiedImageUrl } = require('../imageProxy');
      const imageUrl = '/assets/local-image.png';
      expect(getProxiedImageUrl(imageUrl)).toBe(imageUrl);
    });

    test('Test Case (Relative URL): Returns original URL for relative non-proxied images', () => {
        setupGlobalMocks('localhost', 'local-image.png', '');
        jest.resetModules();
        const { getProxiedImageUrl } = require('../imageProxy');
        const imageUrl = 'local-image.png';
        expect(getProxiedImageUrl(imageUrl)).toBe(imageUrl);
    });

    test('Test Case III.4 (Empty URL): Returns empty string for empty URL', () => {
      setupGlobalMocks('localhost');
      jest.resetModules();
      const { getProxiedImageUrl } = require('../imageProxy');
      expect(getProxiedImageUrl('')).toBe('');
    });

    test('(Null URL): Returns empty string for null URL', () => {
        setupGlobalMocks('localhost');
        jest.resetModules();
        const { getProxiedImageUrl } = require('../imageProxy');
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        expect(getProxiedImageUrl(null)).toBe('');
      });
  });

  describe('shouldProxyImage', () => {
    let currentShouldProxyImage: (imageUrl: string) => boolean;

    beforeEach(() => {
        setupGlobalMocks('localhost');
        jest.resetModules();
        currentShouldProxyImage = require('../imageProxy').shouldProxyImage;
    });

    const setSpecificUrlMock = (urlToParse: string, parsedHostname: string) => {
        global.URL = class MockURLForTest extends OriginalURL {
            public hostname: string;
            constructor(url: string, base?: string | URL) {
                super(url, base); // Important to call super to get other URL parts if needed
                if (url === urlToParse) {
                    this.hostname = parsedHostname;
                }
            }
        } as any;
    };
     const setupUrlMockToThrow = (urlThatThrows: string) => {
        global.URL = class MockURLThrows extends OriginalURL {
            constructor(url: string, base?: string | URL) {
                if (url === urlThatThrows) throw new TypeError("Invalid URL for test");
                super(url, base);
            }
        } as any;
    };


    test('Test Case III.5 (Known External Domain - Unsplash): Returns true for Unsplash', () => {
      setSpecificUrlMock('https://images.unsplash.com/test.jpg', 'images.unsplash.com');
      expect(currentShouldProxyImage('https://images.unsplash.com/test.jpg')).toBe(true);
    });

    test('Test Case (Known External Domain - Wallhaven): Returns true for Wallhaven', () => {
      setSpecificUrlMock('https://w.wallhaven.cc/full/zy/wallhaven-zygeko.jpg', 'w.wallhaven.cc');
      expect(currentShouldProxyImage('https://w.wallhaven.cc/full/zy/wallhaven-zygeko.jpg')).toBe(true);
    });

    test('Test Case (Known External Domain - Pexels): Returns true for Pexels', () => {
        setSpecificUrlMock('https://images.pexels.com/photos/12345/pexels-photo-12345.jpeg', 'images.pexels.com');
        expect(currentShouldProxyImage('https://images.pexels.com/photos/12345/pexels-photo-12345.jpeg')).toBe(true);
    });

    test('Test Case III.6 (Other External Domain): Returns false for other external domains not in list', () => {
      setSpecificUrlMock('https://www.anotherdomain.com/test.jpg', 'www.anotherdomain.com');
      expect(currentShouldProxyImage('https://www.anotherdomain.com/test.jpg')).toBe(false);
    });

    test('Test Case III.7 (Relative URL): Returns false for relative URLs', () => {
      setupUrlMockToThrow('/images/local.jpg'); // new URL() with relative path throws
      expect(currentShouldProxyImage('/images/local.jpg')).toBe(false);
    });

    test('(Absolute local path URL): Returns false for absolute local path URLs', () => {
        setSpecificUrlMock('file:///C:/Users/test/image.png', ''); // Hostname for file protocol is empty
        expect(currentShouldProxyImage('file:///C:/Users/test/image.png')).toBe(false);
    });

    test('(Empty URL): Returns false for empty URL', () => {
      expect(currentShouldProxyImage('')).toBe(false);
    });

    test('(Invalid URL): Returns false for invalid URLs that throw during parsing', () => {
        setupUrlMockToThrow('http://[invalid]:port');
        expect(currentShouldProxyImage('http://[invalid]:port')).toBe(false);
      });
  });
});
