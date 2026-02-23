const { compose } = require('lodash/fp');

// Mock OPTIONS
jest.mock('../../constants/OPTIONS', () => ({
  SOURCE_DOMAIN: 'http://ghost.example.com:2368',
  PRODUCTION_DOMAIN: 'https://www.example.com',
  ALT_DOMAINS: [],
}));

const replaceDomainWithUrlHelper = require('../../helpers/replaceDomainWithUrlHelper');
const replaceJavaScriptUrlsHelper = require('../../helpers/replaceJavaScriptUrlsHelper');
const replaceCssUrlsHelper = require('../../helpers/replaceCssUrlsHelper');
const replaceMetaTagsHelper = require('../../helpers/replaceMetaTagsHelper');
const replaceSrcsetHelper = require('../../helpers/replaceSrcsetHelper');

describe('Simple Integration Tests - No Ghost URLs Should Remain', () => {
  const sourceDomain = 'http://ghost.example.com:2368';
  const productionDomain = 'https://www.example.com';

  const verifyNoGhostUrls = (content, testName) => {
    // Check for any remaining ghost domain URLs
    const ghostUrlRegex = new RegExp(sourceDomain.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    const matches = content.match(ghostUrlRegex);

    if (matches) {
      console.error('FAILED: Found ghost URLs in ' + testName + ':', matches);
    }

    expect(matches).toBe(null);
    expect(content).toContain(productionDomain);
  };

  const fullTransformationPipeline = [
    replaceMetaTagsHelper,
    replaceSrcsetHelper,
    replaceJavaScriptUrlsHelper,
    replaceCssUrlsHelper,
    replaceDomainWithUrlHelper,
  ];

  it('should eliminate all Ghost URLs from a complete HTML page', () => {
    const htmlContent =
      '<!DOCTYPE html>' +
      '<html>' +
      '<head>' +
      '<link rel="canonical" href="' + sourceDomain + '/post/">' +
      '<meta property="og:url" content="' + sourceDomain + '/post/">' +
      '<meta name="twitter:url" content="' + sourceDomain + '/post/">' +
      '<link type="application/rss+xml" href="' + sourceDomain + '/rss/">' +
      '<style>.bg { background: url(\'' + sourceDomain + '/bg.jpg\'); }</style>' +
      '<script type="application/ld+json">{"url": "' + sourceDomain + '"}</script>' +
      '</head>' +
      '<body>' +
      '<img srcset="' + sourceDomain + '/img-400.jpg 400w, ' + sourceDomain + '/img-800.jpg 800w">' +
      '<script>var config = { api: "' + sourceDomain + '/api/" };</script>' +
      '</body>' +
      '</html>';

    const result = compose(...fullTransformationPipeline)(htmlContent);
    verifyNoGhostUrls(result, 'complete HTML page');
  });

  it('should eliminate all Ghost URLs from CSS content (produces root-relative paths)', () => {
    const cssContent =
      '@import "' + sourceDomain + '/fonts.css";' +
      '.header { background: url(\'' + sourceDomain + '/header.jpg\'); }' +
      '.logo { background: url(' + sourceDomain + '/logo.svg); }';

    const result = replaceCssUrlsHelper(cssContent);

    // CSS helper now strips SOURCE_DOMAIN → root-relative (no PRODUCTION_DOMAIN)
    const ghostUrlRegex = new RegExp(sourceDomain.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    expect(result.match(ghostUrlRegex)).toBe(null);
    expect(result).toContain('@import "/fonts.css"');
    expect(result).toContain("url('/header.jpg')");
    expect(result).toContain('url(/logo.svg)');
  });

  it('should eliminate all Ghost URLs from JavaScript content (produces root-relative paths)', () => {
    const jsContent =
      'var config = { url: "' + sourceDomain + '", api: \'' + sourceDomain + '/api/\' };' +
      'var imageUrl = "' + sourceDomain + '/image.jpg";' +
      '// Base URL: ' + sourceDomain;

    const result = replaceJavaScriptUrlsHelper(jsContent);

    // JS helper now strips SOURCE_DOMAIN → root-relative (no PRODUCTION_DOMAIN)
    const ghostUrlRegex = new RegExp(sourceDomain.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    expect(result.match(ghostUrlRegex)).toBe(null);
    expect(result).toContain("api: '/api/'");
    expect(result).toContain('var imageUrl = "/image.jpg"');
  });

  it('should handle problematic patterns that have caused issues', () => {
    const problematicContent =
      '<div data-url="' + sourceDomain + '">' +
      '<!-- Ghost site: ' + sourceDomain + ' -->' +
      '<script>window.ghostUrl = "' + sourceDomain + '";</script>' +
      '<img src="//' + sourceDomain.replace('http://', '') + '/image.jpg">' +
      '<LINK REL="canonical" HREF="' + sourceDomain + '/post/">' +
      '<a href="' + sourceDomain + '/search?q=test#results">Search</a>' +
      '</div>';

    const result = compose(...fullTransformationPipeline)(problematicContent);
    verifyNoGhostUrls(result, 'problematic patterns');
  });

  it('should handle repeated Ghost URLs efficiently', () => {
    // Create content with many repeated URLs
    const links = [];
    for (let i = 0; i < 100; i++) {
      links.push('<a href="' + sourceDomain + '/post-' + i + '/">Post ' + i + '</a>');
    }
    const repeatedContent = links.join('\n');

    const result = replaceDomainWithUrlHelper(repeatedContent);
    verifyNoGhostUrls(result, 'repeated URLs');

    // Should have 100 production domain URLs
    const productionMatches = result.match(new RegExp(productionDomain.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'));
    expect(productionMatches).toHaveLength(100);
  });

  it('should handle mixed content with all transformation types', () => {
    const mixedContent =
      '<html>' +
      '<head>' +
      '<link rel="canonical" href="' + sourceDomain + '/post/">' +
      '<style>.bg { background: url(\'' + sourceDomain + '/bg.jpg\'); }</style>' +
      '</head>' +
      '<body>' +
      '<img srcset="' + sourceDomain + '/img-400.jpg 400w">' +
      '<script>var config = { api: "' + sourceDomain + '/api/" };</script>' +
      '</body>' +
      '</html>';

    const result = compose(...fullTransformationPipeline)(mixedContent);
    verifyNoGhostUrls(result, 'mixed content types');

    // Verify specific transformations worked
    expect(result).toContain('href="' + productionDomain + '/post/"');
    expect(result).toContain('url(\'' + productionDomain + '/bg.jpg\')');
    expect(result).toContain('srcset="' + productionDomain + '/img-400.jpg 400w"');
    expect(result).toContain('api: "' + productionDomain + '/api/"');
  });

  it('should maintain content integrity while transforming URLs', () => {
    const originalContent =
      '<!DOCTYPE html>' +
      '<html lang="en">' +
      '<head><title>Test</title></head>' +
      '<body>' +
      '<h1>My Post</h1>' +
      '<a href="' + sourceDomain + '/other-post/">Link</a>' +
      '</body>' +
      '</html>';

    const result = compose(...fullTransformationPipeline)(originalContent);

    // Verify structure is maintained
    expect(result).toContain('<!DOCTYPE html>');
    expect(result).toContain('<html lang="en">');
    expect(result).toContain('<title>Test</title>');
    expect(result).toContain('<h1>My Post</h1>');

    // Verify transformation occurred
    verifyNoGhostUrls(result, 'content integrity');
  });

  it('should handle edge cases gracefully', () => {
    const edgeCases = [
      '', // empty string
      '<div></div>', // no URLs
      'http://external.com/path', // external URLs should be unchanged
      'Not a URL: ghost.example.com', // partial matches should not be transformed
    ];

    edgeCases.forEach((content, index) => {
      expect(() => {
        const result = compose(...fullTransformationPipeline)(content);
        expect(typeof result).toBe('string');

        // Only verify no ghost URLs if original contained ghost domain
        if (content.includes(sourceDomain)) {
          verifyNoGhostUrls(result, 'edge case ' + index);
        }
      }).not.toThrow();
    });
  });

  it('should verify the RSS/Atom feed fix from Phase 1', () => {
    const rssContent =
      '<link rel="alternate" type="application/rss+xml" href="' + sourceDomain + '/rss/">' +
      '<link rel="alternate" type="application/atom+xml" href="' + sourceDomain + '/atom.xml">';

    const result = replaceMetaTagsHelper(rssContent);

    // This specific issue was fixed in Phase 1
    expect(result).not.toContain(sourceDomain);
    expect(result).toContain('href="' + productionDomain + '/rss/"');
    expect(result).toContain('href="' + productionDomain + '/atom.xml"');
  });

  it('should handle protocol-relative URLs correctly', () => {
    const protocolRelativeContent =
      '<link rel="canonical" href="' + sourceDomain + '/post/">' +
      '<img src="//' + sourceDomain.replace('http://', '') + '/image.jpg">';

    // Apply full transformation pipeline to handle both regular and protocol-relative URLs
    const result = compose(...fullTransformationPipeline)(protocolRelativeContent);

    expect(result).toContain('href="' + productionDomain + '/post/"');

    // After full transformation, the protocol-relative should be either:
    // 1. Converted to production domain protocol-relative, OR
    // 2. Converted to full production domain URL
    const hasProtocolRelative = result.includes('//' + productionDomain.replace('https://', '') + '/image.jpg');
    const hasFullUrl = result.includes(productionDomain + '/image.jpg');

    expect(hasProtocolRelative || hasFullUrl).toBe(true);

    // Most importantly, verify no ghost URLs remain
    verifyNoGhostUrls(result, 'protocol-relative URLs');
  });
});