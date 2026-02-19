describe('crawlPageAsyncHelper', () => {
  let crawlPageAsyncHelper;
  let mockExec;
  let mockExecSync;

  const mockOptions = {
    MIRROR_COMMAND: 'wget',
    SHOW_PROGRESS_BAR: '',
    X_FORWARDED_PROTO: '',
    STATIC_DIRECTORY: 'static',
    SAVE_AS_REFERER: false,
    ALT_DOMAINS: [],
    SOURCE_DOMAIN: 'http://localhost:2368',
    PRODUCTION_DOMAIN: 'https://www.example.com',
    PLUGIN_SCRIPT: '/path/to/plugin.py',
  };

  beforeEach(() => {
    jest.resetModules();
    mockExec = jest.fn();
    mockExecSync = jest.fn().mockReturnValue(Buffer.from(''));
    jest.doMock('child_process', () => ({ exec: mockExec, execSync: mockExecSync }));
    jest.doMock('../../../constants/OPTIONS', () => ({ ...mockOptions }));
    jest.doMock('yargs', () => ({ argv: {} }));
    crawlPageAsyncHelper = require('../crawlPageAsyncHelper');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should call exec with the URL', () => {
    crawlPageAsyncHelper('http://localhost:2368/post');

    expect(mockExec).toHaveBeenCalled();
    const wgetCall = mockExec.mock.calls[0];
    expect(wgetCall[0]).toContain('http://localhost:2368/post');
  });

  it('should pass callback to exec', () => {
    const mockCallback = jest.fn();
    crawlPageAsyncHelper('http://localhost:2368/post', mockCallback);

    expect(mockExec).toHaveBeenCalled();
    const wgetCall = mockExec.mock.calls[0];
    expect(wgetCall[2]).toBe(mockCallback);
  });

  it('should include --trust-server-names when SAVE_AS_REFERER is false', () => {
    crawlPageAsyncHelper('http://localhost:2368/post');

    const wgetCall = mockExec.mock.calls[0];
    expect(wgetCall[0]).toContain('--trust-server-names');
  });

  it('should not include --trust-server-names when SAVE_AS_REFERER is true', () => {
    jest.resetModules();
    mockExec = jest.fn();
    mockExecSync = jest.fn().mockReturnValue(Buffer.from(''));
    jest.doMock('child_process', () => ({ exec: mockExec, execSync: mockExecSync }));
    jest.doMock('../../../constants/OPTIONS', () => ({ ...mockOptions, SAVE_AS_REFERER: true }));
    jest.doMock('yargs', () => ({ argv: {} }));
    crawlPageAsyncHelper = require('../crawlPageAsyncHelper');

    crawlPageAsyncHelper('http://localhost:2368/post');

    const wgetCall = mockExec.mock.calls[0];
    expect(wgetCall[0]).not.toContain('--trust-server-names');
  });

  it('should include --content-on-error flag when supported', () => {
    jest.resetModules();
    mockExec = jest.fn();
    mockExecSync = jest.fn().mockReturnValue(Buffer.from('--content-on-error'));
    jest.doMock('child_process', () => ({ exec: mockExec, execSync: mockExecSync }));
    jest.doMock('../../../constants/OPTIONS', () => ({ ...mockOptions }));
    jest.doMock('yargs', () => ({ argv: {} }));
    crawlPageAsyncHelper = require('../crawlPageAsyncHelper');

    crawlPageAsyncHelper('http://localhost:2368/post');

    const wgetCall = mockExec.mock.calls[0];
    expect(wgetCall[0]).toContain('--content-on-error');
  });

  it('should omit --content-on-error flag when not supported', () => {
    // mockExecSync returns empty string → no --content-on-error
    crawlPageAsyncHelper('http://localhost:2368/post');

    const wgetCall = mockExec.mock.calls[0];
    expect(wgetCall[0]).not.toContain('--content-on-error');
  });

  it('should log error and continue when exec throws synchronously', () => {
    const mockError = new Error('exec failed');
    mockError.stdout = 'some output';
    mockExec.mockImplementationOnce(() => { throw mockError; });

    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    expect(() => crawlPageAsyncHelper('http://localhost:2368/post')).not.toThrow();
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('ERROR'));
    consoleSpy.mockRestore();
  });

  it('should call process.exit(1) when failOnError is set and exec throws synchronously', () => {
    jest.resetModules();
    mockExec = jest.fn();
    mockExecSync = jest.fn().mockReturnValue(Buffer.from(''));
    const mockError = new Error('exec failed');
    mockError.stdout = 'some output';
    mockExec.mockImplementationOnce(() => { throw mockError; });
    jest.doMock('child_process', () => ({ exec: mockExec, execSync: mockExecSync }));
    jest.doMock('../../../constants/OPTIONS', () => ({ ...mockOptions }));
    jest.doMock('yargs', () => ({ argv: { failOnError: true } }));
    crawlPageAsyncHelper = require('../crawlPageAsyncHelper');

    const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
    crawlPageAsyncHelper('http://localhost:2368/post');
    expect(mockExit).toHaveBeenCalledWith(1);
    mockExit.mockRestore();
    jest.spyOn(console, 'log').mockRestore();
  });

  it('should include wpull-specific flags when MIRROR_COMMAND is wpull', () => {
    jest.resetModules();
    mockExec = jest.fn();
    mockExecSync = jest.fn().mockReturnValue(Buffer.from(''));
    jest.doMock('child_process', () => ({ exec: mockExec, execSync: mockExecSync }));
    jest.doMock('../../../constants/OPTIONS', () => ({
      ...mockOptions,
      MIRROR_COMMAND: 'wpull',
      ALT_DOMAINS: [],
    }));
    jest.doMock('yargs', () => ({ argv: {} }));
    crawlPageAsyncHelper = require('../crawlPageAsyncHelper');

    crawlPageAsyncHelper('http://localhost:2368/post');

    const wgetCall = mockExec.mock.calls[0];
    expect(wgetCall[0]).toContain('--no-robots');
    expect(wgetCall[0]).toContain('--sitemaps');
    expect(wgetCall[0]).toContain('--plugin-script');
  });
});
