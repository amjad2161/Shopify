import {redirect, useLoaderData} from 'react-router';
import type {Route} from './+types/($locale).account.orders.$id';
import {
  findLocaleByPath,
  getDefaultLocale,
  localizePath,
  localizedPageTitle,
  translate,
  useI18n,
} from '~/lib/i18n';
import {Money, Image} from '@shopify/hydrogen';
import type {
  OrderLineItemFullFragment,
  OrderQuery,
} from 'customer-accountapi.generated';
import {CUSTOMER_ORDER_QUERY} from '~/graphql/customer-account/CustomerOrderQuery';

export const meta: Route.MetaFunction = ({data, params}) => {
  const locale = findLocaleByPath(params.locale) ?? getDefaultLocale();
  const page = data?.order?.name
    ? translate(locale.uiLocale, 'account.orderMetaTitle', {
        name: data.order.name,
      })
    : translate(locale.uiLocale, 'account.ordersMetaTitle');
  return [{title: localizedPageTitle(page, locale.uiLocale)}];
};

export async function loader({params, context}: Route.LoaderArgs) {
  const {customerAccount} = context;
  if (!params.id) {
    return redirect(localizePath('/account/orders', params.locale));
  }

  const orderId = atob(params.id);
  const {data, errors}: {data: OrderQuery; errors?: Array<{message: string}>} =
    await customerAccount.query(CUSTOMER_ORDER_QUERY, {
      variables: {
        orderId,
        language: customerAccount.i18n.language,
      },
    });

  if (errors?.length || !data?.order) {
    throw new Error('Order not found');
  }

  const {order} = data;

  const lineItems = order.lineItems.nodes;
  const discountApplications = order.discountApplications.nodes;
  const fulfillmentStatus = order.fulfillments.nodes[0]?.status ?? 'N/A';
  const firstDiscount = discountApplications[0]?.value;

  const discountValue =
    firstDiscount?.__typename === 'MoneyV2'
      ? (firstDiscount as Extract<
          typeof firstDiscount,
          {__typename: 'MoneyV2'}
        >)
      : null;

  const discountPercentage =
    firstDiscount?.__typename === 'PricingPercentageValue'
      ? (
          firstDiscount as Extract<
            typeof firstDiscount,
            {__typename: 'PricingPercentageValue'}
          >
        ).percentage
      : null;

  return {
    order,
    lineItems,
    discountValue,
    discountPercentage,
    fulfillmentStatus,
  };
}

export default function OrderRoute() {
  const {
    order,
    lineItems,
    discountValue,
    discountPercentage,
    fulfillmentStatus,
  } = useLoaderData<typeof loader>();
  const {t, locale} = useI18n();

  const processedDate = new Intl.DateTimeFormat(locale.intlTag, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(order.processedAt!));

  return (
    <div className="account-order">
      <h2>{t('account.orderHeading', {name: order.name})}</h2>
      <p>{t('account.placedOn', {date: processedDate})}</p>
      {order.confirmationNumber && (
        <p>
          {t('account.confirmationDisplay', {
            number: order.confirmationNumber,
          })}
        </p>
      )}
      <br />
      <div>
        <table>
          <thead>
            <tr>
              <th scope="col">{t('account.product')}</th>
              <th scope="col">{t('account.price')}</th>
              <th scope="col">{t('account.quantity')}</th>
              <th scope="col">{t('account.total')}</th>
            </tr>
          </thead>
          <tbody>
            {lineItems.map((lineItem, lineItemIndex) => (
              // eslint-disable-next-line react/no-array-index-key
              <OrderLineRow key={lineItemIndex} lineItem={lineItem} />
            ))}
          </tbody>
          <tfoot>
            {((discountValue && discountValue.amount) ||
              discountPercentage) && (
              <tr>
                <th scope="row" colSpan={3}>
                  <p>{t('cart.discounts')}</p>
                </th>
                <th scope="row">
                  <p>{t('cart.discounts')}</p>
                </th>
                <td>
                  {discountPercentage ? (
                    <span>
                      {t('account.discountOff', {
                        percentage: String(discountPercentage),
                      })}
                    </span>
                  ) : (
                    discountValue && <Money data={discountValue!} />
                  )}
                </td>
              </tr>
            )}
            <tr>
              <th scope="row" colSpan={3}>
                <p>{t('account.subtotal')}</p>
              </th>
              <th scope="row">
                <p>{t('account.subtotal')}</p>
              </th>
              <td>
                <Money data={order.subtotal!} />
              </td>
            </tr>
            <tr>
              <th scope="row" colSpan={3}>
                {t('account.tax')}
              </th>
              <th scope="row">
                <p>{t('account.tax')}</p>
              </th>
              <td>
                <Money data={order.totalTax!} />
              </td>
            </tr>
            <tr>
              <th scope="row" colSpan={3}>
                {t('account.total')}
              </th>
              <th scope="row">
                <p>{t('account.total')}</p>
              </th>
              <td>
                <Money data={order.totalPrice!} />
              </td>
            </tr>
          </tfoot>
        </table>
        <div>
          <h3>{t('account.shippingAddress')}</h3>
          {order?.shippingAddress ? (
            <address>
              <p>{order.shippingAddress.name}</p>
              {order.shippingAddress.formatted ? (
                <p>{order.shippingAddress.formatted}</p>
              ) : (
                ''
              )}
              {order.shippingAddress.formattedArea ? (
                <p>{order.shippingAddress.formattedArea}</p>
              ) : (
                ''
              )}
            </address>
          ) : (
            <p>{t('account.noShippingAddress')}</p>
          )}
          <h3>{t('account.status')}</h3>
          <div>
            <p>{fulfillmentStatus}</p>
          </div>
        </div>
      </div>
      <br />
      <p>
        <a target="_blank" href={order.statusPageUrl} rel="noreferrer">
          {t('account.viewOrderStatus')}
        </a>
      </p>
    </div>
  );
}

function OrderLineRow({lineItem}: {lineItem: OrderLineItemFullFragment}) {
  return (
    <tr key={lineItem.id}>
      <td>
        <div>
          {lineItem?.image && (
            <div>
              <Image data={lineItem.image} width={96} height={96} />
            </div>
          )}
          <div>
            <p>{lineItem.title}</p>
            <small>{lineItem.variantTitle}</small>
          </div>
        </div>
      </td>
      <td>
        <Money data={lineItem.price!} />
      </td>
      <td>{lineItem.quantity}</td>
      <td>
        <Money data={lineItem.totalDiscount!} />
      </td>
    </tr>
  );
}
