const { argv } = require('yargs');
const OPTIONS = require('../../constants/OPTIONS');

/**
 * This function replaces all the urls with the replacement url specified with
 * the --url flag. Enhanced to handle protocol-relative URLs, different protocols,
 * and escaped characters.
 */
const replaceDomainWithUrlHelper = (
  output,
  domain = OPTIONS.SOURCE_DOMAIN,
  url = OPTIONS.PRODUCTION_DOMAIN,
) => {
  // Some users may want to host files under a sub directory
  const { subDir } = argv;
  const targetUrl = subDir ? `${url}/${subDir}` : url;

  // Extract domain without protocol for more flexible matching
  const sourceDomainWithoutProtocol = domain.replace(/^https?:\/\//, '');
  const targetDomainWithoutProtocol = targetUrl.replace(/^https?:\/\//, '');

  let result = `${output}`;

  // Replace exact domain matches (with protocol)
  result = result.replace(new RegExp(escapeRegex(domain), 'gi'), targetUrl);

  // Replace protocol-relative URLs (//domain)
  result = result.replace(
    new RegExp(`//${escapeRegex(sourceDomainWithoutProtocol)}`, 'gi'),
    `//${targetDomainWithoutProtocol}`
  );

  // Replace domain in various contexts (with and without protocols)
  const domainVariations = [
    `https://${sourceDomainWithoutProtocol}`,
    `http://${sourceDomainWithoutProtocol}`,
    sourceDomainWithoutProtocol
  ];

  domainVariations.forEach(variation => {
    if (variation !== domain) { // Avoid double replacement
      result = result.replace(new RegExp(escapeRegex(variation), 'gi'), targetUrl);
    }
  });

  // Replace any alt-domain references with the production URL, using the same
  // protocol/bare-domain variations as above.
  OPTIONS.ALT_DOMAINS.forEach(altDomain => {
    const altWithoutProtocol = altDomain.replace(/^https?:\/\//, '');

    result = result.replace(new RegExp(escapeRegex(altDomain), 'gi'), targetUrl);
    result = result.replace(
      new RegExp(`//${escapeRegex(altWithoutProtocol)}`, 'gi'),
      `//${targetDomainWithoutProtocol}`
    );
    [`https://${altWithoutProtocol}`, `http://${altWithoutProtocol}`, altWithoutProtocol].forEach(variation => {
      if (variation !== altDomain) {
        result = result.replace(new RegExp(escapeRegex(variation), 'gi'), targetUrl);
      }
    });
  });

  return result;
};

/**
 * Escapes special regex characters in a string
 */
function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

module.exports = replaceDomainWithUrlHelper;
