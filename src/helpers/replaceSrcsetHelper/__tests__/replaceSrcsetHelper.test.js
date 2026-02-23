const replaceSrcsetHelper = require('../replaceSrcsetHelper');

// Mock OPTIONS
jest.mock('../../../constants/OPTIONS', () => ({
  SOURCE_DOMAIN: 'http://ghost.example.com:2368',
  PRODUCTION_DOMAIN: 'https://www.example.com',
}));

describe('replaceSrcsetHelper', () => {
  const sourceDomain = 'http://ghost.example.com:2368';

  it('should strip domain in simple srcset with descriptors', () => {
    const input = `<img srcset="${sourceDomain}/image-400.jpg 400w, ${sourceDomain}/image-800.jpg 800w" />`;
    const expected = `<img srcset="/image-400.jpg 400w, /image-800.jpg 800w" />`;

    const result = replaceSrcsetHelper(input);
    expect(result).toBe(expected);
  });

  it('should strip domain in srcset with pixel density descriptors', () => {
    const input = `<img srcset="${sourceDomain}/image.jpg 1x, ${sourceDomain}/image-2x.jpg 2x" />`;
    const expected = `<img srcset="/image.jpg 1x, /image-2x.jpg 2x" />`;

    const result = replaceSrcsetHelper(input);
    expect(result).toBe(expected);
  });

  it('should strip protocol-relative domain in srcset', () => {
    const input = `<img srcset="//ghost.example.com:2368/image-400.jpg 400w, //ghost.example.com:2368/image-800.jpg 800w" />`;
    const expected = `<img srcset="/image-400.jpg 400w, /image-800.jpg 800w" />`;

    const result = replaceSrcsetHelper(input);
    expect(result).toBe(expected);
  });

  it('should strip domain in data-srcset for lazy loading', () => {
    const input = `<img data-srcset="${sourceDomain}/image-400.jpg 400w, ${sourceDomain}/image-800.jpg 800w" />`;
    const expected = `<img data-srcset="/image-400.jpg 400w, /image-800.jpg 800w" />`;

    const result = replaceSrcsetHelper(input);
    expect(result).toBe(expected);
  });

  it('should handle srcset with mixed quotes', () => {
    const input = `
      <img srcset="${sourceDomain}/image1.jpg 1x" />
      <img srcset='${sourceDomain}/image2.jpg 1x' />
    `;
    const expected = `
      <img srcset="/image1.jpg 1x" />
      <img srcset='/image2.jpg 1x' />
    `;

    const result = replaceSrcsetHelper(input);
    expect(result).toBe(expected);
  });

  it('should handle complex srcset with multiple sources and descriptors', () => {
    const input = `<img srcset="${sourceDomain}/image-small.jpg 300w, ${sourceDomain}/image-medium.jpg 600w, ${sourceDomain}/image-large.jpg 1200w, ${sourceDomain}/image-xlarge.jpg 1800w" />`;
    const expected = `<img srcset="/image-small.jpg 300w, /image-medium.jpg 600w, /image-large.jpg 1200w, /image-xlarge.jpg 1800w" />`;

    const result = replaceSrcsetHelper(input);
    expect(result).toBe(expected);
  });

  it('should handle srcset with query parameters', () => {
    const input = `<img srcset="${sourceDomain}/image.jpg?v=123&size=400 400w, ${sourceDomain}/image.jpg?v=123&size=800 800w" />`;
    const expected = `<img srcset="/image.jpg?v=123&size=400 400w, /image.jpg?v=123&size=800 800w" />`;

    const result = replaceSrcsetHelper(input);
    expect(result).toBe(expected);
  });

  it('should handle srcset with paths', () => {
    const input = `<img srcset="${sourceDomain}/content/images/2023/01/image-400.jpg 400w, ${sourceDomain}/content/images/2023/01/image-800.jpg 800w" />`;
    const expected = `<img srcset="/content/images/2023/01/image-400.jpg 400w, /content/images/2023/01/image-800.jpg 800w" />`;

    const result = replaceSrcsetHelper(input);
    expect(result).toBe(expected);
  });

  it('should not replace URLs that are not the source domain', () => {
    const input = `<img srcset="https://external.com/image-400.jpg 400w, https://notghost.example.com/image-800.jpg 800w" />`;
    const expected = input; // Should remain unchanged

    const result = replaceSrcsetHelper(input);
    expect(result).toBe(expected);
  });

  it('should handle mixed URLs (some source domain, some external)', () => {
    const input = `<img srcset="${sourceDomain}/image-400.jpg 400w, https://external.com/image-800.jpg 800w" />`;
    const expected = `<img srcset="/image-400.jpg 400w, https://external.com/image-800.jpg 800w" />`;

    const result = replaceSrcsetHelper(input);
    expect(result).toBe(expected);
  });

  it('should handle case-insensitive srcset attributes', () => {
    const input = `<img SRCSET="${sourceDomain}/image.jpg 1x" />`;
    const expected = `<img SRCSET="/image.jpg 1x" />`;

    const result = replaceSrcsetHelper(input);
    expect(result).toBe(expected);
  });

  it('should handle multiple img tags with srcset', () => {
    const input = `
      <img srcset="${sourceDomain}/hero-400.jpg 400w, ${sourceDomain}/hero-800.jpg 800w" alt="Hero" />
      <img srcset="${sourceDomain}/thumb-100.jpg 1x, ${sourceDomain}/thumb-200.jpg 2x" alt="Thumbnail" />
    `;
    const expected = `
      <img srcset="/hero-400.jpg 400w, /hero-800.jpg 800w" alt="Hero" />
      <img srcset="/thumb-100.jpg 1x, /thumb-200.jpg 2x" alt="Thumbnail" />
    `;

    const result = replaceSrcsetHelper(input);
    expect(result).toBe(expected);
  });

  it('should handle srcset with extra whitespace', () => {
    const input = `<img srcset="  ${sourceDomain}/image-400.jpg   400w  ,  ${sourceDomain}/image-800.jpg   800w  " />`;
    const expected = `<img srcset="  /image-400.jpg   400w  ,  /image-800.jpg   800w  " />`;

    const result = replaceSrcsetHelper(input);
    expect(result).toBe(expected);
  });

  it('should handle empty or null input', () => {
    expect(replaceSrcsetHelper('')).toBe('');
    expect(replaceSrcsetHelper(null)).toBe(null);
    expect(replaceSrcsetHelper(undefined)).toBe(undefined);
  });

  it('should handle non-string input', () => {
    expect(replaceSrcsetHelper(123)).toBe(123);
    expect(replaceSrcsetHelper({})).toStrictEqual({});
  });
});
