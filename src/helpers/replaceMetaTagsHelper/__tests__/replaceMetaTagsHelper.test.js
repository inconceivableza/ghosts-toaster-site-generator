const replaceMetaTagsHelper = require('../replaceMetaTagsHelper');

// Mock OPTIONS
jest.mock('../../../constants/OPTIONS', () => ({
  SOURCE_DOMAIN: 'http://ghost.example.com:2368',
  PRODUCTION_DOMAIN: 'https://www.example.com',
}));

describe('replaceMetaTagsHelper', () => {
  const sourceDomain = 'http://ghost.example.com:2368';
  const productionDomain = 'https://www.example.com';

  it('should replace canonical URLs', () => {
    const input = `<link rel="canonical" href="${sourceDomain}/post/my-article" />`;
    const expected = `<link rel="canonical" href="${productionDomain}/post/my-article" />`;

    const result = replaceMetaTagsHelper(input);
    expect(result).toBe(expected);
  });

  it('should replace Open Graph URLs', () => {
    const input = `
      <meta property="og:url" content="${sourceDomain}/post/my-article" />
      <meta property="og:image" content="${sourceDomain}/images/featured.jpg" />
    `;
    const expected = `
      <meta property="og:url" content="${productionDomain}/post/my-article" />
      <meta property="og:image" content="${productionDomain}/images/featured.jpg" />
    `;

    const result = replaceMetaTagsHelper(input);
    expect(result).toBe(expected);
  });

  it('should replace Twitter Card URLs', () => {
    const input = `
      <meta name="twitter:url" content="${sourceDomain}/post/my-article" />
      <meta name="twitter:image" content="${sourceDomain}/images/featured.jpg" />
    `;
    const expected = `
      <meta name="twitter:url" content="${productionDomain}/post/my-article" />
      <meta name="twitter:image" content="${productionDomain}/images/featured.jpg" />
    `;

    const result = replaceMetaTagsHelper(input);
    expect(result).toBe(expected);
  });

  it('should replace URLs in other meta tag content', () => {
    const input = `<meta name="description" content="Visit us at ${sourceDomain}" />`;
    const expected = `<meta name="description" content="Visit us at ${productionDomain}" />`;

    const result = replaceMetaTagsHelper(input);
    expect(result).toBe(expected);
  });

  it('should replace URLs in JSON-LD structured data', () => {
    const input = `
      <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "Article",
          "url": "${sourceDomain}/post/my-article"
        }
      </script>
    `;
    const expected = `
      <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "Article",
          "url": "${productionDomain}/post/my-article"
        }
      </script>
    `;

    const result = replaceMetaTagsHelper(input);
    expect(result).toBe(expected);
  });

  it('should replace protocol-relative URLs in meta tags', () => {
    const input = `
      <meta property="og:url" content="//ghost.example.com:2368/post" />
      <link rel="canonical" href="//ghost.example.com:2368/post" />
    `;
    const expected = `
      <meta property="og:url" content="//www.example.com/post" />
      <link rel="canonical" href="//www.example.com/post" />
    `;

    const result = replaceMetaTagsHelper(input);
    expect(result).toBe(expected);
  });

  it('should replace RSS/Atom feed links', () => {
    const input = `
      <link type="application/rss+xml" href="${sourceDomain}/rss" />
      <link type="application/atom+xml" href="${sourceDomain}/atom" />
    `;
    const expected = `
      <link type="application/rss+xml" href="${productionDomain}/rss" />
      <link type="application/atom+xml" href="${productionDomain}/atom" />
    `;

    const result = replaceMetaTagsHelper(input);
    expect(result).toBe(expected);
  });

  it('should handle case-insensitive attribute matching', () => {
    const input = `
      <META property="og:url" content="${sourceDomain}/post" />
      <LINK rel="canonical" href="${sourceDomain}/post" />
    `;
    const expected = `
      <META property="og:url" content="${productionDomain}/post" />
      <LINK rel="canonical" href="${productionDomain}/post" />
    `;

    const result = replaceMetaTagsHelper(input);
    expect(result).toBe(expected);
  });

  it('should handle single and double quotes', () => {
    const input = `
      <meta property='og:url' content='${sourceDomain}/post' />
      <meta property="og:image" content="${sourceDomain}/image.jpg" />
    `;
    const expected = `
      <meta property='og:url' content='${productionDomain}/post' />
      <meta property="og:image" content="${productionDomain}/image.jpg" />
    `;

    const result = replaceMetaTagsHelper(input);
    expect(result).toBe(expected);
  });

  it('should not replace URLs that are not the source domain', () => {
    const input = `
      <meta property="og:url" content="https://external.com/post" />
      <link rel="canonical" href="https://notghost.example.com/post" />
    `;
    const expected = input; // Should remain unchanged

    const result = replaceMetaTagsHelper(input);
    expect(result).toBe(expected);
  });

  it('should handle complex HTML with multiple meta tags', () => {
    const input = `
      <head>
        <title>My Article</title>
        <link rel="canonical" href="${sourceDomain}/post/my-article" />
        <meta property="og:url" content="${sourceDomain}/post/my-article" />
        <meta property="og:image" content="${sourceDomain}/images/featured.jpg" />
        <meta name="twitter:url" content="${sourceDomain}/post/my-article" />
        <meta name="description" content="Read more at ${sourceDomain}" />
        <link type="application/rss+xml" href="${sourceDomain}/rss" />
      </head>
    `;
    const expected = `
      <head>
        <title>My Article</title>
        <link rel="canonical" href="${productionDomain}/post/my-article" />
        <meta property="og:url" content="${productionDomain}/post/my-article" />
        <meta property="og:image" content="${productionDomain}/images/featured.jpg" />
        <meta name="twitter:url" content="${productionDomain}/post/my-article" />
        <meta name="description" content="Read more at ${productionDomain}" />
        <link type="application/rss+xml" href="${productionDomain}/rss" />
      </head>
    `;

    const result = replaceMetaTagsHelper(input);
    expect(result).toBe(expected);
  });

  it('should handle empty or null input', () => {
    expect(replaceMetaTagsHelper('')).toBe('');
    expect(replaceMetaTagsHelper(null)).toBe(null);
    expect(replaceMetaTagsHelper(undefined)).toBe(undefined);
  });

  it('should handle non-string input', () => {
    expect(replaceMetaTagsHelper(123)).toBe(123);
    expect(replaceMetaTagsHelper({})).toStrictEqual({});
  });
});