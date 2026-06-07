import {createContext, useContext, useMemo} from 'react';
import type {LocaleDefinition} from './config';
import {localizePath} from './paths';
import {translate, type MessageKey} from './messages';

export type I18nContextValue = {
  locale: LocaleDefinition;
  t: (key: MessageKey, vars?: Record<string, string | number>) => string;
  path: (internalPath: string) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({
  locale,
  children,
}: {
  locale: LocaleDefinition;
  children: React.ReactNode;
}) {
  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      t: (key, vars) => translate(locale.uiLocale, key, vars),
      path: (internalPath) => localizePath(internalPath, locale.path),
    }),
    [locale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return context;
}

/** Safe when root layout has not mounted I18nProvider yet (e.g. error boundary). */
export function useI18nOptional() {
  return useContext(I18nContext);
}
