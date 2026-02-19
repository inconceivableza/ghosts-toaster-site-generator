describe('OPTIONS', () => {
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
