jest.mock('fs', () => ({
  readdirSync: jest.fn(),
  lstatSync: jest.fn(),
  renameSync: jest.fn(),
}));

const fs = require('fs');
const removeQueryStringsHelper = require('../removeQueryStringsHelper');

describe('removeQueryStringsHelper', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should rename files matching the default query string pattern', () => {
    fs.readdirSync.mockReturnValue(['script.js?v=123', 'style.css']);
    fs.lstatSync.mockReturnValue({ isDirectory: () => false });

    removeQueryStringsHelper('/static');

    expect(fs.renameSync).toHaveBeenCalledTimes(1);
    expect(fs.renameSync).toHaveBeenCalledWith(
      expect.stringContaining('script.js?v=123'),
      expect.stringContaining('script.js'),
    );
  });

  it('should not rename files without query strings', () => {
    fs.readdirSync.mockReturnValue(['style.css', 'script.js']);
    fs.lstatSync.mockReturnValue({ isDirectory: () => false });

    removeQueryStringsHelper('/static');

    expect(fs.renameSync).not.toHaveBeenCalled();
  });

  it('should recurse into subdirectories and rename files within them', () => {
    fs.readdirSync
      .mockReturnValueOnce(['subdir'])
      .mockReturnValueOnce(['nested.css?v=456']);

    fs.lstatSync
      .mockReturnValueOnce({ isDirectory: () => true })  // for 'subdir'
      .mockReturnValueOnce({ isDirectory: () => false }); // for 'nested.css?v=456'

    removeQueryStringsHelper('/static');

    expect(fs.readdirSync).toHaveBeenCalledTimes(2);
    expect(fs.renameSync).toHaveBeenCalledTimes(1);
    expect(fs.renameSync).toHaveBeenCalledWith(
      expect.stringContaining('nested.css?v=456'),
      expect.stringContaining('nested.css'),
    );
  });

  it('should support custom match and replace patterns', () => {
    fs.readdirSync.mockReturnValue(['file.min.js', 'file.js']);
    fs.lstatSync.mockReturnValue({ isDirectory: () => false });

    removeQueryStringsHelper('/static', /\.min/, '');

    expect(fs.renameSync).toHaveBeenCalledTimes(1);
    expect(fs.renameSync).toHaveBeenCalledWith(
      expect.stringContaining('file.min.js'),
      expect.stringContaining('file.js'),
    );
  });
});
