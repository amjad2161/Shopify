import {type FetcherWithComponents} from 'react-router';
import {CartForm, type OptimisticCartLineInput} from '@shopify/hydrogen';
import {useI18n} from '~/lib/i18n/I18nProvider';

export function AddToCartButton({
  analytics,
  children,
  disabled,
  lines,
  onClick,
}: {
  analytics?: unknown;
  children: React.ReactNode;
  disabled?: boolean;
  lines: Array<OptimisticCartLineInput>;
  onClick?: () => void;
}) {
  const {path} = useI18n();

  return (
    <CartForm
      route={path('/cart')}
      inputs={{lines}}
      action={CartForm.ACTIONS.LinesAdd}
    >
      {(fetcher: FetcherWithComponents<any>) => (
        <>
          <input
            name="analytics"
            type="hidden"
            value={JSON.stringify(analytics)}
          />
          <button
            type="submit"
            onClick={onClick}
            disabled={disabled ?? fetcher.state !== 'idle'}
          >
            {children}
          </button>
        </>
      )}
    </CartForm>
  );
}
