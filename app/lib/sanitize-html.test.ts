import {describe, expect, it} from 'vitest';
import {sanitizeProductHtml} from '~/lib/sanitize-html';

describe('sanitizeProductHtml', () => {
  it('returns empty string for empty input', () => {
    expect(sanitizeProductHtml('')).toBe('');
  });

  it('strips script tags', () => {
    const html = '<p>Safe</p><script>alert(1)</script>';
    expect(sanitizeProductHtml(html)).toBe('<p>Safe</p>');
  });

  it('removes inline event handlers', () => {
    const html = '<img src="/x.png" onerror="alert(1)" alt="x" />';
    expect(sanitizeProductHtml(html)).not.toContain('onerror');
  });

  it('removes javascript: URLs', () => {
    const html = '<a href="javascript:alert(1)">click</a>';
    expect(sanitizeProductHtml(html)).not.toContain('javascript:');
  });

  it('strips style, iframe, embed, object, and svg tags', () => {
    const html =
      '<style>body{}</style><iframe src="/x"></iframe><embed src="/y" /><object data="/z"></object><svg><script/></svg><p>ok</p>';
    const sanitized = sanitizeProductHtml(html);
    expect(sanitized).toBe('<p>ok</p>');
  });

  it('blocks vbscript and data URIs in src/href', () => {
    const html =
      '<a href="vbscript:msgbox(1)">x</a><img src="data:text/html,hi" alt="x" />';
    const sanitized = sanitizeProductHtml(html);
    expect(sanitized).not.toContain('vbscript:');
    expect(sanitized).not.toContain('data:');
    expect(sanitized).toContain('blocked:');
  });
});
