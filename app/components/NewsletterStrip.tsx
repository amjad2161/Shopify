import {useEffect, useRef} from 'react';
import {useFetcher} from 'react-router';
import {BRAND} from '~/lib/brand';

type NewsletterActionData = {
  ok?: boolean;
  error?: string;
  message?: string;
};

export function NewsletterStrip() {
  const fetcher = useFetcher<NewsletterActionData>();
  const formRef = useRef<HTMLFormElement>(null);
  const isSubmitting = fetcher.state !== 'idle';
  const response = fetcher.data;

  useEffect(() => {
    if (fetcher.state === 'idle' && response?.ok) {
      formRef.current?.reset();
    }
  }, [fetcher.state, response?.ok]);

  return (
    <section className="newsletter-strip" aria-labelledby="newsletter-heading">
      <div className="newsletter-strip-inner">
        <div className="newsletter-strip-copy">
          <p className="newsletter-strip-eyebrow">The inner circle</p>
          <h2 id="newsletter-heading" className="font-display">
            First access to new drops
          </h2>
          <p>
            Join {BRAND.name} for early releases, studio notes, and members-only
            offers — no noise, just craft.
          </p>
        </div>
        <fetcher.Form
          ref={formRef}
          className="newsletter-strip-form"
          method="post"
          action="/newsletter"
        >
          <label className="sr-only" htmlFor="newsletter-email">
            Email address
          </label>
          <input
            id="newsletter-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            required
            disabled={isSubmitting}
            aria-invalid={response?.ok === false}
            aria-describedby={
              response?.message || response?.error ? 'newsletter-status' : undefined
            }
          />
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Subscribing…' : 'Subscribe'}
          </button>
        </fetcher.Form>
        {(response?.message || response?.error) && (
          <p
            id="newsletter-status"
            className={`newsletter-strip-status ${
              response.ok ? 'newsletter-strip-status-success' : 'newsletter-strip-status-error'
            }`}
            role="status"
            aria-live="polite"
          >
            {response.ok ? response.message : response.error}
          </p>
        )}
      </div>
    </section>
  );
}
