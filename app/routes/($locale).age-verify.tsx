import {Form, data, redirect, useLoaderData, useSearchParams} from 'react-router';
import {useEffect} from 'react';
import {useAnalytics} from '@shopify/hydrogen';
import type {Route} from './+types/($locale).age-verify';
import {isAgeVerified, markAgeVerified} from '~/lib/age-gate';
import {publishAgeGateEvent} from '~/lib/age-gate-analytics';
import {
  findLocaleByPath,
  getDefaultLocale,
  localizePath,
  localizedPageTitle,
  brandNameFromMatches,
  translate,
  useI18n,
} from '~/lib/i18n';

function safeReturnPath(value: string | null, localePath: string) {
  if (!value || !value.startsWith('/')) {
    return localizePath('/', localePath);
  }
  if (value.startsWith('//')) {
    return localizePath('/', localePath);
  }
  return value;
}

export const meta: Route.MetaFunction = ({params, matches}) => {
  const locale = findLocaleByPath(params.locale) ?? getDefaultLocale();
  const brandName = brandNameFromMatches(matches);
  const page = translate(locale.uiLocale, 'ageGate.title');
  return [{title: localizedPageTitle(page, locale.uiLocale, brandName)}];
};

export async function loader({context, request, params}: Route.LoaderArgs) {
  const locale = findLocaleByPath(params.locale) ?? getDefaultLocale();

  if (isAgeVerified(context.session)) {
    const url = new URL(request.url);
    const returnTo = safeReturnPath(
      url.searchParams.get('returnTo'),
      locale.path,
    );
    throw redirect(returnTo);
  }

  return {verified: false};
}

export async function action({request, context, params}: Route.ActionArgs) {
  const locale = findLocaleByPath(params.locale) ?? getDefaultLocale();
  const uiLocale = locale.uiLocale;

  if (request.method !== 'POST') {
    return data({error: 'Method not allowed'}, {status: 405});
  }

  const formData = await request.formData();
  const confirmed = formData.get('confirm') === 'yes';

  if (!confirmed) {
    return data(
      {
        ok: false as const,
        error: translate(uiLocale, 'ageGate.mustConfirm'),
      },
      {status: 400},
    );
  }

  markAgeVerified(context.session);

  const returnTo = safeReturnPath(
    String(formData.get('returnTo') ?? ''),
    locale.path,
  );

  throw redirect(returnTo);
}

export default function AgeVerifyRoute() {
  useLoaderData<typeof loader>();
  const {t, path} = useI18n();
  const [searchParams] = useSearchParams();
  const returnTo = safeReturnPath(searchParams.get('returnTo'), path(''));
  const {publish} = useAnalytics();

  useEffect(() => {
    publishAgeGateEvent(publish, {event: 'age_gate_view', returnTo});
  }, [publish, returnTo]);

  return (
    <div className="age-verify mx-auto max-w-lg px-6 py-24 text-center">
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--color-accent)]">
        {t('ageGate.eyebrow')}
      </p>
      <h1 className="font-display mt-4 text-3xl">{t('ageGate.title')}</h1>
      <p className="mt-4 text-[var(--color-ink-muted)]">{t('ageGate.body')}</p>
      <Form
        method="post"
        className="mt-8 flex flex-col gap-4"
        onSubmit={() => {
          publishAgeGateEvent(publish, {event: 'age_gate_confirm', returnTo});
        }}
      >
        <input type="hidden" name="returnTo" value={returnTo} />
        <button
          type="submit"
          name="confirm"
          value="yes"
          className="rounded-full bg-[var(--color-ink)] px-6 py-3 text-sm text-white"
        >
          {t('ageGate.confirm')}
        </button>
        <a
          className="text-sm text-[var(--color-ink-muted)] underline"
          href={path('/')}
        >
          {t('ageGate.decline')}
        </a>
      </Form>
    </div>
  );
}
