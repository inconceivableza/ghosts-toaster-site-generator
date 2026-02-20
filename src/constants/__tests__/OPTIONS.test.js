describe('OPTIONS', () => {
  it('should set X_FORWARDED_PROTO when --avoid-https flag is set', () => {
    let OPTIONS;
    jest.isolateModules(() => {
      jest.doMock('yargs/yargs', () => () => ({ argv: { avoidHttps: true } }));
      jest.doMock('child_process', () => ({
        execSync: jest.fn().mockReturnValue(Buffer.from('')),
      }));
      OPTIONS = require('../OPTIONS');
    });
    expect(OPTIONS.X_FORWARDED_PROTO).toBe('--header="X-Forwarded-Proto: https" ');
  });

  it('should set MIRROR_COMMAND to wpull when --use-wpull flag is set', () => {
    let OPTIONS;
    jest.isolateModules(() => {
      jest.doMock('yargs/yargs', () => () => ({ argv: { useWpull: true } }));
      jest.doMock('child_process', () => ({
        execSync: jest.fn().mockReturnValue(Buffer.from('')),
      }));
      OPTIONS = require('../OPTIONS');
    });
    expect(OPTIONS.MIRROR_COMMAND).toBe('wpull');
  });

  it('should set FETCH_HOST_HEADER with source domain when --fetch-domain differs from --domain', () => {
    let OPTIONS;
    jest.isolateModules(() => {
      jest.doMock('yargs/yargs', () => () => ({
        argv: { domain: 'https://ghost.example.com', fetchDomain: 'http://ghost_container:2368' },
      }));
      jest.doMock('child_process', () => ({
        execSync: jest.fn().mockReturnValue(Buffer.from('')),
      }));
      OPTIONS = require('../OPTIONS');
    });
    expect(OPTIONS.FETCH_DOMAIN).toBe('http://ghost_container:2368');
    expect(OPTIONS.FETCH_HOST_HEADER).toBe('--header="Host: ghost.example.com" ');
  });

  it('should set SHOW_PROGRESS_BAR to empty string when --silent flag is set', () => {
    let OPTIONS;
    jest.isolateModules(() => {
      jest.doMock('yargs/yargs', () => () => ({
        argv: { silent: true },
      }));
      jest.doMock('child_process', () => ({
        execSync: jest.fn().mockReturnValue(Buffer.from('--show-progress')),
      }));
      OPTIONS = require('../OPTIONS');
    });

    expect(OPTIONS.SHOW_PROGRESS_BAR).toBe('');
  });

  it('should set SHOW_PROGRESS_BAR to --show-progress when supported and not silent', () => {
    let OPTIONS;
    jest.isolateModules(() => {
      jest.doMock('yargs/yargs', () => () => ({
        argv: {},
      }));
      jest.doMock('child_process', () => ({
        execSync: jest.fn().mockReturnValue(Buffer.from('--show-progress available')),
      }));
      OPTIONS = require('../OPTIONS');
    });

    expect(OPTIONS.SHOW_PROGRESS_BAR).toBe('--show-progress ');
  });

  it('should set SHOW_PROGRESS_BAR to empty string when --show-progress is not supported', () => {
    let OPTIONS;
    jest.isolateModules(() => {
      jest.doMock('yargs/yargs', () => () => ({
        argv: {},
      }));
      jest.doMock('child_process', () => ({
        execSync: jest.fn().mockReturnValue(Buffer.from('')),
      }));
      OPTIONS = require('../OPTIONS');
    });

    expect(OPTIONS.SHOW_PROGRESS_BAR).toBe('');
  });
});
