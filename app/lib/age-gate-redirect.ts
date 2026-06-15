import {redirect} from 'react-router';
import {isAgeVerified} from '~/lib/age-gate';
import {localizePath} from '~/lib/i18n/paths';

/** Redirect unverified shoppers to /age-verify with a safe return path. */
export function redirectToAgeVerifyIfNeeded(options: {
  session: {get: (key: string) => unknown};
  localePath: string;
  returnPath: string;
}): void {
  if (isAgeVerified(options.session)) return;

  const returnTo = localizePath(options.returnPath, options.localePath);
  const verifyPath = localizePath('/age-verify', options.localePath);
  throw redirect(
    `${verifyPath}?returnTo=${encodeURIComponent(returnTo)}`,
  );
}
