const OPTIONS = require('../../constants/OPTIONS');

/**
 * Strips SOURCE_DOMAIN and ALT_DOMAINS from URLs to produce root-relative paths.
 * XML files are excluded (sitemaps require absolute URLs).
 * Must run after content-type helpers (replaceSrcset, replaceMeta, etc.) so that
 * canonical/OG meta tags have already been set to PRODUCTION_DOMAIN.
 *
 * @param {string} file - the file name being processed
 * @returns {function(string): string} - transform function
 */
const makeUrlsRelativeHelper = (file) => (output) => {
  if (!output || typeof output !== 'string') return output;
  if (file && file.includes('.xml')) return output;

  const { SOURCE_DOMAIN, ALT_DOMAINS } = OPTIONS;
  const domains = [SOURCE_DOMAIN, ...ALT_DOMAINS];

  let result = output;
  for (const domain of domains) {
    if (!domain) continue;
    const domainWithoutProtocol = domain.replace(/^https?:\/\//, '');
    const escapedWithoutProtocol = escapeRegex(domainWithoutProtocol);
    // Strip https?://domain (any protocol variant) → leaves /path, or / if no path follows
    // Must run before the //domain strip to avoid leaving a dangling "https:" or "http:"
    result = result.replace(new RegExp(`https?://${escapedWithoutProtocol}`, 'gi'), (match, offset, string) => {
      return string[offset + match.length] === '/' ? '' : '/';
    });
    // Strip //domain (protocol-relative URLs) → leaves /path, or / if no path follows
    result = result.replace(new RegExp(`//${escapedWithoutProtocol}`, 'gi'), (match, offset, string) => {
      return string[offset + match.length] === '/' ? '' : '/';
    });
  }

  return result;
};

function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

module.exports = makeUrlsRelativeHelper;
