#!/usr/bin/env node

/**
 * Phase 4 Validation Script
 *
 * This script validates that the URL transformation system is working correctly
 * and measures performance impact.
 */

const { performance } = require('perf_hooks');
const { compose } = require('lodash/fp');

// Mock OPTIONS
const mockOptions = {
  SOURCE_DOMAIN: 'http://ghost.example.com:2368',
  PRODUCTION_DOMAIN: 'https://www.example.com',
};

// Set up environment
process.env.NODE_ENV = 'test';

// Mock the OPTIONS module
require.cache[require.resolve('./src/constants/OPTIONS')] = {
  exports: mockOptions,
  loaded: true,
  id: require.resolve('./src/constants/OPTIONS'),
};

// Import transformation helpers AFTER mocking
const replaceDomainWithUrlHelper = require('./src/helpers/replaceDomainWithUrlHelper');
const replaceJavaScriptUrlsHelper = require('./src/helpers/replaceJavaScriptUrlsHelper');
const replaceCssUrlsHelper = require('./src/helpers/replaceCssUrlsHelper');
const replaceMetaTagsHelper = require('./src/helpers/replaceMetaTagsHelper');
const replaceSrcsetHelper = require('./src/helpers/replaceSrcsetHelper');

// Configuration
const GHOST_DOMAIN = 'http://ghost.example.com:2368';
const PRODUCTION_DOMAIN = 'https://www.example.com';

console.log('🔍 Ghost Static Site Generator - URL Transformation Validation');
console.log('===============================================================');
console.log('Source Domain: ' + GHOST_DOMAIN);
console.log('Production Domain: ' + PRODUCTION_DOMAIN);
console.log('');

// Test the complete transformation pipeline
const fullTransformationPipeline = [
  replaceMetaTagsHelper,
  replaceSrcsetHelper,
  replaceJavaScriptUrlsHelper,
  replaceCssUrlsHelper,
  replaceDomainWithUrlHelper,
];

