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
    /(srcset)=(["'])([^"']+)\2/gi,
    (match, attr, quote, srcsetValue) => {
      const updatedSrcset = srcsetValue
        .replace(new RegExp(escapeRegex(sourceDomain), 'gi'), productionDomain)
        .replace(new RegExp(`//${escapeRegex(sourceDomainWithoutProtocol)}`, 'gi'), `//${productionDomainWithoutProtocol}`);
      return `${attr}=${quote}${updatedSrcset}${quote}`;
    }
  );

  // Also handle data-srcset for lazy loading
  result = result.replace(
    /(data-srcset)=(["'])([^"']+)\2/gi,
    (match, attr, quote, srcsetValue) => {
      const updatedSrcset = srcsetValue
        .replace(new RegExp(escapeRegex(sourceDomain), 'gi'), productionDomain)
        .replace(new RegExp(`//${escapeRegex(sourceDomainWithoutProtocol)}`, 'gi'), `//${productionDomainWithoutProtocol}`);
      return `${attr}=${quote}${updatedSrcset}${quote}`;
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