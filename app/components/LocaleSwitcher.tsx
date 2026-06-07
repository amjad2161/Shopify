import {useLocation} from 'react-router';
import {LOCALES} from '~/lib/i18n/config';
import {localizePath, stripLocalePrefix} from '~/lib/i18n/paths';
import {localeCookieHeader} from '~/lib/i18n/resolve';
import {useI18n} from '~/lib/i18n/I18nProvider';

export function LocaleSwitcher({className}: {className?: string}) {
  const {locale, t} = useI18n();
  const location = useLocation();
  const basePath = stripLocalePrefix(location.pathname);

  return (
    <div className={className ?? 'locale-switcher'}>
      <label className="sr-only" htmlFor="locale-select">
        {t('nav.locale')}
      </label>
      <select
        id="locale-select"
        name="locale"
        value={locale.path}
        className="locale-switcher-select"
        aria-label={t('nav.locale')}
        onChange={(event) => {
          const next = event.target.value;
          const nextPath = localizePath(basePath, next);
          document.cookie = localeCookieHeader(next);
          window.location.assign(`${nextPath}${location.search}${location.hash}`);
        }}
      >
        {LOCALES.map((entry) => (
          <option key={entry.path} value={entry.path}>
            {entry.label}
          </option>
        ))}
      </select>
    </div>
  );
}