function validateContent(content, contentType, testName) {
  console.log('Testing ' + testName + '...');

  const startTime = performance.now();
  const result = compose(...fullTransformationPipeline)(content);
  const endTime = performance.now();

  const processingTime = endTime - startTime;

  // Check for remaining Ghost URLs
  const ghostUrlRegex = new RegExp(GHOST_DOMAIN.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
  const remainingGhostUrls = result.match(ghostUrlRegex);

  // Check for production URLs
  const productionUrlCount = (result.match(new RegExp(PRODUCTION_DOMAIN.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;

  console.log('  ✅ Processing time: ' + processingTime.toFixed(2) + 'ms');
  console.log('  ✅ Content size: ' + content.length + ' chars → ' + result.length + ' chars');
  console.log('  ' + (remainingGhostUrls ? '❌' : '✅') + ' Ghost URLs remaining: ' + (remainingGhostUrls ? remainingGhostUrls.length : 0));
  console.log('  ✅ Production URLs added: ' + productionUrlCount);

  if (remainingGhostUrls) {
    console.log('  🚨 FAILED: Found remaining Ghost URLs:', remainingGhostUrls.slice(0, 5));
    return false;
  }

  console.log('');
  return true;
}

function performanceTest() {
  console.log('⚡ Performance Testing');
  console.log('=====================');

  const testCases = [
    { name: 'Small HTML (1KB)', size: 1000, type: 'html' },
    { name: 'Medium HTML (10KB)', size: 10000, type: 'html' },
    { name: 'Large HTML (100KB)', size: 100000, type: 'html' },
  ];

  const results = [];

  testCases.forEach(function(testCase) {
    const name = testCase.name;
    const size = testCase.size;
    const type = testCase.type;

    // Generate test content of specified size
    let baseContent = '<html><head><link rel="canonical" href="' + GHOST_DOMAIN + '/post/"></head><body><a href="' + GHOST_DOMAIN + '/link/">Link</a></body></html>';

    // Repeat content to reach target size
    let content = baseContent;
    while (content.length < size) {
      content += baseContent.replace(/post\/|link\//, 'item' + Math.random().toString(36).substr(2, 9) + '/');
    }
    content = content.substr(0, size); // Trim to exact size

    // Measure performance
    const iterations = 10;
    const times = [];

    for (let i = 0; i < iterations; i++) {
      const startTime = performance.now();
      compose(...fullTransformationPipeline)(content);
      const endTime = performance.now();
      times.push(endTime - startTime);
    }

    const avgTime = times.reduce(function(a, b) { return a + b; }, 0) / times.length;
    const minTime = Math.min.apply(Math, times);
    const maxTime = Math.max.apply(Math, times);
    const throughput = (size / avgTime * 1000 / 1024).toFixed(2); // KB/s

    results.push({
      name: name,
      size: size,
      avgTime: avgTime,
      minTime: minTime,
      maxTime: maxTime,
      throughput: throughput,
    });

    console.log(name + ': ' + avgTime.toFixed(2) + 'ms avg (' + minTime.toFixed(2) + '-' + maxTime.toFixed(2) + 'ms) - ' + throughput + ' KB/s');
  });

  console.log('');
  return results;
}

function main() {
  let allTestsPassed = true;

  // Test with realistic Ghost content patterns
  console.log('🧪 Content Validation Tests');
  console.log('============================');

  // Test complete HTML page
  const htmlContent = '<!DOCTYPE html>' +
    '<html>' +
    '<head>' +
    '<link rel="canonical" href="' + GHOST_DOMAIN + '/post/">' +
    '<meta property="og:url" content="' + GHOST_DOMAIN + '/post/">' +
    '<meta name="twitter:url" content="' + GHOST_DOMAIN + '/post/">' +
    '<link type="application/rss+xml" href="' + GHOST_DOMAIN + '/rss/">' +
    '<style>.bg { background: url(\'' + GHOST_DOMAIN + '/bg.jpg\'); }</style>' +
    '<script type="application/ld+json">{"url": "' + GHOST_DOMAIN + '"}</script>' +
    '</head>' +
    '<body>' +
    '<img srcset="' + GHOST_DOMAIN + '/img-400.jpg 400w, ' + GHOST_DOMAIN + '/img-800.jpg 800w">' +
    '<script>var config = { api: "' + GHOST_DOMAIN + '/api/" };</script>' +
    '</body>' +
    '</html>';

  if (!validateContent(htmlContent, 'html', 'Complete HTML Page')) {
    allTestsPassed = false;
  }

  // Test CSS content
  const cssContent = '@import "' + GHOST_DOMAIN + '/fonts.css";' +
    '.header { background: url(\'' + GHOST_DOMAIN + '/header.jpg\'); }' +
    '.logo { background: url(' + GHOST_DOMAIN + '/logo.svg); }';

  if (!validateContent(cssContent, 'css', 'CSS Content')) {
    allTestsPassed = false;
  }

  // Test JavaScript content
  const jsContent = 'var config = { url: "' + GHOST_DOMAIN + '", api: \'' + GHOST_DOMAIN + '/api/\' };' +
    'var imageUrl = "' + GHOST_DOMAIN + '/image.jpg";' +
    '// Base URL: ' + GHOST_DOMAIN;

  if (!validateContent(jsContent, 'js', 'JavaScript Content')) {
    allTestsPassed = false;
  }

  // Test problematic patterns
  const problematicContent = '<div data-url="' + GHOST_DOMAIN + '">' +
    '<!-- Ghost site: ' + GHOST_DOMAIN + ' -->' +
    '<script>window.ghostUrl = "' + GHOST_DOMAIN + '";</script>' +
    '<img src="//' + GHOST_DOMAIN.replace('http://', '') + '/image.jpg">' +
    '<LINK REL="canonical" HREF="' + GHOST_DOMAIN + '/post/">' +
    '<a href="' + GHOST_DOMAIN + '/search?q=test#results">Search</a>' +
    '</div>';

  if (!validateContent(problematicContent, 'html', 'Problematic Patterns')) {
    allTestsPassed = false;
  }

  // Performance testing
  const perfResults = performanceTest();

  // Summary
  console.log('📊 Validation Summary');
  console.log('====================');

  if (allTestsPassed) {
    console.log('✅ All transformation tests PASSED');
    console.log('✅ No Ghost domain URLs remain in any test content');
    console.log('✅ All content types handled correctly');
  } else {
    console.log('❌ Some transformation tests FAILED');
    console.log('🚨 Ghost domain URLs found in transformed content');
  }

  // Performance summary
  const avgPerformance = perfResults.reduce(function(sum, result) {
    return sum + parseFloat(result.throughput);
  }, 0) / perfResults.length;
  console.log('✅ Average processing throughput: ' + avgPerformance.toFixed(2) + ' KB/s');

  const slowestTest = perfResults.reduce(function(slowest, current) {
    return current.avgTime > slowest.avgTime ? current : slowest;
  });
  console.log('⚡ Slowest processing: ' + slowestTest.name + ' at ' + slowestTest.avgTime.toFixed(2) + 'ms');

  console.log('');
  console.log('🎉 Validation Complete!');
  console.log('Overall Result: ' + (allTestsPassed ? 'PASS ✅' : 'FAIL ❌'));

  return allTestsPassed;
}

if (require.main === module) {
  const success = main();
  process.exit(success ? 0 : 1);
}

module.exports = { validateContent, performanceTest };