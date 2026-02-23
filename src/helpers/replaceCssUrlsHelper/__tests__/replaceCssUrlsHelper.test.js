const replaceCssUrlsHelper = require('../replaceCssUrlsHelper');

// Mock OPTIONS
jest.mock('../../../constants/OPTIONS', () => ({
  SOURCE_DOMAIN: 'http://ghost.example.com:2368',
  PRODUCTION_DOMAIN: 'https://www.example.com',
}));

describe('replaceCssUrlsHelper', () => {
  const sourceDomain = 'http://ghost.example.com:2368';

  it('should strip domain in url() functions with double quotes', () => {
    const input = `background-image: url("${sourceDomain}/image.jpg");`;
    const expected = `background-image: url("/image.jpg");`;

    const result = replaceCssUrlsHelper(input);
    expect(result).toBe(expected);
  });

  it('should strip domain in url() functions with single quotes', () => {
    const input = `background-image: url('${sourceDomain}/image.jpg');`;
    const expected = `background-image: url('/image.jpg');`;

    const result = replaceCssUrlsHelper(input);
    expect(result).toBe(expected);
  });

  it('should strip domain in url() functions without quotes', () => {
    const input = `background-image: url(${sourceDomain}/image.jpg);`;
    const expected = `background-image: url(/image.jpg);`;

    const result = replaceCssUrlsHelper(input);
    expect(result).toBe(expected);
  });

  it('should strip protocol-relative domain in url() functions', () => {
    const input = `background-image: url("//ghost.example.com:2368/image.jpg");`;
    const expected = `background-image: url("/image.jpg");`;

    const result = replaceCssUrlsHelper(input);
    expect(result).toBe(expected);
  });

  it('should strip domain in @import statements with double quotes', () => {
    const input = `@import "${sourceDomain}/styles.css";`;
    const expected = `@import "/styles.css";`;

    const result = replaceCssUrlsHelper(input);
    expect(result).toBe(expected);
  });

  it('should strip domain in @import statements with single quotes', () => {
    const input = `@import '${sourceDomain}/styles.css';`;
    const expected = `@import '/styles.css';`;

    const result = replaceCssUrlsHelper(input);
    expect(result).toBe(expected);
  });

  it('should strip domain in @import url() statements', () => {
    const input = `@import url("${sourceDomain}/styles.css");`;
    const expected = `@import url("/styles.css");`;

    const result = replaceCssUrlsHelper(input);
    expect(result).toBe(expected);
  });

  it('should strip protocol-relative domain in @import statements', () => {
    const input = `@import "//ghost.example.com:2368/styles.css";`;
    const expected = `@import "/styles.css";`;

    const result = replaceCssUrlsHelper(input);
    expect(result).toBe(expected);
  });

  it('should handle multiple URLs in the same CSS', () => {
    const input = `
      @import "${sourceDomain}/reset.css";
      .background {
        background-image: url("${sourceDomain}/bg.jpg");
      }
      .icon {
        background-image: url('${sourceDomain}/icon.svg');
      }
    `;
    const expected = `
      @import "/reset.css";
      .background {
        background-image: url("/bg.jpg");
      }
      .icon {
        background-image: url('/icon.svg');
      }
    `;

    const result = replaceCssUrlsHelper(input);
    expect(result).toBe(expected);
  });

  it('should handle case-insensitive url() and @import', () => {
    const input = `
      @IMPORT "${sourceDomain}/styles.css";
      background: URL("${sourceDomain}/image.jpg");
    `;
    const expected = `
      @IMPORT "/styles.css";
      background: URL("/image.jpg");
    `;

    const result = replaceCssUrlsHelper(input);
    expect(result).toBe(expected);
  });

  it('should not replace URLs that are not the source domain', () => {
    const input = `
      @import "https://external.com/styles.css";
      background-image: url("https://notghost.example.com/image.jpg");
    `;
    const expected = input; // Should remain unchanged

    const result = replaceCssUrlsHelper(input);
    expect(result).toBe(expected);
  });

  it('should handle URLs with paths and query parameters', () => {
    const input = `background-image: url("${sourceDomain}/images/bg.jpg?v=123");`;
    const expected = `background-image: url("/images/bg.jpg?v=123");`;

    const result = replaceCssUrlsHelper(input);
    expect(result).toBe(expected);
  });

  it('should handle empty or null input', () => {
    expect(replaceCssUrlsHelper('')).toBe('');
    expect(replaceCssUrlsHelper(null)).toBe(null);
    expect(replaceCssUrlsHelper(undefined)).toBe(undefined);
  });

  it('should handle non-string input', () => {
    expect(replaceCssUrlsHelper(123)).toBe(123);
    expect(replaceCssUrlsHelper({})).toStrictEqual({});
  });
});
