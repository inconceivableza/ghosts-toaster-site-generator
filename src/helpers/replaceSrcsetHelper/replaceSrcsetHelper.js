const OPTIONS = require('../../constants/OPTIONS');

/**
 * Replaces URLs in srcset attributes for responsive images.
 * Handles complex srcset syntax with multiple URLs and descriptors.
 */
const replaceSrcsetHelper = (output) => {
  if (!output || typeof output !== 'string') {
    return output;
  }

  const sourceDomain = OPTIONS.SOURCE_DOMAIN;
  const productionDomain = OPTIONS.PRODUCTION_DOMAIN;
  const sourceDomainWithoutProtocol = sourceDomain.replace(/^https?:\/\//, '');
  const productionDomainWithoutProtocol = productionDomain.replace(/^https?:\/\//, '');

  let result = output;

  // Replace URLs in srcset attributes
  // Matches: srcset="url1 1x, url2 2x, url3 480w, url4 800w"
  result = result.replace(
    /srcset=["']([^"']+)["']/gi,
    (match, srcsetValue) => {
      // Split srcset value by commas to handle multiple sources
      const updatedSrcset = srcsetValue
        .split(',')
        .map(source => {
          let trimmedSource = source.trim();

          // Replace full domain URLs
          trimmedSource = trimmedSource.replace(
            new RegExp(escapeRegex(sourceDomain), 'gi'),
            productionDomain
          );

          // Replace protocol-relative URLs
          trimmedSource = trimmedSource.replace(
            new RegExp(`//${escapeRegex(sourceDomainWithoutProtocol)}`, 'gi'),
            `//${productionDomainWithoutProtocol}`
          );

          return trimmedSource;
        })
        .join(', ');

      return `srcset="${updatedSrcset}"`;
    }
  );

  // Also handle data-srcset for lazy loading
  result = result.replace(
    /data-srcset=["']([^"']+)["']/gi,
    (match, srcsetValue) => {
      const updatedSrcset = srcsetValue
        .split(',')
        .map(source => {
          let trimmedSource = source.trim();

          trimmedSource = trimmedSource.replace(
            new RegExp(escapeRegex(sourceDomain), 'gi'),
            productionDomain
          );

          trimmedSource = trimmedSource.replace(
            new RegExp(`//${escapeRegex(sourceDomainWithoutProtocol)}`, 'gi'),
            `//${productionDomainWithoutProtocol}`
          );

          return trimmedSource;
        })
        .join(', ');

      return `data-srcset="${updatedSrcset}"`;
    }
  );

  return result;
};

/**
 * Escapes special regex characters in a string
 */
function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

module.exports = replaceSrcsetHelper;