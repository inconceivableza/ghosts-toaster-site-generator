/**
 * Test fixtures containing problematic Ghost content patterns that have been known
 * to cause issues with URL transformation in static site generation.
 *
 * These patterns are based on real Ghost themes and content structures.
 */

const GHOST_DOMAIN = 'http://ghost.example.com:2368';
const PRODUCTION_DOMAIN = 'https://www.example.com';

const fixtures = {
  /**
   * Complete Ghost page with Casper theme patterns
   */
  casperThemePage: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>Test Post - My Ghost Blog</title>
    <meta name="description" content="This is a test post for URL transformation">
    <meta name="HandheldFriendly" content="True">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <link rel="shortcut icon" href="${GHOST_DOMAIN}/favicon.ico" type="image/x-icon">
    <link rel="canonical" href="${GHOST_DOMAIN}/test-post/">
    <meta name="referrer" content="no-referrer-when-downgrade">

    <meta property="og:site_name" content="My Ghost Blog">
    <meta property="og:type" content="article">
    <meta property="og:title" content="Test Post">
    <meta property="og:description" content="This is a test post for URL transformation">
    <meta property="og:url" content="${GHOST_DOMAIN}/test-post/">
    <meta property="og:image" content="${GHOST_DOMAIN}/content/images/2021/03/test-image.jpg">

    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="Test Post">
    <meta name="twitter:description" content="This is a test post for URL transformation">
    <meta name="twitter:url" content="${GHOST_DOMAIN}/test-post/">
    <meta name="twitter:image" content="${GHOST_DOMAIN}/content/images/2021/03/test-image.jpg">

    <script type="application/ld+json">
{
    "@context": "https://schema.org",
    "@type": "Article",
    "publisher": {
        "@type": "Organization",
        "name": "My Ghost Blog",
        "url": "${GHOST_DOMAIN}",
        "logo": {
            "@type": "ImageObject",
            "url": "${GHOST_DOMAIN}/content/images/2021/03/logo.png",
            "width": 60,
            "height": 60
        }
    },
    "author": {
        "@type": "Person",
        "name": "Test Author",
        "url": "${GHOST_DOMAIN}/author/test-author/",
        "image": {
            "@type": "ImageObject",
            "url": "${GHOST_DOMAIN}/content/images/2021/03/author-avatar.jpg",
            "width": 2000,
            "height": 2000
        }
    },
    "headline": "Test Post",
    "url": "${GHOST_DOMAIN}/test-post/",
    "image": {
        "@type": "ImageObject",
        "url": "${GHOST_DOMAIN}/content/images/2021/03/test-image.jpg",
        "width": 2000,
        "height": 1125
    },
    "keywords": "test, ghost, blog",
    "description": "This is a test post for URL transformation"
}
    </script>

    <meta name="generator" content="Ghost 4.48">
    <link rel="alternate" type="application/rss+xml" title="My Ghost Blog" href="${GHOST_DOMAIN}/rss/">
    <link rel="alternate" type="application/atom+xml" title="My Ghost Blog" href="${GHOST_DOMAIN}/atom.xml">

    <link rel="stylesheet" type="text/css" href="${GHOST_DOMAIN}/assets/built/screen.css?v=abc123">

    <style>
        .site-header {
            background-image: url('${GHOST_DOMAIN}/content/images/2021/03/header-bg.jpg');
            background-size: cover;
        }

        @import "${GHOST_DOMAIN}/assets/built/fonts.css";
        @import url("${GHOST_DOMAIN}/assets/built/normalize.css");

        .site-logo {
            background: url(//${GHOST_DOMAIN.replace('http://', '')}/content/images/logo.svg) no-repeat;
        }
    </style>
</head>
<body class="post-template">
    <div class="site-wrapper">
        <header class="site-header">
            <div class="site-header-content">
                <a class="site-logo" href="${GHOST_DOMAIN}/">
                    <img src="${GHOST_DOMAIN}/content/images/2021/03/logo.png" alt="My Ghost Blog">
                </a>
                <nav class="site-nav">
                    <ul>
                        <li><a href="${GHOST_DOMAIN}/">Home</a></li>
                        <li><a href="${GHOST_DOMAIN}/about/">About</a></li>
                        <li><a href="${GHOST_DOMAIN}/contact/">Contact</a></li>
                    </ul>
                </nav>
            </div>
        </header>

        <main class="site-main">
            <article class="post">
                <header class="post-header">
                    <h1 class="post-title">Test Post</h1>
                    <div class="post-meta">
                        <a href="${GHOST_DOMAIN}/author/test-author/">Test Author</a>
                        <time>March 15, 2021</time>
                    </div>
                </header>

                <figure class="post-image">
                    <img src="${GHOST_DOMAIN}/content/images/2021/03/test-image.jpg"
                         srcset="${GHOST_DOMAIN}/content/images/size/w400/2021/03/test-image.jpg 400w,
                                 ${GHOST_DOMAIN}/content/images/size/w800/2021/03/test-image.jpg 800w,
                                 ${GHOST_DOMAIN}/content/images/size/w1200/2021/03/test-image.jpg 1200w,
                                 ${GHOST_DOMAIN}/content/images/2021/03/test-image.jpg 2000w"
                         sizes="(max-width: 800px) 400px, (max-width: 1200px) 800px, 1200px"
                         alt="Test Image">
                </figure>

                <div class="post-content">
                    <p>This is a test post with various URL patterns that need to be transformed.</p>

                    <p>Links to other posts: <a href="${GHOST_DOMAIN}/another-post/">Another Post</a></p>

                    <figure>
                        <img src="${GHOST_DOMAIN}/content/images/2021/03/inline-image.jpg" alt="Inline image">
                    </figure>

                    <p>Lazy loaded images with data attributes:</p>
                    <img class="lazy"
                         data-src="${GHOST_DOMAIN}/content/images/2021/03/lazy-image.jpg"
                         data-srcset="${GHOST_DOMAIN}/content/images/size/w400/2021/03/lazy-image.jpg 400w,
                                      ${GHOST_DOMAIN}/content/images/size/w800/2021/03/lazy-image.jpg 800w"
                         alt="Lazy loaded image">
                </div>
            </article>
        </main>

        <footer class="site-footer">
            <p>&copy; 2021 <a href="${GHOST_DOMAIN}/">My Ghost Blog</a></p>
        </footer>
    </div>

    <script>
        // Ghost theme JavaScript patterns
        (function($) {
            'use strict';

            var ghostConfig = {
                apiUrl: "${GHOST_DOMAIN}/ghost/api/v3/content/",
                adminUrl: '${GHOST_DOMAIN}/ghost/',
                url: "${GHOST_DOMAIN}",
                version: "4.48.2"
            };

            // Image lazy loading
            var imageBase = "${GHOST_DOMAIN}/content/images/";
            var imageCdn = "//${GHOST_DOMAIN.replace('http://', '')}/content/images/";

            // AJAX endpoint
            var ajaxUrl = \`${GHOST_DOMAIN}/ghost/api/v3/content/posts/\`;

            // Protocol-relative API calls
            fetch("//${GHOST_DOMAIN.replace('http://', '')}/api/posts/")
                .then(response => response.json())
                .then(data => {
                    console.log('Posts loaded from:', "${GHOST_DOMAIN}");
                });

            // Comments with URLs
            // Base URL: ${GHOST_DOMAIN}
            /*
             * API endpoint: ${GHOST_DOMAIN}/ghost/api/v3/content/
             * CDN URL: ${GHOST_DOMAIN}/content/
             */

        })(jQuery);
    </script>

    <script src="${GHOST_DOMAIN}/assets/built/main.js?v=abc123"></script>
</body>
</html>`,

  /**
   * CSS file with various URL patterns from Ghost themes
   */
  themeCssFile: `/* Ghost Theme CSS - Casper */

/* Font imports */
@import "${GHOST_DOMAIN}/assets/fonts/inter.css";
@import url("${GHOST_DOMAIN}/assets/fonts/fira-code.css");
@import url(${GHOST_DOMAIN}/assets/fonts/source-sans-pro.css);

/* Protocol-relative imports */
@import "//${GHOST_DOMAIN.replace('http://', '')}/assets/css/normalize.css";

/* Background images */
.site-header {
    background: linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)),
                url('${GHOST_DOMAIN}/content/images/header-bg.jpg') center/cover;
}

.site-logo {
    background-image: url("${GHOST_DOMAIN}/content/images/logo.svg");
    background-size: contain;
    background-repeat: no-repeat;
}

.post-card-image {
    background: url(${GHOST_DOMAIN}/content/images/default-post-image.jpg);
}

/* Mixed case URLs */
.footer-bg {
    background: URL('${GHOST_DOMAIN}/assets/images/footer-pattern.png');
}

.icon-sprite {
    background-image: URL("${GHOST_DOMAIN}/assets/icons/sprite.svg");
}

/* Protocol-relative URLs */
.cdn-image {
    background: url(//${GHOST_DOMAIN.replace('http://', '')}/content/images/cdn-image.jpg);
}

/* Responsive images in CSS */
@media (max-width: 768px) {
    .hero-bg {
        background-image: url('${GHOST_DOMAIN}/content/images/size/w800/hero-mobile.jpg');
    }
}

@media (min-width: 769px) {
    .hero-bg {
        background-image: url('${GHOST_DOMAIN}/content/images/size/w1200/hero-desktop.jpg');
    }
}

/* Comments with URLs */
/* Header image: ${GHOST_DOMAIN}/content/images/header.jpg */
/*
 * Logo sprite: ${GHOST_DOMAIN}/assets/images/logo-sprite.png
 * Icon font: ${GHOST_DOMAIN}/assets/fonts/icons.woff2
 */`,

  /**
   * JavaScript file with complex Ghost API patterns
   */
  themeJavaScriptFile: `/**
 * Ghost Theme JavaScript - Advanced patterns
 */
(function(window, document, $) {
    'use strict';

    // Ghost configuration object
    var Ghost = {
        apiUrl: "${GHOST_DOMAIN}/ghost/api/v3/content/",
        adminUrl: "${GHOST_DOMAIN}/ghost/",
        url: "${GHOST_DOMAIN}",
        version: "4.48.2",

        // Image handling
        imageUrl: "${GHOST_DOMAIN}/content/images/",
        imageCdn: "//${GHOST_DOMAIN.replace('http://', '')}/content/images/",

        // API endpoints
        endpoints: {
            posts: "${GHOST_DOMAIN}/ghost/api/v3/content/posts/",
            pages: '${GHOST_DOMAIN}/ghost/api/v3/content/pages/',
            authors: \`${GHOST_DOMAIN}/ghost/api/v3/content/authors/\`,
            tags: "${GHOST_DOMAIN}/ghost/api/v3/content/tags/"
        }
    };

    // Theme functions
    var ThemeHelpers = {
        // Image URL building
        buildImageUrl: function(imagePath, size) {
            var baseUrl = "${GHOST_DOMAIN}/content/images/";
            if (size) {
                return baseUrl + "size/w" + size + "/" + imagePath;
            }
            return baseUrl + imagePath;
        },

        // API calls
        loadPosts: function(callback) {
            var url = "${GHOST_DOMAIN}/ghost/api/v3/content/posts/?key=abc123&limit=10";

            fetch(url)
                .then(function(response) {
                    if (response.url.indexOf("${GHOST_DOMAIN}") !== 0) {
                        throw new Error("Invalid response URL: " + response.url);
                    }
                    return response.json();
                })
                .then(callback)
                .catch(function(error) {
                    console.error("Failed to load from ${GHOST_DOMAIN}:", error);
                });
        },

        // URL validation
        isInternalUrl: function(url) {
            return url.indexOf("${GHOST_DOMAIN}") === 0 ||
                   url.indexOf("//${GHOST_DOMAIN.replace('http://', '')}") === 0;
        }
    };

    // Image lazy loading with srcset
    var LazyLoader = {
        init: function() {
            var images = document.querySelectorAll('img[data-src]');

            images.forEach(function(img) {
                var src = img.getAttribute('data-src');
                var srcset = img.getAttribute('data-srcset');

                if (src && src.indexOf("${GHOST_DOMAIN}") === 0) {
                    img.src = src;

                    if (srcset) {
                        img.srcset = srcset;
                    }
                }
            });
        }
    };

    // Search functionality
    var Search = {
        searchUrl: "${GHOST_DOMAIN}/ghost/api/v3/content/posts/?key=abc123&filter=",

        search: function(query) {
            var url = this.searchUrl + "title:~'" + query + "'";

            return fetch(url)
                .then(function(response) {
                    return response.json();
                })
                .then(function(data) {
                    return data.posts.map(function(post) {
                        return {
                            title: post.title,
                            url: "${GHOST_DOMAIN}/" + post.slug + "/",
                            excerpt: post.excerpt,
                            image: post.feature_image ? "${GHOST_DOMAIN}" + post.feature_image : null
                        };
                    });
                });
        }
    };

    // Protocol-relative URLs for CDN
    var CDN = {
        baseUrl: "//${GHOST_DOMAIN.replace('http://', '')}/content/",

        getImageUrl: function(path) {
            return this.baseUrl + "images/" + path;
        }
    };

    // Template literals with URLs
    var templates = {
        postCard: function(post) {
            return \`
                <div class="post-card">
                    <a href="${GHOST_DOMAIN}/\${post.slug}/">
                        <img src="${GHOST_DOMAIN}\${post.feature_image}" alt="\${post.title}">
                        <h3>\${post.title}</h3>
                    </a>
                </div>
            \`;
        }
    };

    // Mixed string concatenation
    var dynamicUrls = {
        buildPostUrl: function(slug) {
            return "${GHOST_DOMAIN}" + "/" + slug + "/";
        },

        buildAuthorUrl: function(slug) {
            return "${GHOST_DOMAIN}/author/" + slug + "/";
        },

        buildTagUrl: function(slug) {
            return \`${GHOST_DOMAIN}/tag/\${slug}/\`;
        }
    };

    // Event handlers with URL checks
    $(document).on('click', 'a[href]', function(e) {
        var href = $(this).attr('href');

        if (href.indexOf("${GHOST_DOMAIN}") === 0) {
            // Internal link handling
            console.log("Internal link clicked:", href);
        }
    });

    // Comments with various URL patterns
    // Base URL: ${GHOST_DOMAIN}
    // API Base: ${GHOST_DOMAIN}/ghost/api/v3/content/
    // CDN URL: //${GHOST_DOMAIN.replace('http://', '')}/content/

    /*
     * Ghost configuration:
     * - Site URL: ${GHOST_DOMAIN}
     * - Admin URL: ${GHOST_DOMAIN}/ghost/
     * - Content API: ${GHOST_DOMAIN}/ghost/api/v3/content/
     * - Image CDN: ${GHOST_DOMAIN}/content/images/
     */

    // Initialize theme
    $(document).ready(function() {
        LazyLoader.init();
        console.log("Theme initialized for:", "${GHOST_DOMAIN}");
    });

})(window, document, jQuery);`,

  /**
   * RSS/Atom feed with various URL patterns
   */
  rssFeed: `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:atom="http://www.w3.org/2005/Atom">
    <channel>
        <title>My Ghost Blog</title>
        <description>A Ghost blog for testing</description>
        <link>${GHOST_DOMAIN}/</link>
        <image>
            <url>${GHOST_DOMAIN}/content/images/logo.png</url>
            <title>My Ghost Blog</title>
            <link>${GHOST_DOMAIN}/</link>
        </image>
        <atom:link href="${GHOST_DOMAIN}/rss/" rel="self" type="application/rss+xml"/>

        <item>
            <title>Test Post</title>
            <description>A test post</description>
            <link>${GHOST_DOMAIN}/test-post/</link>
            <guid isPermaLink="false">${GHOST_DOMAIN}/test-post/</guid>
            <content:encoded><![CDATA[
                <p>Test content with <a href="${GHOST_DOMAIN}/other-post/">internal links</a>.</p>
                <img src="${GHOST_DOMAIN}/content/images/test.jpg" alt="Test">
            ]]></content:encoded>
        </item>
    </channel>
</rss>`,

  /**
   * Problematic patterns that have caused issues
   */
  problematicPatterns: {
    // URLs in data attributes
    dataAttributes: \`<div data-url="${GHOST_DOMAIN}" data-config='{"url": "${GHOST_DOMAIN}", "api": "${GHOST_DOMAIN}/api/"}'></div>\`,

    // URLs in HTML comments
    htmlComments: \`<!-- Ghost site: ${GHOST_DOMAIN} -->\n<!-- API: ${GHOST_DOMAIN}/ghost/api/ -->\`,

    // URLs in script tags as text content
    scriptContent: \`<script>window.ghostUrl = "${GHOST_DOMAIN}";</script>\`,

    // Protocol-relative URLs that might be missed
    protocolRelative: \`<img src="//${GHOST_DOMAIN.replace('http://', '')}/image.jpg">\`,

    // Mixed case attributes that might be missed
    mixedCase: \`<LINK REL="canonical" HREF="${GHOST_DOMAIN}/post/">\`,

    // URLs with query parameters and fragments
    urlsWithParams: \`<a href="${GHOST_DOMAIN}/search?q=test&sort=date#results">Search</a>\`,

    // Encoded URLs
    encodedUrls: \`<meta content="Visit ${GHOST_DOMAIN}/about%20us for more info">\`,

    // URLs in CSS calc() functions
    cssCalc: \`background: calc(100% - url('${GHOST_DOMAIN}/bg.jpg'));\`
  }
};

module.exports = {
  GHOST_DOMAIN,
  PRODUCTION_DOMAIN,
  fixtures
};