const OPTIONS = require('../../constants/OPTIONS');

/**
 * Strips SOURCE_DOMAIN from srcset/data-srcset attributes to produce root-relative URLs.
 * Handles complex srcset syntax with multiple URLs and descriptors.
 */
const replaceSrcsetHelper = (output) => {
  if (!output || typeof output !== 'string') {
    return output;
  }

  const sourceDomain = OPTIONS.SOURCE_DOMAIN;
  const sourceDomainWithoutProtocol = sourceDomain.replace(/^https?:\/\//, '');

  let result = output;

  // Replace URLs in srcset attributes
  // Matches: srcset="url1 1x, url2 2x, url3 480w, url4 800w"
  result = result.replace(
    /(srcset)=(["'])([^"']+)\2/gi,
    (match, attr, quote, srcsetValue) => {
      const updatedSrcset = srcsetValue
        .replace(new RegExp(escapeRegex(sourceDomain), 'gi'), '')
        .replace(new RegExp(`//${escapeRegex(sourceDomainWithoutProtocol)}`, 'gi'), '');
      return `${attr}=${quote}${updatedSrcset}${quote}`;
    }
  );

  // Also handle data-srcset for lazy loading
  result = result.replace(
    /(data-srcset)=(["'])([^"']+)\2/gi,
    (match, attr, quote, srcsetValue) => {
      const updatedSrcset = srcsetValue
        .replace(new RegExp(escapeRegex(sourceDomain), 'gi'), '')
        .replace(new RegExp(`//${escapeRegex(sourceDomainWithoutProtocol)}`, 'gi'), '');
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
