#!/usr/bin/env python

"""This is a plugin for wpull that intelligently adjusts domains when mirroring a ghost site for static serving
It is intended for use with the --plugin-script option for wpull, not to be run as a main program
Note that the SOURCE_DOMAIN and PRODUCTION_DOMAIN values must be passed to wpull as environment variables

Enhanced with real-time content transformation capabilities to replace URLs during download."""

import re
import mimetypes
from wpull.application.hook import Actions
from wpull.application.plugin import WpullPlugin, PluginFunctions, hook, event
from wpull.protocol.abstract.request import BaseResponse
from wpull.pipeline.session import ItemSession
import wpull
import logging
import os

class GhostDomainsPlugin(WpullPlugin):
    logger = logging.getLogger('wpull.plugin.ghost_domains') # this has to start with wpull or the logging will be filtered
    SOURCE_DOMAIN = os.environ.get('SOURCE_DOMAIN')
    PRODUCTION_DOMAIN = os.environ.get('PRODUCTION_DOMAIN')
    ALT_DOMAINS = os.environ.get('ALT_DOMAINS', '').split()
    SOURCE_DOMAINS = [SOURCE_DOMAIN] + ALT_DOMAINS
    # When set, gssg connects to FETCH_DOMAIN but treats content as if from SOURCE_DOMAIN
    FETCH_DOMAIN = os.environ.get('FETCH_DOMAIN') or SOURCE_DOMAIN

    def __init__(self):
        super().__init__()
        self.source_domain_without_protocol = None
        self.production_domain_without_protocol = None
        if self.SOURCE_DOMAIN and self.PRODUCTION_DOMAIN:
            self.source_domain_without_protocol = re.sub(r'^https?://', '', self.SOURCE_DOMAIN)
            self.production_domain_without_protocol = re.sub(r'^https?://', '', self.PRODUCTION_DOMAIN)
        self.source_domains = [re.sub(r'^https?://', '', source_domain) for source_domain in self.SOURCE_DOMAINS]
        self.source_domain_searches = [rf'(https?:)?//{self._escape_regex(source_domain)}' for source_domain in self.SOURCE_DOMAINS]
        self.fetch_domain = self.FETCH_DOMAIN or self.SOURCE_DOMAIN

    def activate(self):
        super().activate()
        if not self.SOURCE_DOMAIN:
            self.logger.warn(f"Did not find SOURCE_DOMAIN in environment; will not remap ghost production urls")
        if not self.PRODUCTION_DOMAIN:
            self.logger.warn(f"Did not find PRODUCTION_DOMAIN in environment; will not remap ghost production urls")
        if self.SOURCE_DOMAIN and self.PRODUCTION_DOMAIN:
            self.logger.info(f"Will remap {self.PRODUCTION_DOMAIN} to {self.SOURCE_DOMAIN}")
        if self.ALT_DOMAINS:
            self.logger.info(f"Will remap any of {self.ALT_DOMAINS} to {self.SOURCE_DOMAIN}")
        if self.fetch_domain and self.fetch_domain != self.SOURCE_DOMAIN:
            self.logger.info(f"Will fetch from {self.fetch_domain} instead of {self.SOURCE_DOMAIN}")

    def deactivate(self):
        super().deactivate()

    def _escape_regex(self, string):
        """Escapes special regex characters in a string"""
        return re.escape(string)

    def _transform_html_content(self, content):
        """Transform HTML content to replace URLs in various contexts"""
        if not self.SOURCE_DOMAIN or not self.PRODUCTION_DOMAIN:
            return content
        for source_domain_search in self.source_domain_searches:
            # Replace canonical URLs
            content = re.sub(
                rf'(<link[^>]+rel=["\']canonical["\'][^>]+href=["\'])(.*?)({source_domain_search})(.*?)(["\'][^>]*>)',
                rf'\1\2{self.PRODUCTION_DOMAIN}\4\5',
                content, flags=re.IGNORECASE
            )

            # Replace Open Graph URLs
            content = re.sub(
                rf'(<meta[^>]+property=["\']og:[^"\']*["\'][^>]+content=["\'])(.*?)({source_domain_search})(.*?)(["\'][^>]*>)',
                rf'\1\2{self.PRODUCTION_DOMAIN}\4\5',
                content, flags=re.IGNORECASE
            )

            # Replace Twitter Card URLs
            content = re.sub(
                rf'(<meta[^>]+name=["\']twitter:[^"\']*["\'][^>]+content=["\'])(.*?)({source_domain_search})(.*?)(["\'][^>]*>)',
                rf'\1\2{self.PRODUCTION_DOMAIN}\4\5',
                content, flags=re.IGNORECASE
            )

        # Replace srcset attributes with root-relative paths
        def replace_srcset(match):
            srcset_value = match.group(1)
            updated_srcset = []
            for source in srcset_value.split(','):
                source = source.strip()
                # Strip full URL (with protocol) first
                for source_url in self.SOURCE_DOMAINS:
                    source = re.sub(self._escape_regex(source_url), '', source, flags=re.IGNORECASE)
                # Strip protocol-relative URL (//domain)
                source = re.sub(f'//{self._escape_regex(self.source_domain_without_protocol)}',
                               '', source, flags=re.IGNORECASE)
                updated_srcset.append(source)
            return f'srcset="{", ".join(updated_srcset)}"'

        content = re.sub(r'srcset=["\']([^"\']+)["\']', replace_srcset, content, flags=re.IGNORECASE)
        content = re.sub(r'data-srcset=["\']([^"\']+)["\']', replace_srcset, content, flags=re.IGNORECASE)

        for source_domain_search in self.source_domain_searches:
            # Replace JSON-LD structured data URLs
            content = re.sub(
                rf'(<script[^>]*type=["\']application/ld\+json["\'][^>]*>[^<]*)({source_domain_search})([^<]*</script>)',
                rf'\1{self.PRODUCTION_DOMAIN}\3',
                content, flags=re.IGNORECASE
            )

            # Replace RSS/Atom feed links
            content = re.sub(
                rf'(<link[^>]+type=["\']application/(?:rss|atom)\+xml["\'][^>]+href=["\'])(.*?)({source_domain_search})(.*?)(["\'][^>]*>)',
                rf'\1\2{self.PRODUCTION_DOMAIN}\4\5',
                content, flags=re.IGNORECASE
            )

        # Replace protocol-relative URLs (only those that actually start with //)
        for source_domain in self.source_domains:
            content = re.sub(
                rf'(<(?:meta|link)[^>]+(?:content|href)=["\'])(//{self._escape_regex(source_domain)})([^"\']*["\'][^>]*>)',
                rf'\1//{self.production_domain_without_protocol}\3',
                content, flags=re.IGNORECASE
            )

        return content

    def _transform_css_content(self, content):
        """Transform CSS content to strip SOURCE_DOMAIN → root-relative paths in url() and @import"""
        if not self.SOURCE_DOMAIN or not self.PRODUCTION_DOMAIN:
            return content

        for source_url, source_host in zip(self.SOURCE_DOMAINS, self.source_domains):
            # Strip URLs in url() functions → root-relative /path
            content = re.sub(
                rf'url\(\s*(["\']?)(.*?)({self._escape_regex(source_url)})(.*?)\1\s*\)',
                rf'url(\1\2\4\1)',
                content, flags=re.IGNORECASE
            )

            # Strip protocol-relative URLs in url() functions → root-relative /path
            content = re.sub(
                rf'url\(\s*(["\']?)([^"\']*?)(//{self._escape_regex(source_host)})([^"\']*?)\1\s*\)',
                rf'url(\1\2\4\1)',
                content, flags=re.IGNORECASE
            )

            # Strip URLs in @import statements → root-relative /path
            content = re.sub(
                rf'@import\s+(["\'])(.*?)({self._escape_regex(source_url)})(.*?)\1',
                rf'@import \1\2\4\1',
                content, flags=re.IGNORECASE
            )

            content = re.sub(
                rf'@import\s+url\(\s*(["\']?)(.*?)({self._escape_regex(source_url)})(.*?)\1\s*\)',
                rf'@import url(\1\2\4\1)',
                content, flags=re.IGNORECASE
            )

            # Strip protocol-relative URLs in @import statements → root-relative /path
            content = re.sub(
                rf'@import\s+(["\'])([^"\']*?)(//{self._escape_regex(source_host)})([^"\']*?)\1',
                rf'@import \1\2\4\1',
                content, flags=re.IGNORECASE
            )

        return content

    def _transform_javascript_content(self, content):
        """Transform JavaScript content to strip SOURCE_DOMAIN → root-relative paths"""
        if not self.SOURCE_DOMAIN or not self.PRODUCTION_DOMAIN:
            return content

        for source_url, source_host in zip(self.SOURCE_DOMAINS, self.source_domains):
            # Strip URLs in string literals (single and double quotes) → root-relative
            content = re.sub(
                rf'(["\'])(.*?)({self._escape_regex(source_url)})(.*?)\1',
                rf'\1\2\4\1',
                content
            )

            # Strip URLs in template literals → root-relative
            content = re.sub(
                rf'(`)(.*?)({self._escape_regex(source_url)})(.*?)`',
                rf'\1\2\4`',
                content
            )

            # Strip protocol-relative URLs in strings → root-relative
            content = re.sub(
                rf'(["\'])([^"\']*?)(//{self._escape_regex(source_host)})([^"\']*?)\1',
                rf'\1\2\4\1',
                content
            )

            # Strip URLs in JavaScript object properties → root-relative
            content = re.sub(
                rf'(url|href|src)\s*:\s*(["\'])(.*?)({self._escape_regex(source_url)})(.*?)\2',
                rf'\1: \2\3\5\2',
                content
            )

            # Strip URLs in JavaScript single-line comments
            # The path after the domain is preserved (not part of the match)
            content = re.sub(
                rf'(//.*?)({self._escape_regex(source_url)})',
                rf'\1',
                content
            )

            # Strip URLs in JavaScript multi-line comments → root-relative
            content = re.sub(
                rf'(/\*.*?)({self._escape_regex(source_url)})(.*?\*/)',
                rf'\1\3',
                content, flags=re.DOTALL
            )

        return content

    def _detect_encoding(self, content, content_type):
        """Determine encoding from Content-Type charset, then XML declaration, defaulting to UTF-8."""
        # 1. Charset parameter in the Content-Type header takes highest priority
        if content_type:
            charset_match = re.search(r'charset=([^\s;]+)', content_type, re.IGNORECASE)
            if charset_match:
                return charset_match.group(1).strip('"\'')
        # 2. XML encoding declaration in the leading bytes (ASCII-safe scan)
        if isinstance(content, bytes):
            preamble = content[:200].decode('ascii', errors='replace')
            xml_enc = re.search(r'<\?xml[^>]+encoding=["\']([^"\']+)["\']', preamble, re.IGNORECASE)
            if xml_enc:
                return xml_enc.group(1)
        return 'utf-8'

    def _decode_content(self, content, content_type, url):
        """Decode bytes using the detected encoding, returning None and logging on failure."""
        if not isinstance(content, bytes):
            return content
        encoding = self._detect_encoding(content, content_type)
        try:
            return content.decode(encoding)
        except (UnicodeDecodeError, LookupError) as e:
            self.logger.warning(f'Skipping transformation of {url}: could not decode as {encoding}: {e}')
            return None

    def _transform_content_by_type(self, content, content_type, url):
        """Transform content based on its MIME type"""
        if not content_type:
            return content

        # Determine transformation based on content type — decode only for known text types
        if content_type.startswith('text/html'):
            content_str = self._decode_content(content, content_type, url)
            if content_str is None:
                return content
            transformed = self._transform_html_content(content_str)
            if transformed != content_str:
                self.logger.info(f'Transformed HTML content in {url}')
                self.logger.info(f'Counted source {self.SOURCE_DOMAIN} {content_str.count(self.SOURCE_DOMAIN)} -> {transformed.count(self.SOURCE_DOMAIN)}')
                for alt_domain in self.ALT_DOMAINS:
                    self.logger.info(f'Counted alt source {alt_domain} {content_str.count(alt_domain)} -> {transformed.count(alt_domain)}')
                self.logger.info(f'Counted production {self.PRODUCTION_DOMAIN} {content_str.count(self.PRODUCTION_DOMAIN)} -> {transformed.count(self.PRODUCTION_DOMAIN)}')
                self.logger.info(f'Counted Toaster/TOASTER {content_str.count("Toaster")}/{content_str.count("TOASTER")} -> {transformed.count("Toaster")}/{transformed.count("TOASTER")}')
        elif content_type.startswith('text/css'):
            content_str = self._decode_content(content, content_type, url)
            if content_str is None:
                return content
            transformed = self._transform_css_content(content_str)
            if transformed != content_str:
                self.logger.info(f'Transformed CSS content in {url}')
        elif content_type.startswith(('application/javascript', 'text/javascript', 'application/x-javascript')):
            content_str = self._decode_content(content, content_type, url)
            if content_str is None:
                return content
            transformed = self._transform_javascript_content(content_str)
            if transformed != content_str:
                self.logger.info(f'Transformed JavaScript content in {url}')
        elif any(content_type.startswith(t) for t in ('text/', 'application/json', 'application/xml',
                                                       'application/xhtml', 'application/rss+xml',
                                                       'application/atom+xml')):
            content_str = self._decode_content(content, content_type, url)
            if content_str is None:
                return content
            transformed = content_str.replace(self.SOURCE_DOMAIN, self.PRODUCTION_DOMAIN)
            if self.source_domain_without_protocol and self.production_domain_without_protocol:
                transformed = transformed.replace(f'//{self.source_domain_without_protocol}',
                                                f'//{self.production_domain_without_protocol}')
        else:
            return content

        # Convert back to bytes if original was bytes
        if isinstance(content, bytes):
            return transformed.encode('utf-8')
        else:
            return transformed

    @hook(PluginFunctions.accept_url)
    def my_accept_func(self, item_session: ItemSession, verdict: bool, reasons: dict) -> bool:
        if not self.PRODUCTION_DOMAIN or not self.SOURCE_DOMAIN:
            # this means that this is not properly set up in order to be able to filter domains
            return True
        url = item_session.request.url
        if url.startswith(self.PRODUCTION_DOMAIN):
            # Remap production domain to fetch domain (queued as a new URL so accept_url runs again)
            adjusted_url = url.replace(self.PRODUCTION_DOMAIN, self.fetch_domain, 1)
            item_session.add_child_url(adjusted_url)
            self.logger.info(f'Production domain remap: rather than retrieving {url}, will retrieve {adjusted_url}')
            return False
        elif url.startswith(self.SOURCE_DOMAIN):
            if url.startswith(self.SOURCE_DOMAIN.rstrip('/') + '/ghost/'):
                self.logger.info(f'Not retrieving ghost admin interface url: {url}')
                return False
            if self.fetch_domain != self.SOURCE_DOMAIN:
                # Remap source domain URL to fetch domain - add as new child and reject this URL.
                # (Mutating item_session.request.url in accept_url is not honoured by wpull.)
                adjusted_url = url.replace(self.SOURCE_DOMAIN, self.fetch_domain, 1)
                item_session.add_child_url(adjusted_url)
                self.logger.info(f'Source domain fetch remap: {url} -> {adjusted_url}')
                return False
            else:
                self.logger.debug(f'Source domain detected: retrieving {url}')
            return True
        elif self.fetch_domain != self.SOURCE_DOMAIN and url.startswith(self.fetch_domain):
            # URL already in fetch-domain space (e.g. the starting URL passed by crawlPageHelper)
            if url.startswith(self.fetch_domain.rstrip('/') + '/ghost/'):
                self.logger.info(f'Not retrieving ghost admin interface url: {url}')
                return False
            self.logger.debug(f'Fetch domain detected: retrieving {url}')
            return True
        for alt_domain in self.ALT_DOMAINS:
            if url.startswith(alt_domain):
                adjusted_url = url.replace(alt_domain, self.fetch_domain, 1)
                item_session.add_child_url(adjusted_url)
                self.logger.info(f'Alt domain remap: {url} -> {adjusted_url}')
                return False
        self.logger.debug(f'No domain detected: not retrieving {url}')
        return False

    @hook(PluginFunctions.handle_response)
    def handle_response_transformation(self, item_session: ItemSession):
        """Process response content and transform URLs in real-time"""
        if not item_session.response or not item_session.response.body:
            return Actions.NORMAL

        # Get content type from response headers
        content_type = None
        if hasattr(item_session.response, 'fields') and item_session.response.fields:
            content_type = item_session.response.fields.get('content-type', '').lower()

        # Transform content based on type
        if hasattr(item_session.response.body, 'content') and item_session.response.body.content:
            original_content = item_session.response.body.content()
            transformed_content = self._transform_content_by_type(
                original_content,
                content_type,
                item_session.request.url
            )

            # Update the response body if content was transformed
            if transformed_content != original_content:
                # this rewrites the saved data
                item_session.response.body.file.seek(0)
                item_session.response.body.file.write(transformed_content)
                item_session.response.body._content_data = transformed_content
                self.logger.info(f'Real-time transformation applied to {item_session.request.url}')

        return Actions.NORMAL

    # to enable these stubs, uncomment the @event decorator

    # @event(PluginFunctions.get_urls)
    def my_get_urls(self, item_session: ItemSession):
        self.logger.debug(f'get_urls: {item_session.request.url}')

    # @event(PluginFunctions.queued_url)
    def my_queued_url(self, url_info: wpull.url.URLInfo):
        self.logger.debug(f'queued_url: {url_info.url}')

    # @event(PluginFunctions.dequeued_url)
    def my_dequeued_url(self, url_info: wpull.url.URLInfo, record_info: wpull.pipeline.item.URLRecord):
        self.logger.debug(f'dequeued_url: {url_info.url} -> {record_info.url}')


if __name__ == '__main__':
    print(__doc__)

