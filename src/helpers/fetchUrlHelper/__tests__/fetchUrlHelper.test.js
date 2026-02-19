const path = require('path');
const fetchUrlHelper = require('../fetchUrlHelper');
const crawlPageHelper = require('../../crawlPageHelper');

jest.mock('../../crawlPageHelper');
jest.mock('../../../constants/OPTIONS', () => ({
  SOURCE_DOMAIN: 'https://localhost:2368',
  STATIC_DIRECTORY: 'static',
}));

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
});
