# ghosts-toaster-site-generator

A tool for generating static sites from [Ghost](https://ghost.org/) blogs. This fork extends the [original ghost-static-site-generator](https://github.com/Fried-Chicken/ghost-static-site-generator) with support for [wpull](https://github.com/ArchiveTeam/ludios_wpull), a Python-based web crawler that enables in-process content transformation during download.

## Why wpull?

The original tool uses wget to mirror a Ghost site, then performs URL replacement as a post-processing step over the downloaded files. This fork adds the option to use wpull instead, which offers several advantages:

- **In-process content transformation**: A wpull plugin (`ghost_domains.py`) rewrites URLs in HTML, CSS, and JavaScript as content is downloaded, rather than after the fact.
- **Better resource discovery**: wpull has native sitemap support and more thorough link following.
- **Alternative domain support**: Multiple source domains (e.g. CDN domains, internal hostnames) can be mapped to a single source, ensuring all references are rewritten consistently.
- **Domain filtering**: The plugin intercepts URL decisions to remap production-domain URLs back to the source domain for retrieval, and blocks requests to the Ghost admin interface (`/ghost/`).

The wget path remains available and works as described in the original project.

## Prerequisites

- Node.js >= 12 (or LTS)
- **wget** v1.16+ (for wget mode), or
- **wpull** 5.0.3+ via [ludios_wpull](https://github.com/ArchiveTeam/ludios_wpull) (for wpull mode; requires Python 3)

## Installation

### From source

```bash
git clone https://github.com/inconceivableza/ghosts-toaster-site-generator.git
cd ghosts-toaster-site-generator
npm install
```

For wpull mode, also install wpull:

```bash
pip install --no-binary lxml git+https://github.com/ArchiveTeam/ludios_wpull@5.0.3
```

### Docker

Two Dockerfiles are provided:

- **`Dockerfile`** -- lightweight Alpine image with wget
- **`Dockerfile-static-generator`** -- Alpine image with both Node.js and wpull (Python), intended for use with the ghosts-toaster platform

```bash
# Build the wpull-capable image
docker build -f Dockerfile-static-generator -t ghosts-toaster-site-generator:latest .

# Run with mounted output directory
mkdir -p ./data
docker run --rm -it \
    -v ./data:/data \
    ghosts-toaster-site-generator:latest \
    --use-wpull \
    --domain http://ghost:2368 \
    --productionDomain https://www.myblog.com
```

#### Docker networking

- To access a Ghost instance on the host: add `--network host`
- To access another container:
  1. `docker network create --attachable ghost-scrape`
  2. `docker network connect ghost-scrape <YOUR_GHOST_CONTAINER>`
  3. Add `--network ghost-scrape` to the docker run command

## Usage

By default the tool targets `http://localhost:2368` and writes output to a `static/` directory.

```bash
# Basic generation using wget (default)
node src/index.js

# Use wpull instead of wget
node src/index.js --use-wpull

# Specify source and production domains
node src/index.js --use-wpull \
    --domain http://ghost.internal:2368 \
    --productionDomain https://www.myblog.com

# Map alternative domains (CDN, old hostnames) to the source
node src/index.js --use-wpull \
    --domain http://ghost.internal:2368 \
    --productionDomain https://www.myblog.com \
    --altDomains cdn.myblog.com,old.myblog.com

# Output to a custom directory
node src/index.js --dest my-static-site

# Generate and preview in browser
node src/index.js --preview

# Subdirectory hosting
node src/index.js --dest blog --subDir blog

# Silent mode (hide download output)
node src/index.js --silent

# Exit non-zero on errors (useful for CI)
node src/index.js --fail-on-error
```

## CLI Options

| Option | Description | Default |
|---|---|---|
| `--domain`, `--sourceDomain` | Ghost instance URL to crawl | `http://localhost:2368` |
| `--productionDomain`, `--url` | Domain to substitute into generated files | same as `--domain` |
| `--dest` | Output directory | `static` |
| `--use-wpull` | Use wpull instead of wget | `false` |
| `--altDomains` | Comma-separated alternative domains to remap (wpull only) | |
| `--preview` | Start a local server and open the site after generation | `false` |
| `--silent` | Suppress download progress output | `false` |
| `--fail-on-error` | Exit with error code on download failures | `false` |
| `--ignore-absolute-paths` | Convert all URLs to relative paths | `false` |
| `--subDir` | Rewrite paths for subdirectory hosting | |
| `--avoid-https` | Send `X-Forwarded-Proto: https` header to prevent HTTPS redirects | `false` |
| `--saveAsReferer` | Save redirected assets at the original referer path | `false` |

## How It Works

### wget mode (original behaviour)

1. Crawls the Ghost site recursively with wget
2. Parses sitemaps to discover additional pages
3. Post-processes all downloaded HTML, CSS, JS, and XML files to replace the source domain with the production domain

### wpull mode (this fork)

1. Crawls the Ghost site with wpull, loading `ghost_domains.py` as a plugin
2. The plugin's `accept_url` hook intercepts each URL decision:
   - Remaps production-domain and alternative-domain URLs back to the source domain
   - Blocks Ghost admin interface URLs (`/ghost/`)
3. The plugin's `handle_response` hook transforms content in real time:
   - **HTML**: canonical links, Open Graph tags, Twitter Cards, JSON-LD, RSS/Atom feeds, srcset attributes, protocol-relative URLs
   - **CSS**: `url()` functions, `@import` statements
   - **JavaScript**: string literals, template literals, object properties, comments
4. Standard post-processing (query string removal, 404 page copy, responsive images) runs after the crawl

### Environment variables (wpull plugin)

The Node.js orchestrator passes these to the wpull subprocess:

| Variable | Purpose |
|---|---|
| `SOURCE_DOMAIN` | The Ghost instance URL being crawled |
| `PRODUCTION_DOMAIN` | The target domain for URL replacement |
| `ALT_DOMAINS` | Space-separated list of alternative domains to remap |

## Development

```bash
npm install       # install dependencies
npm run lint      # run ESLint
npm test          # run Jest tests with coverage
npm run preview   # serve the static/ directory locally
```

## Known Limitations

- Primarily tested with Ghost 4.48.2
- Themes other than Casper may require manual copying of theme-specific asset files
- The wpull plugin's HTML transformation has known issues with some regex patterns for Open Graph and Twitter Card tags (unbalanced parentheses in the regex)

## Upstream

- Original project: [Fried-Chicken/ghost-static-site-generator](https://github.com/Fried-Chicken/ghost-static-site-generator)
- Forked via: [SimonMo88/ghost-static-site-generator](https://github.com/SimonMo88/ghost-static-site-generator)

## Contributing

This is still a work in progress, please feel free to contribute by raising issues or creating pr's.

## License

MIT
