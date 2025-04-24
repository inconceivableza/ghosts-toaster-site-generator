const yargs = require('yargs/yargs');
const { parse } = require('yargs');
const { hideBin } = require('yargs/helpers');

// note that camel-case --oneTwoThree is interchangeable with hyphenated --one-two-three
const { argv } = yargs(hideBin(process.argv))
    .alias('sourceDomain', 'domain')
    .describe('sourceDomain', 'set the source URL that will be mirrored')
    .option('sourceDomain', {'type': 'string', 'default': 'http://localhost:2368'})
    .alias('productionDomain', 'url')
    .describe('productionDomain', 'set the production URL that will be mirrored')
    .option('productionDomain', {'type': 'string'})
    .describe('dest', 'the folder the static site is generated into')
    .option('dest', {'type': 'string', 'default': 'static'})
    .describe('subDir', 'use in conjunction with --dest to host sites in directories. will replace all relative path urls with absolute path urls')
    .option('subDir', {'type': 'string'})
    .describe('saveAsReferer', 'saves redirected content with the original referer path instead of the destination path')
    .describe('ignoreAbsolutePaths', 'will make your site truly relative and swap out all domain names for relative paths')
    .describe('preview', 'generate the site and then open in a new browser window. ignores productionDomain')
    .describe('silent', 'hide wget output')
    .describe('failOnError', 'output the failed wget command and also any errors before exiting')
    .help();

parse();

module.exports = { argv };
