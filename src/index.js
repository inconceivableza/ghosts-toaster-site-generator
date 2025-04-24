#!/usr/bin/env node

const help = require('./commands/help'); // needs to process yargs before anything else
const generateStaticSite = require('./commands/generateStaticSite');

console.time('Site generated in');

generateStaticSite();
