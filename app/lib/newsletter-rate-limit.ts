const RATE_LIMIT_KEY = 'newsletterRate';
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 60 * 60 * 1000;

type RateRecord = {
  count: number;
  windowStart: number;
};

type SessionLike = {
  get: (key: string) => unknown;
  set: (key: string, value: unknown) => void;
};

export function consumeNewsletterAttempt(session: SessionLike): boolean {
  const now = Date.now();
  const existing = session.get(RATE_LIMIT_KEY) as RateRecord | undefined;

  if (!existing || now - existing.windowStart > WINDOW_MS) {
    session.set(RATE_LIMIT_KEY, {count: 1, windowStart: now});
    return true;
  }

  if (existing.count >= MAX_ATTEMPTS) {
    return false;
  }

  session.set(RATE_LIMIT_KEY, {
    count: existing.count + 1,
    windowStart: existing.windowStart,
  });
  return true;
}
