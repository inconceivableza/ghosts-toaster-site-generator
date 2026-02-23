jest.mock('yargs/yargs', () => () => ({
  argv: {
    url: 'http://www.example.com',
    ignoreAbsolutePaths: true,
  },
}));

const removeAllUrlsHelper = require('../removeAllUrlsHelper');

describe('removeAllUrlsHelper', () => {
  it('should remove urls from strings', () => {
    const mockOutput = '<img src="http://www.example.com/logo/image.jpg"/>'
      + ' <a href="http://www.example.com/logo/image.jpg"/></a>';
    const expected = removeAllUrlsHelper(mockOutput);
    const result = '<img src="/logo/image.jpg"/>'
      + ' <a href="/logo/image.jpg"/></a>';
    expect(expected).toEqual(result);
  });

  it('should return output unchanged when IGNORE_ABSOLUTE_PATHS is false', () => {
    jest.resetModules();
    jest.doMock('yargs/yargs', () => () => ({
      argv: {
        url: 'http://www.example.com',
        ignoreAbsolutePaths: false,
      },
    }));
    const helper = require('../removeAllUrlsHelper');
    const input = '<img src="http://www.example.com/logo/image.jpg"/>';
    expect(helper(input)).toBe(input);
  });
});
