jest.mock('fs', () => ({
  readdirSync: jest.fn(),
  lstatSync: jest.fn(),
  existsSync: jest.fn().mockReturnValue(false),
}));

jest.mock('../../crawlPageHelper', () => jest.fn());

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
const crawlPageHelper = require('../../crawlPageHelper');
const responsiveImagesHelper = require('../responsiveImagesHelper');

describe('responsiveImagesHelper', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fs.existsSync.mockReturnValue(false);
  });

  it('should call crawlPageHelper once with all image URLs space-joined', () => {
    const contentPath = path.resolve(process.cwd(), 'static/content');

    fs.readdirSync.mockReturnValue(['photo.jpg']);
    fs.lstatSync.mockReturnValue({ isDirectory: () => false });

    responsiveImagesHelper();

    // One original + 5 size variants = 6 URLs, batched into a single call
    expect(crawlPageHelper).toHaveBeenCalledTimes(1);
    const calledUrl = crawlPageHelper.mock.calls[0][0];
    expect(calledUrl.split(' ')).toHaveLength(6);
  });

  it('should not call crawlPageHelper when all files already exist', () => {
    fs.readdirSync.mockReturnValue(['photo.jpg']);
    fs.lstatSync.mockReturnValue({ isDirectory: () => false });
    fs.existsSync.mockReturnValue(true);

    responsiveImagesHelper();

    expect(crawlPageHelper).not.toHaveBeenCalled();
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
    expect(crawlPageHelper).toHaveBeenCalledTimes(1);
    const calledUrl = crawlPageHelper.mock.calls[0][0];
    expect(calledUrl.split(' ')).toHaveLength(1);
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
    expect(crawlPageHelper).toHaveBeenCalled();
  });

  it('should replace ABSOLUTE_STATIC_DIRECTORY with SOURCE_DOMAIN in URLs', () => {
    fs.readdirSync.mockReturnValue(['photo.jpg']);
    fs.lstatSync.mockReturnValue({ isDirectory: () => false });

    responsiveImagesHelper();

    const calledUrl = crawlPageHelper.mock.calls[0][0];
    calledUrl.split(' ').forEach((url) => {
      expect(url).toContain('http://localhost:2368');
    });
  });
});
