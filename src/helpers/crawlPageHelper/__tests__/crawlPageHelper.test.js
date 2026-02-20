describe('crawlPageHelper', () => {
  let crawlPageHelper;
  let mockExecSync;

  const mockOptions = {
    MIRROR_COMMAND: 'wget',
    SHOW_PROGRESS_BAR: '',
    X_FORWARDED_PROTO: '',
    FETCH_HOST_HEADER: '',
    STATIC_DIRECTORY: 'static',
    SAVE_AS_REFERER: false,
    ALT_DOMAINS: [],
    SOURCE_DOMAIN: 'http://localhost:2368',
    FETCH_DOMAIN: 'http://localhost:2368',
    SOURCE_DOMAIN_HOST: 'localhost',
    PRODUCTION_DOMAIN: 'https://www.example.com',
    PLUGIN_SCRIPT: '/path/to/plugin.py',
  };

  beforeEach(() => {
    jest.resetModules();
    mockExecSync = jest.fn().mockReturnValue(Buffer.from(''));
    jest.doMock('child_process', () => ({ execSync: mockExecSync }));
    jest.doMock('../../../constants/OPTIONS', () => ({ ...mockOptions }));
    jest.doMock('yargs', () => ({ argv: {} }));
    crawlPageHelper = require('../crawlPageHelper');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should call execSync with the URL', () => {
    crawlPageHelper('http://localhost:2368/post');

    // execSync called at least twice: once for contentOnError help check, once for wget
    expect(mockExecSync).toHaveBeenCalled();
    const calls = mockExecSync.mock.calls;
    const wgetCall = calls[calls.length - 1];
    expect(wgetCall[0]).toContain('http://localhost:2368/post');
  });

  it('should not crawl the same URL twice', () => {
    crawlPageHelper('http://localhost:2368/post');
    const callCountAfterFirst = mockExecSync.mock.calls.length;

    crawlPageHelper('http://localhost:2368/post');

    expect(mockExecSync.mock.calls.length).toBe(callCountAfterFirst);
  });

  it('should include --trust-server-names when SAVE_AS_REFERER is false', () => {
    crawlPageHelper('http://localhost:2368/post');

    const calls = mockExecSync.mock.calls;
    const wgetCall = calls[calls.length - 1];
    expect(wgetCall[0]).toContain('--trust-server-names');
  });

  it('should not include --trust-server-names when SAVE_AS_REFERER is true', () => {
    jest.resetModules();
    mockExecSync = jest.fn().mockReturnValue(Buffer.from(''));
    jest.doMock('child_process', () => ({ execSync: mockExecSync }));
    jest.doMock('../../../constants/OPTIONS', () => ({ ...mockOptions, SAVE_AS_REFERER: true }));
    jest.doMock('yargs', () => ({ argv: {} }));
    crawlPageHelper = require('../crawlPageHelper');

    crawlPageHelper('http://localhost:2368/post');

    const calls = mockExecSync.mock.calls;
    const wgetCall = calls[calls.length - 1];
    expect(wgetCall[0]).not.toContain('--trust-server-names');
  });

  it('should include --content-on-error flag when supported', () => {
    jest.resetModules();
    mockExecSync = jest.fn()
      .mockReturnValueOnce(Buffer.from('--content-on-error'))
      .mockReturnValue(Buffer.from(''));
    jest.doMock('child_process', () => ({ execSync: mockExecSync }));
    jest.doMock('../../../constants/OPTIONS', () => ({ ...mockOptions }));
    jest.doMock('yargs', () => ({ argv: {} }));
    crawlPageHelper = require('../crawlPageHelper');

    crawlPageHelper('http://localhost:2368/post');

    const calls = mockExecSync.mock.calls;
    const wgetCall = calls[calls.length - 1];
    expect(wgetCall[0]).toContain('--content-on-error');
  });

  it('should omit --content-on-error flag when not supported', () => {
    // mockExecSync returns empty string for help text → no --content-on-error
    crawlPageHelper('http://localhost:2368/post');

    const calls = mockExecSync.mock.calls;
    const wgetCall = calls[calls.length - 1];
    expect(wgetCall[0]).not.toContain('--content-on-error');
  });

  it('should log error and continue when execSync throws with stdout', () => {
    const mockError = new Error('wget failed');
    mockError.stdout = 'some stdout output';
    mockExecSync
      .mockReturnValueOnce(Buffer.from('')) // contentOnError help check
      .mockImplementationOnce(() => { throw mockError; }); // actual wget call

    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    expect(() => crawlPageHelper('http://localhost:2368/post')).not.toThrow();
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('ERROR'));
    consoleSpy.mockRestore();
  });

  it('should silently swallow errors without stdout', () => {
    const mockError = new Error('wget failed');
    // no .stdout property
    mockExecSync
      .mockReturnValueOnce(Buffer.from('')) // contentOnError help check
      .mockImplementationOnce(() => { throw mockError; }); // actual wget call

    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    expect(() => crawlPageHelper('http://localhost:2368/post')).not.toThrow();
    expect(consoleSpy).not.toHaveBeenCalledWith(expect.stringContaining('ERROR'));
    consoleSpy.mockRestore();
  });

  it('should call process.exit(1) when failOnError is set and error has stdout', () => {
    jest.resetModules();
    mockExecSync = jest.fn();
    const mockError = new Error('wget failed');
    mockError.stdout = 'some output';
    mockExecSync
      .mockReturnValueOnce(Buffer.from(''))
      .mockImplementationOnce(() => { throw mockError; });
    jest.doMock('child_process', () => ({ execSync: mockExecSync }));
    jest.doMock('../../../constants/OPTIONS', () => ({ ...mockOptions }));
    jest.doMock('yargs', () => ({ argv: { failOnError: true } }));
    crawlPageHelper = require('../crawlPageHelper');

    const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
    crawlPageHelper('http://localhost:2368/post');
    expect(mockExit).toHaveBeenCalledWith(1);
    mockExit.mockRestore();
    jest.spyOn(console, 'log').mockRestore();
  });

  it('should include wpull-specific flags when MIRROR_COMMAND is wpull', () => {
    jest.resetModules();
    mockExecSync = jest.fn().mockReturnValue(Buffer.from(''));
    jest.doMock('child_process', () => ({ execSync: mockExecSync }));
    jest.doMock('../../../constants/OPTIONS', () => ({
      ...mockOptions,
      MIRROR_COMMAND: 'wpull',
      ALT_DOMAINS: [],
    }));
    jest.doMock('yargs', () => ({ argv: {} }));
    crawlPageHelper = require('../crawlPageHelper');

    crawlPageHelper('http://localhost:2368/post');

    const calls = mockExecSync.mock.calls;
    const wgetCall = calls[calls.length - 1];
    expect(wgetCall[0]).toContain('--no-robots');
    expect(wgetCall[0]).toContain('--sitemaps');
    expect(wgetCall[0]).toContain('--plugin-script');
  });

  it('should include --span-hosts and --hostnames when wpull and ALT_DOMAINS is non-empty', () => {
    jest.resetModules();
    mockExecSync = jest.fn().mockReturnValue(Buffer.from(''));
    jest.doMock('child_process', () => ({ execSync: mockExecSync }));
    jest.doMock('../../../constants/OPTIONS', () => ({
      ...mockOptions,
      MIRROR_COMMAND: 'wpull',
      ALT_DOMAINS: ['http://alt.example.com:2368'],
    }));
    jest.doMock('yargs', () => ({ argv: {} }));
    crawlPageHelper = require('../crawlPageHelper');

    crawlPageHelper('http://localhost:2368/post');

    const calls = mockExecSync.mock.calls;
    const wgetCall = calls[calls.length - 1];
    expect(wgetCall[0]).toContain('--span-hosts');
    expect(wgetCall[0]).toContain('--hostnames');
  });
});
