const path = require('path');
const fetchUrlHelper = require('../fetchUrlHelper');
const crawlPageHelper = require('../../crawlPageHelper');

jest.mock('../../crawlPageHelper');
jest.mock('../../../constants/OPTIONS', () => ({
  SOURCE_DOMAIN: 'https://localhost:2368',
  STATIC_DIRECTORY: 'static',
}));
jest.mock('fs', () => ({
  readFileSync: jest.fn(),
}));

const fs = require('fs');

describe('fetchUrlHelper', () => {
  const pathResolveSpy = jest.spyOn(path, 'resolve');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should pass url to crawlPageHelper', () => {
    const mockUrl = 'https://localhost:2368';

    fetchUrlHelper(mockUrl);

    expect(crawlPageHelper)
      .toHaveBeenCalledWith(mockUrl);
  });

  it('should strip https domains from the url', () => {
    const mockUrl = 'https://localhost:2368/sitemap.xml';

    fetchUrlHelper(mockUrl);

    expect(pathResolveSpy)
      .toHaveBeenCalledWith(
        process.cwd(),
        'static/sitemap.xml',
      );
  });

  it('should crawl source map URLs for .js files', () => {
    const mockUrl = 'https://localhost:2368/app.js';

    fetchUrlHelper(mockUrl);

    expect(crawlPageHelper).toHaveBeenCalledWith('https://localhost:2368/app.js');
    expect(crawlPageHelper).toHaveBeenCalledWith('https://localhost:2368/app.map.js');
    expect(crawlPageHelper).toHaveBeenCalledWith('https://localhost:2368/app.js.map');
    expect(crawlPageHelper).toHaveBeenCalledTimes(3);
  });

  it('should parse sitemapindex XML and crawl each sitemap URL', () => {
    const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>https://localhost:2368/sitemap-pages.xml</loc>
  </sitemap>
  <sitemap>
    <loc>https://localhost:2368/sitemap-posts.xml</loc>
  </sitemap>
</sitemapindex>`;

    // Only return the XML for the first call; recursive calls get an error so they stop
    fs.readFileSync
      .mockReturnValueOnce(sitemapXml)
      .mockImplementation(() => { throw new Error('File not found'); });

    fetchUrlHelper('https://localhost:2368/sitemap.xml');

    // crawlPageHelper called for the main sitemap.xml plus each found URL
    expect(crawlPageHelper).toHaveBeenCalledWith('https://localhost:2368/sitemap.xml');
    expect(crawlPageHelper).toHaveBeenCalledWith('https://localhost:2368/sitemap-pages.xml');
    expect(crawlPageHelper).toHaveBeenCalledWith('https://localhost:2368/sitemap-posts.xml');
  });

  it('should skip sitemap entries without a loc element', () => {
    const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc></loc>
  </sitemap>
  <sitemap>
    <loc>https://localhost:2368/sitemap-pages.xml</loc>
  </sitemap>
</sitemapindex>`;

    fs.readFileSync
      .mockReturnValueOnce(sitemapXml)
      .mockImplementation(() => { throw new Error('File not found'); });

    fetchUrlHelper('https://localhost:2368/sitemap.xml');

    // crawlPageHelper called only for main sitemap.xml and sitemap-pages.xml
    // (empty <loc> is skipped)
    expect(crawlPageHelper).toHaveBeenCalledWith('https://localhost:2368/sitemap.xml');
    expect(crawlPageHelper).toHaveBeenCalledWith('https://localhost:2368/sitemap-pages.xml');
    expect(crawlPageHelper).toHaveBeenCalledTimes(2);
  });

  it('should parse urlset XML and crawl each page URL', () => {
    const urlsetXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://localhost:2368/post-one/</loc>
  </url>
  <url>
    <loc>https://localhost:2368/post-two/</loc>
  </url>
</urlset>`;

    // Only return the XML for the first call; non-.xml URLs don't trigger recursion
    fs.readFileSync.mockReturnValueOnce(urlsetXml);

    fetchUrlHelper('https://localhost:2368/sitemap-posts.xml');

    expect(crawlPageHelper).toHaveBeenCalledWith('https://localhost:2368/sitemap-posts.xml');
    expect(crawlPageHelper).toHaveBeenCalledWith('https://localhost:2368/post-one/');
    expect(crawlPageHelper).toHaveBeenCalledWith('https://localhost:2368/post-two/');
  });
});
