const path = require('path');
const fs = require('fs');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const { compose } = require('lodash/fp');
const OPTIONS = require('../../constants/OPTIONS');
const replaceUrlWithSubDirPathHelper = require('../replaceUrlWithSubDirPathHelper');
const convertDomainToRelativeHelper = require('../convertDomainToRelativeHelper');
const replaceXmlUrlsHelper = require('../replaceXmlUrlsHelper');
const replaceJavaScriptUrlsHelper = require('../replaceJavaScriptUrlsHelper');
const replaceCssUrlsHelper = require('../replaceCssUrlsHelper');
const replaceMetaTagsHelper = require('../replaceMetaTagsHelper');
const replaceSrcsetHelper = require('../replaceSrcsetHelper');
const makeUrlsRelativeHelper = require('../makeUrlsRelativeHelper');

const { argv } = yargs(hideBin(process.argv));

/**
 * This function replaces url and domain names using specialized helpers for different content types
 *
 * @param {string} directory - directory where the static site is located
 * @param {string} replaceUrl - url to replace with
 * @returns {function(*=)} - returns a function that accepts a file name
 */
const replaceDomainNameHelper = (
  directory,
  replaceUrl,
) => (file) => {
  // Some users may want to host files under a sub directory
  const { subDir } = argv;
  const filePath = path.join(directory, file);
  const fileContents = fs.readFileSync(filePath, 'utf8');

  // Apply content-type specific transformations based on file extension
  const fileExtension = path.extname(file).toLowerCase();

  // Execution order (compose applies right-to-left, so leftmost runs last):
  // 1. content-type helper (srcset/meta/JS/CSS) — strip SOURCE or set PRODUCTION for meta
  // 2. makeUrlsRelativeHelper — strip remaining SOURCE_DOMAIN → root-relative /path
  // 3. replaceUrlWithSubDirPathHelper — root-relative /path → depth-relative ./path (subDir only)
  // 4. convertDomainToRelativeHelper — fallback for any residual domain references (subDir only)
  // 5. replaceXmlUrlsHelper — SOURCE → PRODUCTION for XML/sitemaps
  let transformationPipeline = [
    replaceXmlUrlsHelper(file),
    convertDomainToRelativeHelper(subDir, filePath),
    (output) => replaceUrlWithSubDirPathHelper(output, subDir, filePath),
    makeUrlsRelativeHelper(file),
  ];

  // Add specialized transformations for specific file types
  if (fileExtension === '.html' || fileExtension === '.htm') {
    transformationPipeline = [...transformationPipeline, replaceMetaTagsHelper, replaceSrcsetHelper];
  }

  if (fileExtension === '.js') {
    transformationPipeline = [...transformationPipeline, replaceJavaScriptUrlsHelper];
  }

  if (fileExtension === '.css') {
    transformationPipeline = [...transformationPipeline, replaceCssUrlsHelper];
  }

  // Apply all transformations in sequence
  const output = compose(...transformationPipeline)(
    fileContents,
    subDir,
    filePath,
  );

  fs.writeFileSync(filePath, output);

  console.log(`${OPTIONS.SOURCE_DOMAIN} => ${replaceUrl}: ${filePath}`);
};

module.exports = replaceDomainNameHelper;
