const SCRIPT_TAG_RE =
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
const EVENT_HANDLER_RE =
  /\s+on\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi;
const JS_PROTOCOL_RE = /javascript:/gi;

/** Strip common XSS vectors from Shopify product HTML before render. */
export function sanitizeProductHtml(html: string): string {
  if (!html) return '';

  return html
    .replace(SCRIPT_TAG_RE, '')
    .replace(EVENT_HANDLER_RE, '')
    .replace(JS_PROTOCOL_RE, '');
}
