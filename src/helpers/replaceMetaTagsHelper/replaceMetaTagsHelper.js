const OPTIONS = require('../../constants/OPTIONS');

/**
 * Replaces URLs in HTML meta tags, canonical links, and structured data.
 * Handles Open Graph, Twitter Card, canonical URLs, and JSON-LD structured data.
 */
const replaceMetaTagsHelper = (output) => {
  if (!output || typeof output !== 'string') {
    return output;
  }

  const sourceDomain = OPTIONS.SOURCE_DOMAIN;
  const productionDomain = OPTIONS.PRODUCTION_DOMAIN;
  const sourceDomainWithoutProtocol = sourceDomain.replace(/^https?:\/\//, '');
  const productionDomainWithoutProtocol = productionDomain.replace(/^https?:\/\//, '');

  let result = output;

  // Replace canonical URLs
  result = result.replace(
    new RegExp(`(<link[^>]+rel=["']canonical["'][^>]+href=["'])(.*?)(${escapeRegex(sourceDomain)})(.*?)(["'][^>]*>)`, 'gi'),
    `$1$2${productionDomain}$4$5`
  );

  // Replace Open Graph URLs (og:url, og:image, etc.)
  result = result.replace(
    new RegExp(`(<meta[^>]+property=["']og:[^"']*["'][^>]+content=["'])(.*?)(${escapeRegex(sourceDomain)})(.*?)(["'][^>]*>)`, 'gi'),
    `$1$2${productionDomain}$4$5`
  );

  // Replace Twitter Card URLs
  result = result.replace(
    new RegExp(`(<meta[^>]+name=["']twitter:[^"']*["'][^>]+content=["'])(.*?)(${escapeRegex(sourceDomain)})(.*?)(["'][^>]*>)`, 'gi'),
    `$1$2${productionDomain}$4$5`
  );

  // Replace other meta tag URLs (description, etc. that might contain URLs)
  result = result.replace(
    new RegExp(`(<meta[^>]+content=["'][^"']*)(${escapeRegex(sourceDomain)})([^"']*["'][^>]*>)`, 'gi'),
    `$1${productionDomain}$3`
  );

  // Replace JSON-LD structured data URLs
  result = result.replace(
    new RegExp(`(<script[^>]*type=["']application/ld\\+json["'][^>]*>[^<]*)(${escapeRegex(sourceDomain)})([^<]*</script>)`, 'gi'),
    `$1${productionDomain}$3`
  );

  // Replace protocol-relative URLs in meta tags (only those that actually start with //)
  result = result.replace(
    new RegExp(`(<(?:meta|link)[^>]+(?:content|href)=["'])(//${escapeRegex(sourceDomainWithoutProtocol)})([^"']*["'][^>]*>)`, 'gi'),
    `$1//${productionDomainWithoutProtocol}$3`
  );

  // Replace RSS/Atom feed links
  result = result.replace(
    new RegExp(`(<link[^>]+type=["']application/(?:rss|atom)\\+xml["'][^>]+href=["'])(.*?)(${escapeRegex(sourceDomain)})(.*?)(["'][^>]*>)`, 'gi'),
    `$1$2${productionDomain}$4$5`
  );

  return result;
};

/**
 * Escapes special regex characters in a string
 */
function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

module.exports = replaceMetaTagsHelper;