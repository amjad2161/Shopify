import {createHydrogenContext} from '@shopify/hydrogen';
import {AppSession} from '~/lib/session';
import {CART_QUERY_FRAGMENT} from '~/lib/fragments';
import {normalizeStoreEnv, validateStoreEnv} from '~/lib/store-env';
import {
  resolveLocaleFromRequest,
  storefrontI18nFromLocale,
} from '~/lib/i18n';

declare global {
  interface HydrogenAdditionalContext {
    /** Workers Cache API instance opened in `createHydrogenRouterContext`. */
    workerCache: Cache;
  }
}

/**
 * Creates Hydrogen context for React Router 7.9.x
 * Returns HydrogenRouterContextProvider with hybrid access patterns
 * */
export async function createHydrogenRouterContext(
  request: Request,
  env: Env,
  executionContext: ExecutionContext,
) {
  /**
   * Open a cache instance in the worker and a custom session instance.
   */
  const storeEnv = normalizeStoreEnv(env);
  validateStoreEnv(storeEnv);

  const waitUntil = executionContext.waitUntil.bind(executionContext);
  const [cache, session] = await Promise.all([
    caches.open('hydrogen'),
    AppSession.init(request, [storeEnv.SESSION_SECRET]),
  ]);

  const hydrogenContext = createHydrogenContext(
    {
      env: storeEnv,
      request,
      cache,
      waitUntil,
      session,
      i18n: storefrontI18nFromLocale(resolveLocaleFromRequest(request)),
      cart: {
        queryFragment: CART_QUERY_FRAGMENT,
      },
    },
    {workerCache: cache},
  );

  return hydrogenContext;
}
