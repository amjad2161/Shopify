import type {Route} from './+types/account_.login';
import {resolveLocaleFromRequest} from '~/lib/i18n';

export async function loader({request, context}: Route.LoaderArgs) {
  const url = new URL(request.url);
  const acrValues = url.searchParams.get('acr_values') || undefined;
  const loginHint = url.searchParams.get('login_hint') || undefined;
  const loginHintMode = url.searchParams.get('login_hint_mode') || undefined;
  const locale =
    url.searchParams.get('locale') ||
    resolveLocaleFromRequest(request).intlTag;

  return context.customerAccount.login({
    countryCode: context.storefront.i18n.country,
    acrValues,
    loginHint,
    loginHintMode,
    locale,
  });
}
