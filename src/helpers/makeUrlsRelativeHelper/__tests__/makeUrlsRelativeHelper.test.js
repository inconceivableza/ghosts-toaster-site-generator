const makeUrlsRelativeHelper = require('../makeUrlsRelativeHelper');

// Include an empty string in ALT_DOMAINS to exercise the !domain guard on line 21
jest.mock('../../../constants/OPTIONS', () => ({
  SOURCE_DOMAIN: 'http://ghost.example.com:2368',
  PRODUCTION_DOMAIN: 'https://www.example.com',
  ALT_DOMAINS: ['https://staging.example.com', ''],
}));

describe('makeUrlsRelativeHelper', () => {
  const sourceDomain = 'http://ghost.example.com:2368';
  const altDomain = 'https://staging.example.com';

  describe('XML files', () => {
    it('should leave XML files unchanged', () => {
      const input = `<loc>${sourceDomain}/sitemap.xml</loc>`;
      const result = makeUrlsRelativeHelper('sitemap.xml')(input);
      expect(result).toBe(input);
    });

    it('should leave sitemap XML unchanged', () => {
      const input = `<url><loc>${sourceDomain}/page/</loc></url>`;
      const result = makeUrlsRelativeHelper('sitemap-pages.xml')(input);
      expect(result).toBe(input);
    });
  });

  describe('SOURCE_DOMAIN stripping', () => {
    it('should strip http SOURCE_DOMAIN to root-relative', () => {
      const input = `<a href="${sourceDomain}/about/">About</a>`;
      const expected = `<a href="/about/">About</a>`;
      expect(makeUrlsRelativeHelper('index.html')(input)).toBe(expected);
    });

    it('should strip https SOURCE_DOMAIN to root-relative', () => {
      const input = `<img src="https://ghost.example.com:2368/content/image.jpg" />`;
      const expected = `<img src="/content/image.jpg" />`;
      expect(makeUrlsRelativeHelper('page.html')(input)).toBe(expected);
    });

    it('should strip protocol-relative SOURCE_DOMAIN to root-relative', () => {
      const input = `<img src="//ghost.example.com:2368/content/image.jpg" />`;
      const expected = `<img src="/content/image.jpg" />`;
      expect(makeUrlsRelativeHelper('page.html')(input)).toBe(expected);
    });

    it('should strip multiple occurrences', () => {
      const input = `<a href="${sourceDomain}/p1/">${sourceDomain}/p1/</a>`;
      const expected = `<a href="/p1/">/p1/</a>`;
      expect(makeUrlsRelativeHelper('index.html')(input)).toBe(expected);
    });
  });

  describe('ALT_DOMAINS stripping', () => {
    it('should skip empty/falsy entries in ALT_DOMAINS', () => {
      // OPTIONS mock has ALT_DOMAINS with one valid entry; SOURCE_DOMAIN is the only domain
      // when an empty string appears in ALT_DOMAINS it should be skipped without error
      const input = `<a href="http://ghost.example.com:2368/page/">Link</a>`;
      const expected = `<a href="/page/">Link</a>`;
      // The mock ALT_DOMAINS includes 'https://staging.example.com' (not empty) — this just
      // verifies the overall function works with ALT_DOMAINS present
      expect(makeUrlsRelativeHelper('index.html')(input)).toBe(expected);
    });

    it('should strip ALT_DOMAIN to root-relative', () => {
      const input = `<a href="${altDomain}/about/">About</a>`;
      const expected = `<a href="/about/">About</a>`;
      expect(makeUrlsRelativeHelper('index.html')(input)).toBe(expected);
    });

    it('should strip protocol-relative ALT_DOMAIN to root-relative', () => {
      const input = `<img src="//staging.example.com/content/image.jpg" />`;
      const expected = `<img src="/content/image.jpg" />`;
      expect(makeUrlsRelativeHelper('page.html')(input)).toBe(expected);
    });
  });

  describe('non-matching domains', () => {
    it('should not modify external domains', () => {
      const input = `<a href="https://external.com/page">External</a>`;
      expect(makeUrlsRelativeHelper('index.html')(input)).toBe(input);
    });

    it('should not modify root-relative URLs', () => {
      const input = `<a href="/already/relative">Link</a>`;
      expect(makeUrlsRelativeHelper('index.html')(input)).toBe(input);
    });
  });

  describe('edge cases', () => {
    it('should handle empty string', () => {
      expect(makeUrlsRelativeHelper('index.html')('')).toBe('');
    });

    it('should handle null input', () => {
      expect(makeUrlsRelativeHelper('index.html')(null)).toBe(null);
    });

    it('should handle undefined input', () => {
      expect(makeUrlsRelativeHelper('index.html')(undefined)).toBe(undefined);
    });

    it('should handle non-string input', () => {
      expect(makeUrlsRelativeHelper('index.html')(123)).toBe(123);
    });

    it('should handle CSS files (non-XML)', () => {
      const input = `url("${sourceDomain}/content/bg.jpg")`;
      const expected = `url("/content/bg.jpg")`;
      expect(makeUrlsRelativeHelper('styles.css')(input)).toBe(expected);
    });

    it('should handle JS files (non-XML)', () => {
      const input = `var url = "${sourceDomain}/api";`;
      const expected = `var url = "/api";`;
      expect(makeUrlsRelativeHelper('script.js')(input)).toBe(expected);
    });
  });
});
