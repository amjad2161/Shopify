import {Link} from 'react-router';
import {BRAND} from '~/lib/brand';

export function AnnouncementBar() {
  return (
    <div className="announcement-bar" role="region" aria-label="Store announcement">
      <p>
        {BRAND.announcement}{' '}
        <Link to="/collections/all">Shop now →</Link>
      </p>
    </div>
  );
}
