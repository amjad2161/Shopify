const SCRIPT_TAG_RE =
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
const STYLE_TAG_RE =
  /<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi;
const IFRAME_TAG_RE =
  /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi;
const OBJECT_TAG_RE =
  /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi;
const EMBED_TAG_RE = /<embed\b[^>]*>/gi;
const SVG_TAG_RE = /<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi;
const EVENT_HANDLER_RE =
  /\s+on\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi;
const JS_PROTOCOL_RE = /javascript:/gi;
const VBSCRIPT_PROTOCOL_RE = /vbscript:/gi;
const DATA_URI_RE = /\s(src|href|xlink:href)\s*=\s*("|')?\s*data:/gi;

/** Strip common XSS vectors from Shopify product HTML before render. */
export function sanitizeProductHtml(html: string): string {
  if (!html) return '';

  return html
    .replace(SCRIPT_TAG_RE, '')
    .replace(STYLE_TAG_RE, '')
    .replace(IFRAME_TAG_RE, '')
    .replace(OBJECT_TAG_RE, '')
    .replace(EMBED_TAG_RE, '')
    .replace(SVG_TAG_RE, '')
    .replace(EVENT_HANDLER_RE, '')
    .replace(JS_PROTOCOL_RE, '')
    .replace(VBSCRIPT_PROTOCOL_RE, '')
    .replace(DATA_URI_RE, ' $1=$2blocked:');
}
