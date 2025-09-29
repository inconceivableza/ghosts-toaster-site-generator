const OPTIONS = require('../../constants/OPTIONS');

/**
 * Replaces URLs in JavaScript content including variables, strings, and comments.
 * Handles various JavaScript URL patterns that might contain Ghost domain references.
 */
const replaceJavaScriptUrlsHelper = (output) => {
  if (!output || typeof output !== 'string') {
    return output;
  }

  const sourceDomain = OPTIONS.SOURCE_DOMAIN;
  const productionDomain = OPTIONS.PRODUCTION_DOMAIN;
  const sourceDomainWithoutProtocol = sourceDomain.replace(/^https?:\/\//, '');
  const productionDomainWithoutProtocol = productionDomain.replace(/^https?:\/\//, '');

  let result = output;

  // Replace URLs in string literals (single and double quotes)
  result = result.replace(
    new RegExp(`(['"])(.*?)(${escapeRegex(sourceDomain)})(.*?)\\1`, 'g'),
    `$1$2${productionDomain}$4$1`
  );

  // Replace URLs in template literals
  result = result.replace(
    new RegExp(`(\`)(.*?)(${escapeRegex(sourceDomain)})(.*?)\``, 'g'),
    `$1$2${productionDomain}$4\``
  );

  // Replace protocol-relative URLs in strings
  result = result.replace(
    new RegExp(`(['"])([^'"]*?)(//${escapeRegex(sourceDomainWithoutProtocol)})([^'"]*?)\\1`, 'g'),
    `$1$2//${productionDomainWithoutProtocol}$4$1`
  );

  // Replace URLs in JavaScript object properties
  result = result.replace(
    new RegExp(`(url|href|src)\\s*:\\s*(['"])(.*?)(${escapeRegex(sourceDomain)})(.*?)\\2`, 'g'),
    `$1: $2$3${productionDomain}$5$2`
  );

  // Replace URLs in JavaScript comments
  result = result.replace(
    new RegExp(`(//.*?)(${escapeRegex(sourceDomain)})`, 'g'),
    `$1${productionDomain}`
  );

  result = result.replace(
    new RegExp(`(/\\*.*?)(${escapeRegex(sourceDomain)})(.*?\\*/)`, 'gs'),
    `$1${productionDomain}$3`
  );

  return result;
};

/**
 * Escapes special regex characters in a string
 */
function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

module.exports = replaceJavaScriptUrlsHelper;