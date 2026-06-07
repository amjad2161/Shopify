export type UiLocale = 'en' | 'fr' | 'he';

export type LocaleDefinition = {
  /** URL segment, e.g. EN-US */
  path: string;
  language: 'EN' | 'FR' | 'HE';
  country: 'US' | 'CA' | 'IL';
  label: string;
  uiLocale: UiLocale;
  dir: 'ltr' | 'rtl';
  /** BCP 47 for Intl formatters */
  intlTag: string;
};

export const DEFAULT_LOCALE_PATH = 'EN-US';

export const LOCALES: readonly LocaleDefinition[] = [
  {
    path: 'EN-US',
    language: 'EN',
    country: 'US',
    label: 'English (US)',
    uiLocale: 'en',
    dir: 'ltr',
    intlTag: 'en-US',
  },
  {
    path: 'EN-CA',
    language: 'EN',
    country: 'CA',
    label: 'English (Canada)',
    uiLocale: 'en',
    dir: 'ltr',
    intlTag: 'en-CA',
  },
  {
    path: 'FR-CA',
    language: 'FR',
    country: 'CA',
    label: 'Français (Canada)',
    uiLocale: 'fr',
    dir: 'ltr',
    intlTag: 'fr-CA',
  },
  {
    path: 'HE-IL',
    language: 'HE',
    country: 'IL',
    label: 'עברית',
    uiLocale: 'he',
    dir: 'rtl',
    intlTag: 'he-IL',
  },
] as const;

export const LOCALE_PATHS = LOCALES.map((locale) => locale.path);

const localeByPath = new Map(
  LOCALES.map((locale) => [locale.path.toUpperCase(), locale]),
);

export function findLocaleByPath(path: string | undefined | null) {
  if (!path) return undefined;
  return localeByPath.get(path.toUpperCase());
}

export function getDefaultLocale() {
  return findLocaleByPath(DEFAULT_LOCALE_PATH)!;
}

export function storefrontI18nFromLocale(locale: LocaleDefinition) {
  return {language: locale.language, country: locale.country};
}

export function findLocaleByStorefrontI18n(i18n: {
  language: string;
  country: string;
}) {
  return (
    LOCALES.find(
      (locale) =>
        locale.language === i18n.language && locale.country === i18n.country,
    ) ?? getDefaultLocale()
  );
}
