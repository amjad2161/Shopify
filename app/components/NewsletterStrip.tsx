import {useEffect, useRef} from 'react';
import {useFetcher} from 'react-router';
import {useBrand} from '~/hooks/useBrand';
import {useI18n} from '~/lib/i18n/I18nProvider';

type NewsletterActionData = {
  ok?: boolean;
  error?: string;
  message?: string;
};

export function NewsletterStrip() {
  const {t, path} = useI18n();
  const brand = useBrand();
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
          <p className="newsletter-strip-eyebrow">{t('newsletter.eyebrow')}</p>
          <h2 id="newsletter-heading" className="font-display">
            {t('newsletter.title')}
          </h2>
          <p>{t('newsletter.body', {brand: brand.name})}</p>
        </div>
        <fetcher.Form
          ref={formRef}
          className="newsletter-strip-form"
          method="post"
          action={path('/newsletter')}
        >
          <input
            type="text"
            name="company"
            tabIndex={-1}
            autoComplete="off"
            className="newsletter-honeypot"
            aria-hidden="true"
          />
          <label className="sr-only" htmlFor="newsletter-email">
            {t('newsletter.emailLabel')}
          </label>
          <input
            id="newsletter-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder={t('newsletter.emailPlaceholder')}
            required
            disabled={isSubmitting}
            aria-invalid={response?.ok === false}
            aria-describedby={
              response?.message || response?.error ? 'newsletter-status' : undefined
            }
          />
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? t('newsletter.subscribing') : t('newsletter.subscribe')}
          </button>
        </fetcher.Form>
        {(response?.message || response?.error) && (
          <p
            id="newsletter-status"
            className={`newsletter-strip-status ${
              response.ok
                ? 'newsletter-strip-status-success'
                : 'newsletter-strip-status-error'
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
