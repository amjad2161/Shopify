import {describe, expect, it} from 'vitest';
import {consumeNewsletterAttempt} from '~/lib/newsletter-rate-limit';

function createSession() {
  const store = new Map<string, unknown>();
  return {
    get: (key: string) => store.get(key),
    set: (key: string, value: unknown) => {
      store.set(key, value);
    },
  };
}

describe('consumeNewsletterAttempt', () => {
  it('allows the first attempt in a new window', () => {
    const session = createSession();
    expect(consumeNewsletterAttempt(session)).toBe(true);
  });

  it('blocks after five attempts in the same hour', () => {
    const session = createSession();
    const now = Date.now();

    for (let i = 0; i < 5; i++) {
      expect(consumeNewsletterAttempt(session)).toBe(true);
    }

    session.set('newsletterRate', {
      count: 5,
      windowStart: now,
    });
    expect(consumeNewsletterAttempt(session)).toBe(false);
  });

  it('resets the window after an hour', () => {
    const session = createSession();
    session.set('newsletterRate', {
      count: 5,
      windowStart: Date.now() - 61 * 60 * 1000,
    });

    expect(consumeNewsletterAttempt(session)).toBe(true);
  });
});
