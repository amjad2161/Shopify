import {useRouteLoaderData} from 'react-router';
import type {RootLoader} from '~/root';
import {BRAND, type BrandConfig} from '~/lib/brand';

/** Resolved brand from root loader (PUBLIC_BRAND_* env) with static defaults. */
export function useBrand(): BrandConfig {
  const data = useRouteLoaderData<RootLoader>('root');
  return data?.brand ?? BRAND;
}
