jest.mock('fs', () => ({
  readdirSync: jest.fn(),
  lstatSync: jest.fn(),
}));

jest.mock('../../crawlPageAsyncHelper', () => jest.fn());

jest.mock('../../../constants/OPTIONS', () => {
  const path = require('path');
  return {
    STATIC_DIRECTORY: 'static',
    ABSOLUTE_STATIC_DIRECTORY: path.resolve(process.cwd(), 'static'),
    SOURCE_DOMAIN: 'http://localhost:2368',
  };
});

const path = require('path');
const fs = require('fs');
const crawlPageAsyncHelper = require('../../crawlPageAsyncHelper');
const responsiveImagesHelper = require('../responsiveImagesHelper');

describe('responsiveImagesHelper', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should call crawlPageAsyncHelper for each image and its size variants', () => {
    const contentPath = path.resolve(process.cwd(), 'static/content');

    fs.readdirSync.mockReturnValue(['photo.jpg']);
    fs.lstatSync.mockReturnValue({ isDirectory: () => false });

    responsiveImagesHelper();

    // One original + 5 size variants = 6 calls
    expect(crawlPageAsyncHelper).toHaveBeenCalledTimes(6);
  });

  it('should not add size variants for already-sized images to prevent double-sizing', () => {
    // Set up nested directory: content/images/size/w300/photo.jpg
    // When computing imageSizeUrl, it would produce w100/...w300 which matches the skip pattern
    fs.readdirSync
      .mockReturnValueOnce(['images'])
      .mockReturnValueOnce(['size'])
      .mockReturnValueOnce(['w300'])
      .mockReturnValueOnce(['photo.jpg']);

    fs.lstatSync
      .mockReturnValueOnce({ isDirectory: () => true })   // images/ is a dir
      .mockReturnValueOnce({ isDirectory: () => true })   // size/ is a dir
      .mockReturnValueOnce({ isDirectory: () => true })   // w300/ is a dir
      .mockReturnValueOnce({ isDirectory: () => false }); // photo.jpg is a file

    responsiveImagesHelper();

    // Only the original file path should be crawled — all 5 size variants are skipped
    // because they would produce a double-size path like w100/size/w300/photo.jpg
    expect(crawlPageAsyncHelper).toHaveBeenCalledTimes(1);
  });

  it('should recurse into subdirectories', () => {
    fs.readdirSync
      .mockReturnValueOnce(['subdir'])
      .mockReturnValueOnce(['photo.jpg']);

    fs.lstatSync
      .mockReturnValueOnce({ isDirectory: () => true })
      .mockReturnValueOnce({ isDirectory: () => false });

    responsiveImagesHelper();

    expect(fs.readdirSync).toHaveBeenCalledTimes(2);
    expect(crawlPageAsyncHelper).toHaveBeenCalled();
  });

  it('should replace ABSOLUTE_STATIC_DIRECTORY with SOURCE_DOMAIN in URLs', () => {
    fs.readdirSync.mockReturnValue(['photo.jpg']);
    fs.lstatSync.mockReturnValue({ isDirectory: () => false });

    responsiveImagesHelper();

    const calledUrls = crawlPageAsyncHelper.mock.calls.map(call => call[0]);
    calledUrls.forEach((url) => {
      expect(url).toContain('http://localhost:2368');
    });
  });
});
