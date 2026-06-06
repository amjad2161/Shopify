import {BRAND} from '~/lib/brand';

export function NewsletterStrip() {
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
        <form
          className="newsletter-strip-form"
          action="/pages/contact"
          method="get"
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
          />
          <button type="submit">Subscribe</button>
        </form>
      </div>
    </section>
  );
}
