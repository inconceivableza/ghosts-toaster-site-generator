const OPTIONS = require('../../constants/OPTIONS');

/**
 * Strips SOURCE_DOMAIN from JavaScript content to produce root-relative URLs.
 * Handles various JavaScript URL patterns including strings, template literals,
 * object properties, and comments.
 */
const replaceJavaScriptUrlsHelper = (output) => {
  if (!output || typeof output !== 'string') {
    return output;
  }

  const sourceDomain = OPTIONS.SOURCE_DOMAIN;
  const sourceDomainWithoutProtocol = sourceDomain.replace(/^https?:\/\//, '');

  let result = output;

  // Strip URLs in string literals (single and double quotes)
  result = result.replace(
    new RegExp(`(['"])(.*?)\\1`, 'g'),
    (match, quote, content) => {
      if (!content.includes(sourceDomain)) return match;
      return `${quote}${content.replace(new RegExp(escapeRegex(sourceDomain), 'g'), '')}${quote}`;
    }
  );

  // Strip URLs in template literals
  result = result.replace(
    new RegExp(`(\`)(.*?)(${escapeRegex(sourceDomain)})(.*?)\``, 'g'),
    `$1$2$4\``
  );

  // Strip protocol-relative URLs in strings
  result = result.replace(
    new RegExp(`(['"])([^'"]*?)(//${escapeRegex(sourceDomainWithoutProtocol)})([^'"]*?)\\1`, 'g'),
    `$1$2$4$1`
  );

  // Strip URLs in JavaScript object properties
  result = result.replace(
    new RegExp(`(url|href|src)\\s*:\\s*(['"])(.*?)(${escapeRegex(sourceDomain)})(.*?)\\2`, 'g'),
    `$1: $2$3$5$2`
  );

  // Strip URLs in JavaScript single-line comments
  // The path after the domain is preserved (not part of the match)
  result = result.replace(
    new RegExp(`(//.*?)(${escapeRegex(sourceDomain)})`, 'g'),
    `$1`
  );

  // Strip URLs in JavaScript multi-line comments
  result = result.replace(
    new RegExp(`(/\\*.*?)(${escapeRegex(sourceDomain)})(.*?\\*/)`, 'gs'),
    `$1$3`
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
