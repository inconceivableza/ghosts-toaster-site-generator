const OPTIONS = require('../../constants/OPTIONS');

/**
 * Replaces URLs in CSS content including url() functions and @import statements.
 * Handles various CSS URL patterns that might contain Ghost domain references.
 */
const replaceCssUrlsHelper = (output) => {
  if (!output || typeof output !== 'string') {
    return output;
  }

  const sourceDomain = OPTIONS.SOURCE_DOMAIN;
  const productionDomain = OPTIONS.PRODUCTION_DOMAIN;
  const sourceDomainWithoutProtocol = sourceDomain.replace(/^https?:\/\//, '');
  const productionDomainWithoutProtocol = productionDomain.replace(/^https?:\/\//, '');

  let result = output;

  // Replace URLs in url() functions - handles single quotes, double quotes, and no quotes
  result = result.replace(
    new RegExp(`url\\(\\s*(['"]?)(.*?)(${escapeRegex(sourceDomain)})(.*?)\\1\\s*\\)`, 'gi'),
    `url($1$2${productionDomain}$4$1)`
  );

  // Replace protocol-relative URLs in url() functions
  result = result.replace(
    new RegExp(`url\\(\\s*(['"]?)([^'"]*?)(//${escapeRegex(sourceDomainWithoutProtocol)})([^'"]*?)\\1\\s*\\)`, 'gi'),
    `url($1$2//${productionDomainWithoutProtocol}$4$1)`
  );

  // Replace URLs in @import statements
  result = result.replace(
    new RegExp(`@import\\s+(['"])(.*?)(${escapeRegex(sourceDomain)})(.*?)\\1`, 'gi'),
    `@import $1$2${productionDomain}$4$1`
  );

  result = result.replace(
    new RegExp(`@import\\s+url\\(\\s*(['"]?)(.*?)(${escapeRegex(sourceDomain)})(.*?)\\1\\s*\\)`, 'gi'),
    `@import url($1$2${productionDomain}$4$1)`
  );

  // Replace protocol-relative URLs in @import statements
  result = result.replace(
    new RegExp(`@import\\s+(['"])([^'"]*?)(//${escapeRegex(sourceDomainWithoutProtocol)})([^'"]*?)\\1`, 'gi'),
    `@import $1$2//${productionDomainWithoutProtocol}$4$1`
  );

  return result;
};

/**
 * Escapes special regex characters in a string
 */
function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

module.exports = replaceCssUrlsHelper;