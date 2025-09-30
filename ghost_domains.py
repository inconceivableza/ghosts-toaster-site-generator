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

    def __init__(self):
        super().__init__()
        self.source_domain_without_protocol = None
        self.production_domain_without_protocol = None
        if self.SOURCE_DOMAIN and self.PRODUCTION_DOMAIN:
            self.source_domain_without_protocol = re.sub(r'^https?://', '', self.SOURCE_DOMAIN)
            self.production_domain_without_protocol = re.sub(r'^https?://', '', self.PRODUCTION_DOMAIN)

    def activate(self):
        super().activate()
        if not self.SOURCE_DOMAIN:
            self.logger.warn(f"Did not find SOURCE_DOMAIN in environment; will not remap ghost production urls")
        if not self.PRODUCTION_DOMAIN:
            self.logger.warn(f"Did not find PRODUCTION_DOMAIN in environment; will not remap ghost production urls")
        if self.SOURCE_DOMAIN and self.PRODUCTION_DOMAIN:
            self.logger.info(f"Will remap {self.PRODUCTION_DOMAIN} to {self.SOURCE_DOMAIN}")

    def deactivate(self):
        super().deactivate()

    def _escape_regex(self, string):
        """Escapes special regex characters in a string"""
        return re.escape(string)

    def _transform_html_content(self, content):
        """Transform HTML content to replace URLs in various contexts"""
        if not self.SOURCE_DOMAIN or not self.PRODUCTION_DOMAIN:
            return content

        # Replace canonical URLs
        content = re.sub(
            rf'(<link[^>]+rel=["\']canonical["\'][^>]+href=["\'])(.*?)({self._escape_regex(self.SOURCE_DOMAIN)})(.*?)(["\'][^>]*>)',
            rf'\1\2{self.PRODUCTION_DOMAIN}\4\5',
            content, flags=re.IGNORECASE
        )

        # Replace Open Graph URLs
        content = re.sub(
            rf'(<meta[^>]+property=["\']og:[^"\']*["\'][^>]+content=["\'])(.*?)({self._escape_regex(self.SOURCE_DOMAIN)})(.*?)(["\'][^>]*>)',
            rf'\1\2{self.PRODUCTION_DOMAIN}\4\5',
            content, flags=re.IGNORECASE
        )

        # Replace Twitter Card URLs
        content = re.sub(
            rf'(<meta[^>]+name=["\']twitter:[^"\']*["\'][^>]+content=["\'])(.*?)({self._escape_regex(self.SOURCE_DOMAIN)})(.*?)(["\'][^>]*>)',
            rf'\1\2{self.PRODUCTION_DOMAIN}\4\5',
            content, flags=re.IGNORECASE
        )

        # Replace srcset attributes
        def replace_srcset(match):
            srcset_value = match.group(1)
            updated_srcset = []
            for source in srcset_value.split(','):
                source = source.strip()
                source = re.sub(self._escape_regex(self.SOURCE_DOMAIN), self.PRODUCTION_DOMAIN, source, flags=re.IGNORECASE)
                source = re.sub(f'//{self._escape_regex(self.source_domain_without_protocol)}',
                               f'//{self.production_domain_without_protocol}', source, flags=re.IGNORECASE)
                updated_srcset.append(source)
            return f'srcset="{", ".join(updated_srcset)}"'

        content = re.sub(r'srcset=["\']([^"\']+)["\']', replace_srcset, content, flags=re.IGNORECASE)
        content = re.sub(r'data-srcset=["\']([^"\']+)["\']', replace_srcset, content, flags=re.IGNORECASE)

        # Replace JSON-LD structured data URLs
        content = re.sub(
            rf'(<script[^>]*type=["\']application/ld\+json["\'][^>]*>[^<]*)({self._escape_regex(self.SOURCE_DOMAIN)})([^<]*</script>)',
            rf'\1{self.PRODUCTION_DOMAIN}\3',
            content, flags=re.IGNORECASE
        )

        # Replace RSS/Atom feed links
        content = re.sub(
            rf'(<link[^>]+type=["\']application/(?:rss|atom)\+xml["\'][^>]+href=["\'])(.*?)({self._escape_regex(self.SOURCE_DOMAIN)})(.*?)(["\'][^>]*>)',
            rf'\1\2{self.PRODUCTION_DOMAIN}\4\5',
            content, flags=re.IGNORECASE
        )

        # Replace protocol-relative URLs (only those that actually start with //)
        content = re.sub(
            rf'(<(?:meta|link)[^>]+(?:content|href)=["\'])(//{self._escape_regex(self.source_domain_without_protocol)})([^"\']*["\'][^>]*>)',
            rf'\1//{self.production_domain_without_protocol}\3',
            content, flags=re.IGNORECASE
        )

        return content

    def _transform_css_content(self, content):
        """Transform CSS content to replace URLs in url() functions and @import statements"""
        if not self.SOURCE_DOMAIN or not self.PRODUCTION_DOMAIN:
            return content

        # Replace URLs in url() functions
        content = re.sub(
            rf'url\(\s*(["\']?)(.*?)({self._escape_regex(self.SOURCE_DOMAIN)})(.*?)\1\s*\)',
            rf'url(\1\2{self.PRODUCTION_DOMAIN}\4\1)',
            content, flags=re.IGNORECASE
        )

        # Replace protocol-relative URLs in url() functions
        content = re.sub(
            rf'url\(\s*(["\']?)([^"\']*?)(//{self._escape_regex(self.source_domain_without_protocol)})([^"\']*?)\1\s*\)',
            rf'url(\1\2//{self.production_domain_without_protocol}\4\1)',
            content, flags=re.IGNORECASE
        )

        # Replace URLs in @import statements
        content = re.sub(
            rf'@import\s+(["\'])(.*?)({self._escape_regex(self.SOURCE_DOMAIN)})(.*?)\1',
            rf'@import \1\2{self.PRODUCTION_DOMAIN}\4\1',
            content, flags=re.IGNORECASE
        )

        content = re.sub(
            rf'@import\s+url\(\s*(["\']?)(.*?)({self._escape_regex(self.SOURCE_DOMAIN)})(.*?)\1\s*\)',
            rf'@import url(\1\2{self.PRODUCTION_DOMAIN}\4\1)',
            content, flags=re.IGNORECASE
        )

        # Replace protocol-relative URLs in @import statements
        content = re.sub(
            rf'@import\s+(["\'])([^"\']*?)(//{self._escape_regex(self.source_domain_without_protocol)})([^"\']*?)\1',
            rf'@import \1\2//{self.production_domain_without_protocol}\4\1',
            content, flags=re.IGNORECASE
        )

        return content

    def _transform_javascript_content(self, content):
        """Transform JavaScript content to replace URLs in variables, strings, and comments"""
        if not self.SOURCE_DOMAIN or not self.PRODUCTION_DOMAIN:
            return content

        # Replace URLs in string literals (single and double quotes)
        content = re.sub(
            rf'(["\'])(.*?)({self._escape_regex(self.SOURCE_DOMAIN)})(.*?)\1',
            rf'\1\2{self.PRODUCTION_DOMAIN}\4\1',
            content
        )

        # Replace URLs in template literals
        content = re.sub(
            rf'(`)(.*?)({self._escape_regex(self.SOURCE_DOMAIN)})(.*?)`',
            rf'\1\2{self.PRODUCTION_DOMAIN}\4`',
            content
        )

        # Replace protocol-relative URLs in strings
        content = re.sub(
            rf'(["\'])([^"\']*?)(//{self._escape_regex(self.source_domain_without_protocol)})([^"\']*?)\1',
            rf'\1\2//{self.production_domain_without_protocol}\4\1',
            content
        )

        # Replace URLs in JavaScript object properties
        content = re.sub(
            rf'(url|href|src)\s*:\s*(["\'])(.*?)({self._escape_regex(self.SOURCE_DOMAIN)})(.*?)\2',
            rf'\1: \2\3{self.PRODUCTION_DOMAIN}\5\2',
            content
        )

        # Replace URLs in JavaScript comments
        content = re.sub(
            rf'(//.*?)({self._escape_regex(self.SOURCE_DOMAIN)})',
            rf'\1{self.PRODUCTION_DOMAIN}',
            content
        )

        content = re.sub(
            rf'(/\*.*?)({self._escape_regex(self.SOURCE_DOMAIN)})(.*?\*/)',
            rf'\1{self.PRODUCTION_DOMAIN}\3',
            content, flags=re.DOTALL
        )

        return content

    def _transform_content_by_type(self, content, content_type, url):
        """Transform content based on its MIME type"""
        if not content_type:
            return content

        content_str = content.decode('utf-8', errors='ignore') if isinstance(content, bytes) else content

        # Determine transformation based on content type
        if content_type.startswith('text/html'):
            transformed = self._transform_html_content(content_str)
            if transformed != content_str:
                self.logger.info(f'Transformed HTML content in {url}')
        elif content_type.startswith('text/css'):
            transformed = self._transform_css_content(content_str)
            if transformed != content_str:
                self.logger.info(f'Transformed CSS content in {url}')
        elif content_type.startswith(('application/javascript', 'text/javascript', 'application/x-javascript')):
            transformed = self._transform_javascript_content(content_str)
            if transformed != content_str:
                self.logger.info(f'Transformed JavaScript content in {url}')
        else:
            # For other content types, apply basic domain replacement
            transformed = content_str.replace(self.SOURCE_DOMAIN, self.PRODUCTION_DOMAIN)
            if self.source_domain_without_protocol and self.production_domain_without_protocol:
                transformed = transformed.replace(f'//{self.source_domain_without_protocol}',
                                                f'//{self.production_domain_without_protocol}')

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
        if item_session.request.url.startswith(self.PRODUCTION_DOMAIN):
            adjusted_url = item_session.request.url.replace(self.PRODUCTION_DOMAIN, self.SOURCE_DOMAIN, 1)
            item_session.add_child_url(adjusted_url)
            self.logger.info(f'Production domain remap: rather than retrieving {item_session.request.url}, will retrieve {adjusted_url}')
            return False
        elif item_session.request.url.startswith(self.SOURCE_DOMAIN):
            if item_session.request.url.startswith(self.SOURCE_DOMAIN.rstrip('/') + '/ghost/'):
                self.logger.info(f'Not retrieving ghost admin interface url: {item_session.request.url}')
                return False
            return True
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

