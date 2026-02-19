/* eslint-disable max-len */
const fs = require('fs');
const replaceDomainNameHelper = require('../replaceDomainNameHelper');

jest.mock('path', () => ({
  join: (...args) => args.join(''),
  resolve: (...args) => args.join(''),
  relative: (...args) => args.join(''),
  dirname: (p) => p.split('/').slice(0, -1).join('/') || '/',
  extname: (p) => { const i = p.lastIndexOf('.'); return i < 0 ? '' : p.slice(i); },
}));

jest.mock('fs');

jest.mock('yargs/yargs', () => () => ({
  argv: {
    url: 'https://localhost:2742',
    domain: 'https://localhost:2742',
    subDir: __dirname,
  },
}));

describe('replaceDomainNameHelper', () => {
  const MOCK_FILE_INFO = {
    '/static/protocolRelativeUrls.html': {
      contents: 'src="//localhost:2742/content/someImage.jpg"',
    },
    '/static/http.html': {
      contents: 'src="http://localhost:2742/content/someImage.jpg"',
    },
    '/static/https.html': {
      contents: 'src="https://localhost:2742/content/someImage.jpg"',
    },
    '/static/script.js': {
      contents: 'const url = "https://localhost:2742/api/endpoint";',
    },
    '/static/styles.css': {
      contents: '.bg { background-image: url(https://localhost:2742/content/images/bg.jpg); }',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    fs.setMockFiles(MOCK_FILE_INFO);
  });

  it('should replace `src="//localhost:2742/content/someImage.jpg"` with `src="./content/someImage.jpg"` for protocolRelativeUrls', () => {
    const fileHandler = replaceDomainNameHelper(
      '/static/',
      'http://www.anothersite.com',
    );

    fileHandler('protocolRelativeUrls.html');

    expect(fs.writeFileSync)
      .toHaveBeenCalledWith(
        '/static/protocolRelativeUrls.html',
        'src="./content/someImage.jpg"',
      );
  });

  it('should replace `src="https://localhost:2742/content/someImage.jpg"` with `src="./content/someImage.jpg"` for protocolRelativeUrls', () => {
    const fileHandler = replaceDomainNameHelper(
      '/static/',
      'https://www.anothersite.com',
    );

    fileHandler('https.html');

    expect(fs.writeFileSync)
      .toHaveBeenCalledWith(
        '/static/https.html',
        'src="./content/someImage.jpg"',
      );
  });

  it('should process .js files and call writeFileSync', () => {
    const fileHandler = replaceDomainNameHelper(
      '/static/',
      'https://www.anothersite.com',
    );

    fileHandler('script.js');

    expect(fs.writeFileSync)
      .toHaveBeenCalledWith('/static/script.js', expect.any(String));
  });

  it('should process .css files and call writeFileSync', () => {
    const fileHandler = replaceDomainNameHelper(
      '/static/',
      'https://www.anothersite.com',
    );

    fileHandler('styles.css');

    expect(fs.writeFileSync)
      .toHaveBeenCalledWith('/static/styles.css', expect.any(String));
  });
});
