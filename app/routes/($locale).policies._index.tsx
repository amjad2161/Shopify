import {useLoaderData, Link} from 'react-router';
import type {Route} from './+types/($locale).policies._index';
import type {PoliciesQuery, PolicyItemFragment} from 'storefrontapi.generated';
import {
  findLocaleByPath,
  getDefaultLocale,
  localizedPageTitle,
  translate,
  useI18n,
} from '~/lib/i18n';

export const meta: Route.MetaFunction = ({params}) => {
  const locale = findLocaleByPath(params.locale) ?? getDefaultLocale();
  const page = translate(locale.uiLocale, 'policies.heading');
  return [{title: localizedPageTitle(page, locale.uiLocale)}];
};

export async function loader({context}: Route.LoaderArgs) {
  const data: PoliciesQuery = await context.storefront.query(POLICIES_QUERY);

  const shopPolicies = data.shop;
  const policies: PolicyItemFragment[] = [
    shopPolicies?.privacyPolicy,
    shopPolicies?.shippingPolicy,
    shopPolicies?.termsOfService,
    shopPolicies?.refundPolicy,
    shopPolicies?.subscriptionPolicy,
  ].filter((policy): policy is PolicyItemFragment => policy != null);

  if (!policies.length) {
    throw new Response('No policies found', {status: 404});
  }

  return {policies};
}

export default function Policies() {
  const {policies} = useLoaderData<typeof loader>();
  const {t, path} = useI18n();

  return (
    <div className="policies">
      <h1>{t('policies.heading')}</h1>
      <div>
        {policies.map((policy) => (
          <fieldset key={policy.id}>
            <Link to={path(`/policies/${policy.handle}`)}>{policy.title}</Link>
          </fieldset>
        ))}
      </div>
    </div>
  );
}

const POLICIES_QUERY = `#graphql
  fragment PolicyItem on ShopPolicy {
    id
    title
    handle
  }
  query Policies ($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    shop {
      privacyPolicy {
        ...PolicyItem
      }
      shippingPolicy {
        ...PolicyItem
      }
      termsOfService {
        ...PolicyItem
      }
      refundPolicy {
        ...PolicyItem
      }
      subscriptionPolicy {
        id
        title
        handle
      }
    }
  }
` as const;
