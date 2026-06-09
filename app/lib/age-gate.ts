/** Shopify product tag that triggers the 18+ storefront gate. */
export const AGE_GATE_TAG = 'age-18-plus';

export const AGE_VERIFIED_SESSION_KEY = 'ageVerified';

export function productRequiresAgeGate(
  tags: Array<string | null | undefined> | null | undefined,
): boolean {
  if (!tags?.length) return false;
  return tags.some(
    (tag) => tag?.trim().toLowerCase() === AGE_GATE_TAG.toLowerCase(),
  );
}

export function isAgeVerified(
  session: {get: (key: string) => unknown},
): boolean {
  return session.get(AGE_VERIFIED_SESSION_KEY) === true;
}
