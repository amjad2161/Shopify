import type {StoreEnvRecord} from '~/lib/store-env';

/** True when PUBLIC_3D_EXPERIENCE is enabled (1 | true | yes). */
export function isImmersive3dEnabled(env: StoreEnvRecord): boolean {
  const value = env.PUBLIC_3D_EXPERIENCE?.trim().toLowerCase();
  return value === '1' || value === 'true' || value === 'yes';
}

/** Home paths that may render the immersive canvas (default + locale roots). */
export function isImmersiveHomePath(pathname: string): boolean {
  if (pathname === '/') return true;
  return /^\/[a-z]{2}(-[A-Z]{2})?\/?$/.test(pathname);
}
