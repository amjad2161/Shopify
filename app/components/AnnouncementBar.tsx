import {Link} from 'react-router';
import {useI18n} from '~/lib/i18n/I18nProvider';

export function AnnouncementBar() {
  const {t, path} = useI18n();

  return (
    <div
      className="announcement-bar"
      role="region"
      aria-label={t('announcement.region')}
    >
      <p>
        {t('brand.announcement')}{' '}
        <Link to={path('/collections/all')}>{t('announcement.shopNow')}</Link>
      </p>
    </div>
  );
}
