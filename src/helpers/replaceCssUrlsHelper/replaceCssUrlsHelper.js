const OPTIONS = require('../../constants/OPTIONS');

/**
 * Strips SOURCE_DOMAIN from CSS content to produce root-relative URLs.
 * Handles url() functions and @import statements.
 */
const replaceCssUrlsHelper = (output) => {
  if (!output || typeof output !== 'string') {
    return output;
  }

  const sourceDomain = OPTIONS.SOURCE_DOMAIN;
  const sourceDomainWithoutProtocol = sourceDomain.replace(/^https?:\/\//, '');

  let result = output;

  // Strip URLs in url() functions - handles single quotes, double quotes, and no quotes
  result = result.replace(
    new RegExp(`(url)\\(\\s*(['"]?)(.*?)(${escapeRegex(sourceDomain)})(.*?)\\2\\s*\\)`, 'gi'),
    `$1($2$3$5$2)`
  );

  // Strip protocol-relative URLs in url() functions
  result = result.replace(
    new RegExp(`(url)\\(\\s*(['"]?)([^'"]*?)(//${escapeRegex(sourceDomainWithoutProtocol)})([^'"]*?)\\2\\s*\\)`, 'gi'),
    `$1($2$3$5$2)`
  );

  // Strip URLs in @import statements
  result = result.replace(
    new RegExp(`(@import)\\s+(['"])(.*?)(${escapeRegex(sourceDomain)})(.*?)\\2`, 'gi'),
    `$1 $2$3$5$2`
  );

  result = result.replace(
    new RegExp(`(@import)\\s+(url)\\(\\s*(['"]?)(.*?)(${escapeRegex(sourceDomain)})(.*?)\\3\\s*\\)`, 'gi'),
    `$1 $2($3$4$6$3)`
  );

  // Strip protocol-relative URLs in @import statements
  result = result.replace(
    new RegExp(`(@import)\\s+(['"])([^'"]*?)(//${escapeRegex(sourceDomainWithoutProtocol)})([^'"]*?)\\2`, 'gi'),
    `$1 $2$3$5$2`
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
