jest.mock('fs', () => ({
  readdirSync: jest.fn(),
  lstatSync: jest.fn(),
}));

jest.mock('../../replaceDomainNameHelper', () => jest.fn(() => jest.fn()));

const fs = require('fs');
const replaceDomainNameHelper = require('../../replaceDomainNameHelper');
const replaceUrlHelper = require('../replaceUrlHelper');

describe('replaceUrlHelper', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should call replaceDomainNameHelper for matching .html files', () => {
    fs.readdirSync.mockReturnValue(['index.html', 'about.html', 'script.js']);
    fs.lstatSync.mockReturnValue({ isDirectory: () => false });

    replaceUrlHelper('/static', /\.html/, 'https://www.example.com');

    expect(replaceDomainNameHelper).toHaveBeenCalledWith('/static', 'https://www.example.com');
    // The returned function is called for each matching file (forEach passes file, index, array)
    const mockFileHandler = replaceDomainNameHelper.mock.results[0].value;
    const calledFiles = mockFileHandler.mock.calls.map(call => call[0]);
    expect(calledFiles).toContain('index.html');
    expect(calledFiles).toContain('about.html');
    expect(calledFiles).not.toContain('script.js');
  });

  it('should recurse into subdirectories', () => {
    fs.readdirSync
      .mockReturnValueOnce(['subdir', 'index.html'])
      .mockReturnValueOnce(['nested.html']);

    fs.lstatSync
      .mockReturnValueOnce({ isDirectory: () => true })  // for 'subdir'
      .mockReturnValueOnce({ isDirectory: () => false }) // for 'index.html'
      .mockReturnValueOnce({ isDirectory: () => false }); // for 'nested.html'

    replaceUrlHelper('/static', /\.html/, 'https://www.example.com');

    expect(fs.readdirSync).toHaveBeenCalledTimes(2);
  });

  it('should work with default parameters when called without arguments', () => {
    fs.readdirSync.mockReturnValue([]);

    expect(() => replaceUrlHelper()).not.toThrow();
  });

  it('should not process non-matching files', () => {
    fs.readdirSync.mockReturnValue(['style.css', 'app.js', 'image.png']);
    fs.lstatSync.mockReturnValue({ isDirectory: () => false });

    replaceUrlHelper('/static', /\.html/, 'https://www.example.com');

    const mockFileHandler = replaceDomainNameHelper.mock.results[0].value;
    expect(mockFileHandler).not.toHaveBeenCalled();
  });
});
