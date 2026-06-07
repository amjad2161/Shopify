import {data} from 'react-router';
import type {Route} from './+types/($locale).newsletter';
import {findLocaleByStorefrontI18n, translate} from '~/lib/i18n';

const CUSTOMER_CREATE_MUTATION = `#graphql
  mutation NewsletterCustomerCreate($input: CustomerCreateInput!) {
    customerCreate(input: $input) {
      customer {
        id
        acceptsMarketing
      }
      customerUserErrors {
        code
        field
        message
      }
    }
  }
` as const;

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function generateNewsletterPassword() {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  const token = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  return `La-${token}`;
}

export async function loader() {
  return data({error: 'Method not allowed'}, {status: 405});
}

export async function action({request, context}: Route.ActionArgs) {
  const locale = findLocaleByStorefrontI18n(context.storefront.i18n);
  const uiLocale = locale.uiLocale;

  if (request.method !== 'POST') {
    return data({error: 'Method not allowed'}, {status: 405});
  }

  const formData = await request.formData();
  const email = String(formData.get('email') ?? '')
    .trim()
    .toLowerCase();

  if (!email || !isValidEmail(email)) {
    return data(
      {
        ok: false as const,
        error: translate(uiLocale, 'newsletter.invalidEmail'),
      },
      {status: 400},
    );
  }

  try {
    const result = await context.storefront.mutate(CUSTOMER_CREATE_MUTATION, {
      variables: {
        input: {
          email,
          password: generateNewsletterPassword(),
          acceptsMarketing: true,
        },
      },
    });

    const payload = result?.customerCreate;
    const errors = payload?.customerUserErrors ?? [];

    if (payload?.customer?.acceptsMarketing) {
      return data({
        ok: true as const,
        message: translate(uiLocale, 'newsletter.success'),
      });
    }

    const taken = errors.some(
      (error: {code?: string | null}) => error?.code === 'TAKEN',
    );
    if (taken) {
      return data({
        ok: true as const,
        message: translate(uiLocale, 'newsletter.taken'),
      });
    }

    const message =
      errors
        .map((error: {message?: string | null}) => error?.message)
        .filter(Boolean)
        .join(' ') || translate(uiLocale, 'newsletter.genericError');

    return data({ok: false as const, error: message}, {status: 400});
  } catch (error) {
    console.error('Newsletter subscribe failed', error);
    return data(
      {
        ok: false as const,
        error: translate(uiLocale, 'newsletter.serverError'),
      },
      {status: 500},
    );
  }
}
