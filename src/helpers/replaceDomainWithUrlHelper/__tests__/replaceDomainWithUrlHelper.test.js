/* eslint-disable max-len */
const replaceDomainWithUrlHelper = require('../replaceDomainWithUrlHelper');

// Mock OPTIONS
jest.mock('../../../constants/OPTIONS', () => ({
  SOURCE_DOMAIN: 'http://ghost.example.com:2368',
  PRODUCTION_DOMAIN: 'https://www.example.com',
  ALT_DOMAINS: [],
}));

// Mock yargs
jest.mock('yargs', () => ({
  argv: {},
}));

describe('replaceDomainWithUrlHelper', () => {
  const sourceDomain = 'http://ghost.example.com:2368';
  const productionDomain = 'https://www.example.com';

  it('should replace `src="http://abc.com"` with `src="https://www.myOtherSite.com"`', () => {
    const expected = replaceDomainWithUrlHelper(
      'src="http://abc.com"',
      'http://abc.com',
      'https://www.myOtherSite.com',
    );
    const result = 'src="https://www.myOtherSite.com"';
    expect(expected).toEqual(result);
  });

  it('should with with null`', () => {
    const expected = replaceDomainWithUrlHelper(
      null,
      'http://abc.com',
      'https://www.myOtherSite.com',
    );
    const result = 'null';
    expect(expected).toEqual(result);
  });

  it('should replace exact domain matches', () => {
    const input = `<a href="${sourceDomain}/post">Link</a>`;
    const expected = `<a href="${productionDomain}/post">Link</a>`;

    const result = replaceDomainWithUrlHelper(input, sourceDomain, productionDomain);
    expect(result).toBe(expected);
  });

  it('should replace protocol-relative URLs', () => {
    const input = '<a href="//ghost.example.com:2368/post">Link</a>';
    const expected = '<a href="//www.example.com/post">Link</a>';

    const result = replaceDomainWithUrlHelper(input, sourceDomain, productionDomain);
    expect(result).toBe(expected);
  });

  it('should handle different protocols', () => {
    const input = `
      <a href="http://ghost.example.com:2368/post1">Link1</a>
      <a href="https://ghost.example.com:2368/post2">Link2</a>
    `;
    const expected = `
      <a href="${productionDomain}/post1">Link1</a>
      <a href="${productionDomain}/post2">Link2</a>
    `;

    const result = replaceDomainWithUrlHelper(input, sourceDomain, productionDomain);
    expect(result).toBe(expected);
  });

  it('should handle case-insensitive replacements', () => {
    const input = '<a href="HTTP://GHOST.EXAMPLE.COM:2368/post">Link</a>';
    const expected = `<a href="${productionDomain}/post">Link</a>`;

    const result = replaceDomainWithUrlHelper(input, sourceDomain, productionDomain);
    expect(result).toBe(expected);
  });

  it('should escape special regex characters in domains', () => {
    const specialDomain = 'http://ghost.example.com:2368';
    const input = `<a href="${specialDomain}/post">Link</a>`;
    const expected = `<a href="${productionDomain}/post">Link</a>`;

    const result = replaceDomainWithUrlHelper(input, specialDomain, productionDomain);
    expect(result).toBe(expected);
  });

  it('should handle multiple occurrences', () => {
    const input = `
      <a href="${sourceDomain}/post1">Link1</a>
      <img src="${sourceDomain}/image.jpg" />
      <link rel="canonical" href="${sourceDomain}/post1" />
    `;
    const expected = `
      <a href="${productionDomain}/post1">Link1</a>
      <img src="${productionDomain}/image.jpg" />
      <link rel="canonical" href="${productionDomain}/post1" />
    `;

    const result = replaceDomainWithUrlHelper(input, sourceDomain, productionDomain);
    expect(result).toBe(expected);
  });

  it('should not replace partial domain matches', () => {
    const input = '<a href="https://notghost.example.com/post">Link</a>';
    const expected = '<a href="https://notghost.example.com/post">Link</a>';

    const result = replaceDomainWithUrlHelper(input, sourceDomain, productionDomain);
    expect(result).toBe(expected);
  });
});
