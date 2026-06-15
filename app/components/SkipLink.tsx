import {useI18n} from '~/lib/i18n/I18nProvider';

/** Keyboard-first skip link — targets #main-content on PageLayout. */
export function SkipLink() {
  const {t} = useI18n();

  return (
    <a className="skip-link" href="#main-content">
      {t('a11y.skipToContent')}
    </a>
  );
}
