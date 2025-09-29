const path = require('path');
const fs = require('fs');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const { compose } = require('lodash/fp');
const OPTIONS = require('../../constants/OPTIONS');
const replaceDomainWithUrlHelper = require('../replaceDomainWithUrlHelper');
const replaceUrlWithSubDirPathHelper = require('../replaceUrlWithSubDirPathHelper');
const convertDomainToRelativeHelper = require('../convertDomainToRelativeHelper');
const removeAllUrlsHelper = require('../removeAllUrlsHelper');
const replaceXmlUrlsHelper = require('../replaceXmlUrlsHelper');
const replaceJavaScriptUrlsHelper = require('../replaceJavaScriptUrlsHelper');
const replaceCssUrlsHelper = require('../replaceCssUrlsHelper');
const replaceMetaTagsHelper = require('../replaceMetaTagsHelper');
const replaceSrcsetHelper = require('../replaceSrcsetHelper');

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

  let transformationPipeline = [
    replaceXmlUrlsHelper(file),
    removeAllUrlsHelper,
    replaceDomainWithUrlHelper,
    convertDomainToRelativeHelper(subDir, filePath),
    replaceUrlWithSubDirPathHelper,
  ];

  // Add specialized transformations for specific file types
  if (fileExtension === '.html' || fileExtension === '.htm') {
    transformationPipeline = [
      replaceMetaTagsHelper,
      replaceSrcsetHelper,
      ...transformationPipeline,
    ];
  }

  if (fileExtension === '.js') {
    transformationPipeline = [
      replaceJavaScriptUrlsHelper,
      ...transformationPipeline,
    ];
  }

  if (fileExtension === '.css') {
    transformationPipeline = [
      replaceCssUrlsHelper,
      ...transformationPipeline,
    ];
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
