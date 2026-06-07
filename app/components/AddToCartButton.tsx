import {useEffect, useRef, useState} from 'react';
import {type FetcherWithComponents} from 'react-router';
import {CartForm, type OptimisticCartLineInput} from '@shopify/hydrogen';
import {useI18n} from '~/lib/i18n/I18nProvider';

function CartSubmitButton({
  fetcher,
  analytics,
  disabled,
  onClick,
  children,
}: {
  fetcher: FetcherWithComponents<unknown>;
  analytics?: unknown;
  disabled?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  const [pulse, setPulse] = useState(false);
  const prevState = useRef(fetcher.state);

  useEffect(() => {
    const wasSubmitting = prevState.current === 'submitting';
    prevState.current = fetcher.state;

    if (wasSubmitting && fetcher.state === 'idle') {
      setPulse(true);
      const timer = window.setTimeout(() => setPulse(false), 600);
      return () => window.clearTimeout(timer);
    }
  }, [fetcher.state]);

  return (
    <>
      <input
        name="analytics"
        type="hidden"
        value={JSON.stringify(analytics)}
      />
      <button
        type="submit"
        className={pulse ? 'add-to-cart--pulse' : undefined}
        onClick={onClick}
        disabled={disabled ?? fetcher.state !== 'idle'}
      >
        {children}
      </button>
    </>
  );
}

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
      {(fetcher: FetcherWithComponents<unknown>) => (
        <CartSubmitButton
          fetcher={fetcher}
          analytics={analytics}
          disabled={disabled}
          onClick={onClick}
        >
          {children}
        </CartSubmitButton>
      )}
    </CartForm>
  );
}
