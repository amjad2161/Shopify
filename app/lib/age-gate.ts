/** Shopify product tag that triggers the 18+ storefront gate. */
export const AGE_GATE_TAG = 'age-18-plus';

export const AGE_VERIFIED_SESSION_KEY = 'ageVerified';
export const AGE_VERIFIED_AT_SESSION_KEY = 'ageVerifiedAt';

/** Session TTL — shoppers re-confirm after 24 hours. */
export const AGE_VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;

/** Collection handles that always require age verification. */
export const AGE_RESTRICTED_COLLECTION_HANDLES = new Set([
  'adults-only',
  'lingerie-intimates',
]);

export function productRequiresAgeGate(
  tags: Array<string | null | undefined> | null | undefined,
): boolean {
  if (!tags?.length) return false;
  return tags.some(
    (tag) => tag?.trim().toLowerCase() === AGE_GATE_TAG.toLowerCase(),
  );
}

export function collectionRequiresAgeGate(handle: string | null | undefined): boolean {
  if (!handle?.trim()) return false;
  return AGE_RESTRICTED_COLLECTION_HANDLES.has(handle.trim().toLowerCase());
}

export function searchTermRequiresAgeGate(term: string | null | undefined): boolean {
  if (!term?.trim()) return false;
  const normalized = term.trim().toLowerCase();
  return (
    normalized.includes('age-18-plus') ||
    normalized.includes('tag:age-18-plus') ||
    normalized.includes('adults-only')
  );
}

export function isAgeVerified(
  session: {get: (key: string) => unknown},
): boolean {
  if (session.get(AGE_VERIFIED_SESSION_KEY) !== true) return false;

  const verifiedAt = session.get(AGE_VERIFIED_AT_SESSION_KEY);
  if (typeof verifiedAt !== 'number') return true;

  return Date.now() - verifiedAt < AGE_VERIFICATION_TTL_MS;
}

export function markAgeVerified(session: {
  set: (key: string, value: unknown) => void;
}): void {
  session.set(AGE_VERIFIED_SESSION_KEY, true);
  session.set(AGE_VERIFIED_AT_SESSION_KEY, Date.now());
}

type CartLineForAgeGate = {
  merchandise?: {
    product?: {tags?: Array<string | null | undefined> | null} | null;
  } | null;
};

/** True when any cart line references an age-restricted product. */
export function cartRequiresAgeGate(
  lines: Array<CartLineForAgeGate> | null | undefined,
): boolean {
  if (!lines?.length) return false;
  return lines.some((line) =>
    productRequiresAgeGate(line.merchandise?.product?.tags),
  );
}
