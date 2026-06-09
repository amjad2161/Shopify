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
});
