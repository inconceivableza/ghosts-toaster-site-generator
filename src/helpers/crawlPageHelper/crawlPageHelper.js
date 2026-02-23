const { execSync } = require('child_process');
const { argv } = require('yargs');
const OPTIONS = require('../../constants/OPTIONS');

const crawlHistory = new Set();

const contentOnError = () => {
  const contentOnErrorHelpText = execSync(
    `${OPTIONS.MIRROR_COMMAND} --help | grep "content-on-error" || true`,
  ).toString();

  return `${contentOnErrorHelpText}`
    .includes('content-on-error')
    ? '--content-on-error '
    : '';
};

const saveAsReferer = () => {
  if (OPTIONS.SAVE_AS_REFERER) {
    return '';
  }
  return '--trust-server-names ';
};

const crawlPageHelper = (url) => {
  if (crawlHistory.has(url)) {
    return;
  }
  // When FETCH_DOMAIN is set, connect to it directly but present SOURCE_DOMAIN to Ghost via Host header.
  // Use replaceAll because the wpull url string may contain multiple space-separated URLs.
  const fetchUrl = OPTIONS.FETCH_DOMAIN !== OPTIONS.SOURCE_DOMAIN
    ? url.replaceAll(OPTIONS.SOURCE_DOMAIN, OPTIONS.FETCH_DOMAIN)
    : url;

  // --span-hosts is NOT used: the ghost_domains.py plugin handles all cross-domain remapping via
  // add_child_url. Adding --hostnames would restrict wpull to those hosts only, which would prevent
  // it from fetching from FETCH_DOMAIN (e.g. ghost_gtdemo:2368) when the listed host differs.
  const spanHostsFlag = '';

  const wgetCommand = `${OPTIONS.MIRROR_COMMAND} -v ${OPTIONS.SHOW_PROGRESS_BAR}--recursive `
    + `${OPTIONS.X_FORWARDED_PROTO}`
    + `${OPTIONS.FETCH_HOST_HEADER}`
    // + '--timestamping ' // temporarily disable timestamping as not all urls being retrieved
    + '--page-requisites '
    + '--no-parent '
    + '--no-host-directories '
    + spanHostsFlag
    + ((OPTIONS.MIRROR_COMMAND === 'wpull') ? '--no-robots ' : '')
    + ((OPTIONS.MIRROR_COMMAND === 'wpull') ? '--sitemaps ' : '')
    + ((OPTIONS.MIRROR_COMMAND === 'wpull') ? `--plugin-script ${OPTIONS.PLUGIN_SCRIPT} ` : '')
    + '--restrict-file-names=unix '
    + `--directory-prefix ${OPTIONS.STATIC_DIRECTORY} ${contentOnError()} `
    + `${saveAsReferer()}`
    + `${fetchUrl}`;

  try {
    console.log(`Fetching: ${url}`);
    // Pass SOURCE_DOMAIN, PRODUCTION_DOMAIN, ALT_DOMAINS and FETCH_DOMAIN to the wpull ghost_domains plugin
    const env = { ...process.env, SOURCE_DOMAIN: OPTIONS.SOURCE_DOMAIN, PRODUCTION_DOMAIN: OPTIONS.PRODUCTION_DOMAIN, ALT_DOMAINS: OPTIONS.ALT_DOMAINS, FETCH_DOMAIN: OPTIONS.FETCH_DOMAIN };
    execSync(
      wgetCommand,
      { env, stdio: 'inherit' },
    );

    crawlHistory.add(url);
  } catch (execSyncError) {
  	if (execSyncError.stdout != null) {
  		console.log(`ERROR: ${execSyncError.stdout}`);
    	console.log(`Using Command: ${wgetCommand}`);

	    if (argv.failOnError) {
	      process.exit(1);
	    }
	}
  }
};

module.exports = crawlPageHelper;
