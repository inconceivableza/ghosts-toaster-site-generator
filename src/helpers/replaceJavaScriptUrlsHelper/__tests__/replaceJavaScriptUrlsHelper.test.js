const replaceJavaScriptUrlsHelper = require('../replaceJavaScriptUrlsHelper');

// Mock OPTIONS
jest.mock('../../../constants/OPTIONS', () => ({
  SOURCE_DOMAIN: 'http://ghost.example.com:2368',
  PRODUCTION_DOMAIN: 'https://www.example.com',
}));

describe('replaceJavaScriptUrlsHelper', () => {
  const sourceDomain = 'http://ghost.example.com:2368';

  it('should strip domain in double-quoted strings', () => {
    const input = `var apiUrl = "${sourceDomain}/api/posts";`;
    const expected = `var apiUrl = "/api/posts";`;

    const result = replaceJavaScriptUrlsHelper(input);
    expect(result).toBe(expected);
  });

  it('should strip domain in single-quoted strings', () => {
    const input = `var apiUrl = '${sourceDomain}/api/posts';`;
    const expected = `var apiUrl = '/api/posts';`;

    const result = replaceJavaScriptUrlsHelper(input);
    expect(result).toBe(expected);
  });

  it('should strip domain in template literals', () => {
    const input = `var apiUrl = \`${sourceDomain}/api/posts\`;`;
    const expected = `var apiUrl = \`/api/posts\`;`;

    const result = replaceJavaScriptUrlsHelper(input);
    expect(result).toBe(expected);
  });

  it('should strip protocol-relative domain in strings', () => {
    const input = `var url = "//ghost.example.com:2368/api";`;
    const expected = `var url = "/api";`;

    const result = replaceJavaScriptUrlsHelper(input);
    expect(result).toBe(expected);
  });

  it('should strip domain in object properties', () => {
    const input = `
      var config = {
        url: "${sourceDomain}",
        href: "${sourceDomain}/post",
        src: "${sourceDomain}/image.jpg"
      };
    `;
    const expected = `
      var config = {
        url: "",
        href: "/post",
        src: "/image.jpg"
      };
    `;

    const result = replaceJavaScriptUrlsHelper(input);
    expect(result).toBe(expected);
  });

  it('should strip domain in single-line comments', () => {
    const input = `// API endpoint: ${sourceDomain}/api`;
    const expected = `// API endpoint: /api`;

    const result = replaceJavaScriptUrlsHelper(input);
    expect(result).toBe(expected);
  });

  it('should strip domain in multi-line comments', () => {
    const input = `
      /*
       * Base URL: ${sourceDomain}
       * Used for API calls
       */
    `;
    // The domain is stripped; the space before the domain is preserved as trailing whitespace
    // Use explicit string to make the trailing space after "Base URL:" visible
    const expected = '\n      /*\n       * Base URL: \n       * Used for API calls\n       */\n    ';

    const result = replaceJavaScriptUrlsHelper(input);
    expect(result).toBe(expected);
  });

  it('should handle multiple URLs in the same string', () => {
    const input = `var urls = "${sourceDomain}/api ${sourceDomain}/images";`;
    const expected = `var urls = "/api /images";`;

    const result = replaceJavaScriptUrlsHelper(input);
    expect(result).toBe(expected);
  });

  it('should not replace URLs that are not the source domain', () => {
    const input = `
      var externalUrl = "https://external.com/api";
      var partialMatch = "https://notghost.example.com/api";
    `;
    const expected = input; // Should remain unchanged

    const result = replaceJavaScriptUrlsHelper(input);
    expect(result).toBe(expected);
  });

  it('should handle empty or null input', () => {
    expect(replaceJavaScriptUrlsHelper('')).toBe('');
    expect(replaceJavaScriptUrlsHelper(null)).toBe(null);
    expect(replaceJavaScriptUrlsHelper(undefined)).toBe(undefined);
  });

  it('should handle non-string input', () => {
    expect(replaceJavaScriptUrlsHelper(123)).toBe(123);
    expect(replaceJavaScriptUrlsHelper({})).toStrictEqual({});
  });
});
