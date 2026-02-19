# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a fork of [ghost-static-site-generator](https://github.com/Fried-Chicken/ghost-static-site-generator) that generates static websites from Ghost CMS instances. It's designed to work with the Ghosts-Toaster multi-site platform, using wpull instead of wget for improved site crawling.

## Architecture

The tool follows a command-line interface pattern with modular helper functions:

- **Entry Point**: `src/index.js` - Main executable that orchestrates the static site generation
- **Core Logic**: `src/commands/generateStaticSite.js` - Primary generation workflow
- **Configuration**: `src/constants/OPTIONS.js` - Centralized options and argument parsing
- **Helper Modules**: `src/helpers/*` - Specialized functions for URL processing, file operations, and content transformation

### Key Components

- **fetchUrlHelper**: Downloads content using wget or wpull
- **replaceUrlHelper**: Replaces source domain URLs with production domain URLs
- **responsiveImagesHelper**: Generates responsive image variants
- **removeQueryStringsHelper**: Cleans up query parameters from file names
- **copy404PageHelper**: Creates proper 404.html files

## Key Commands

### Development
```bash
# Install dependencies
npm install

# Run linting
npm run lint

# Run tests with coverage
npm run test

# Preview generated static site locally
npm run preview
```

### Static Site Generation
```bash
# Basic generation (localhost:2368 to ./static/)
node src/index.js

# Generate from custom domain
node src/index.js --domain http://ghost.example.com:2368

# Generate with production URL replacement
node src/index.js --productionDomain https://www.example.com

# Generate to custom directory
node src/index.js --dest my-static-site

# Use wpull instead of wget (recommended for Ghosts-Toaster)
node src/index.js --use-wpull

# Generate and preview
node src/index.js --preview

# Silent mode (hide download progress)
node src/index.js --silent

# Fail on errors (for CI/CD)
node src/index.js --fail-on-error
```

### Docker Usage
```bash
# Build Docker image
docker build -t ghosts-toaster-site-generator:latest .

# Run with mounted output directory
docker run --rm -it \
  -v ./data:/data \
  ghosts-toaster-site-generator:latest \
  --domain http://ghost:2368 \
  --productionDomain https://www.example.com
```

## Configuration Options

The tool uses yargs for command-line argument parsing. Key options include:

- `--domain` / `--sourceDomain`: Source Ghost instance URL (default: http://localhost:2368)
- `--productionDomain` / `--url`: Target production domain for URL replacement
- `--dest`: Output directory (default: "static")
- `--use-wpull`: Use wpull instead of wget for crawling
- `--avoid-https`: Add X-Forwarded-Proto header to prevent HTTPS redirects
- `--silent`: Hide download progress
- `--preview`: Start local server after generation
- `--fail-on-error`: Exit with error code on failures
- `--ignore-absolute-paths`: Convert all URLs to relative paths
- `--save-as-referer`: Save redirected assets with original paths

## Integration with Ghosts-Toaster

This fork is specifically designed to work within the Ghosts-Toaster Docker environment:

- Uses wpull for more reliable crawling of containerized Ghost instances
- Handles internal Docker networking (ghost_sitename:2368)
- Supports X-Forwarded-Proto headers for HTTPS handling
- Integrates with the webhook-triggered generation workflow

## File Processing Workflow

1. **Site Crawling**: Downloads all pages and assets from Ghost instance
2. **Asset Processing**: Generates responsive images and handles redirects
3. **URL Replacement**: Replaces source domain URLs with production domain
4. **File Cleanup**: Removes query strings and normalizes file names
5. **404 Page**: Creates proper 404.html from Ghost's 404 page

## Testing

The project uses Jest for testing with coverage reporting. Tests focus on:

- URL replacement logic (`replaceUrlHelper.test.js`)
- Domain conversion functionality
- Helper function behavior

## Known Limitations

- Primarily tested with Ghost 4.48.2
- Full support mainly for Casper theme (other themes may need manual asset copying)
- Requires Node.js >=12
- wget/wpull dependency for content crawling
