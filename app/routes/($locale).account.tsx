import {
  data as remixData,
  Form,
  NavLink,
  Outlet,
  useLoaderData,
} from 'react-router';
import type {Route} from './+types/($locale).account';
import {CUSTOMER_DETAILS_QUERY} from '~/graphql/customer-account/CustomerDetailsQuery';
import {useI18n} from '~/lib/i18n';

export function shouldRevalidate() {
  return true;
}

export async function loader({context}: Route.LoaderArgs) {
  const {customerAccount} = context;
  const {data, errors} = await customerAccount.query(CUSTOMER_DETAILS_QUERY, {
    variables: {
      language: customerAccount.i18n.language,
    },
  });

  if (errors?.length || !data?.customer) {
    throw new Error('Customer not found');
  }

  return remixData(
    {customer: data.customer},
    {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    },
  );
}

export default function AccountLayout() {
  const {customer} = useLoaderData<typeof loader>();
  const {t} = useI18n();

  const heading = customer
    ? customer.firstName
      ? t('account.welcome', {name: customer.firstName})
      : t('account.welcomeDefault')
    : t('account.details');

  return (
    <div className="account">
      <h1>{heading}</h1>
      <br />
      <AccountMenu />
      <br />
      <br />
      <Outlet context={{customer}} />
    </div>
  );
}

function AccountMenu() {
  const {t, path} = useI18n();

  function isActiveStyle({
    isActive,
    isPending,
  }: {
    isActive: boolean;
    isPending: boolean;
  }) {
    return {
      fontWeight: isActive ? 'bold' : undefined,
      color: isPending ? 'grey' : 'black',
    };
  }

  return (
    <nav role="navigation">
      <NavLink to={path('/account/orders')} style={isActiveStyle}>
        {t('account.orders')} &nbsp;
      </NavLink>
      &nbsp;|&nbsp;
      <NavLink to={path('/account/profile')} style={isActiveStyle}>
        &nbsp; {t('account.profile')} &nbsp;
      </NavLink>
      &nbsp;|&nbsp;
      <NavLink to={path('/account/addresses')} style={isActiveStyle}>
        &nbsp; {t('account.addresses')} &nbsp;
      </NavLink>
      &nbsp;|&nbsp;
      <Logout />
    </nav>
  );
}

function Logout() {
  const {t} = useI18n();

  return (
    <Form className="account-logout" method="POST" action="/account/logout">
      &nbsp;<button type="submit">{t('account.signOut')}</button>
    </Form>
  );
}
