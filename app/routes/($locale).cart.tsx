import {useLoaderData, data, type HeadersFunction, type MetaDescriptor} from 'react-router';
import type {Route} from './+types/($locale).cart';
import type {CartQueryDataReturn} from '@shopify/hydrogen';
import {CartForm} from '@shopify/hydrogen';
import {CartMain} from '~/components/CartMain';
import {
  findLocaleByPath,
  getDefaultLocale,
  brandNameFromMatches,
  brandUrlFromMatches,
  localizedPageTitle,
  translate,
  useI18n,
} from '~/lib/i18n';
import {
  buildCanonicalUrl,
  canonicalLinkMeta,
  hreflangAlternateMetas,
} from '~/lib/seo-meta';

export const meta: Route.MetaFunction = ({params, matches, location}) => {
  const brandName = brandNameFromMatches(matches);
  const brandUrl = brandUrlFromMatches(matches);
  const locale = findLocaleByPath(params.locale) ?? getDefaultLocale();
  const page = translate(locale.uiLocale, 'nav.cart');
  const title = localizedPageTitle(page, locale.uiLocale, brandName);
  const canonicalUrl = buildCanonicalUrl({
    brandUrl,
    localePath: locale.path,
    pathname: '/cart',
  });

  return [
    {title},
    canonicalLinkMeta(canonicalUrl),
    ...hreflangAlternateMetas(brandUrl, location.pathname),
  ] satisfies MetaDescriptor[];
};

export const headers: HeadersFunction = ({actionHeaders}) => actionHeaders;

export async function action({request, context}: Route.ActionArgs) {
  const {cart} = context;

  const formData = await request.formData();

  const {action, inputs} = CartForm.getFormInput(formData);

  if (!action) {
    throw new Error('No action provided');
  }

  let status = 200;
  let result: CartQueryDataReturn;

  switch (action) {
    case CartForm.ACTIONS.LinesAdd:
      result = await cart.addLines(inputs.lines);
      break;
    case CartForm.ACTIONS.LinesUpdate:
      result = await cart.updateLines(inputs.lines);
      break;
    case CartForm.ACTIONS.LinesRemove:
      result = await cart.removeLines(inputs.lineIds);
      break;
    case CartForm.ACTIONS.DiscountCodesUpdate: {
      const formDiscountCode = inputs.discountCode;

      // User inputted discount code
      const discountCodes = (
        formDiscountCode ? [formDiscountCode] : []
      ) as string[];

      // Combine discount codes already applied on cart
      discountCodes.push(...inputs.discountCodes);

      result = await cart.updateDiscountCodes(discountCodes);
      break;
    }
    case CartForm.ACTIONS.GiftCardCodesAdd: {
      const formGiftCardCode = inputs.giftCardCode;

      const giftCardCodes = (
        formGiftCardCode ? [formGiftCardCode] : []
      ) as string[];

      result = await cart.addGiftCardCodes(giftCardCodes);
      break;
    }
    case CartForm.ACTIONS.GiftCardCodesRemove: {
      const appliedGiftCardIds = inputs.giftCardCodes as string[];
      result = await cart.removeGiftCardCodes(appliedGiftCardIds);
      break;
    }
    case CartForm.ACTIONS.BuyerIdentityUpdate: {
      result = await cart.updateBuyerIdentity({
        ...inputs.buyerIdentity,
      });
      break;
    }
    default:
      throw new Error(`${action} cart action is not defined`);
  }

  const cartId = result?.cart?.id;
  const headers = cartId ? cart.setCartId(result.cart.id) : new Headers();
  const {cart: cartResult, errors, warnings} = result;

  const redirectTo = formData.get('redirectTo') ?? null;
  if (typeof redirectTo === 'string') {
    status = 303;
    headers.set('Location', redirectTo);
  }

  return data(
    {
      cart: cartResult,
      errors,
      warnings,
      analytics: {
        cartId,
      },
    },
    {status, headers},
  );
}

import {cartRequiresAgeGate} from '~/lib/age-gate';
import {redirectToAgeVerifyIfNeeded} from '~/lib/age-gate-redirect';

export async function loader({context, params}: Route.LoaderArgs) {
  const {cart} = context;
  const cartData = await cart.get();
  const locale = findLocaleByPath(params.locale) ?? getDefaultLocale();

  if (cartRequiresAgeGate(cartData?.lines?.nodes)) {
    redirectToAgeVerifyIfNeeded({
      session: context.session,
      localePath: locale.path,
      returnPath: '/cart',
    });
  }

  return cartData;
}

export default function Cart() {
  const cart = useLoaderData<typeof loader>();
  const {t} = useI18n();

  return (
    <div className="cart">
      <h1>{t('nav.cart')}</h1>
      <CartMain layout="page" cart={cart} />
    </div>
  );
}
