export function logInfo(message: string, data?: Record<string, unknown>) {
  const suffix = data ? ` ${JSON.stringify(data)}` : '';
  console.log(`[catalog] ${message}${suffix}`);
}

export function logWarn(message: string, data?: Record<string, unknown>) {
  const suffix = data ? ` ${JSON.stringify(data)}` : '';
  console.warn(`[catalog:warn] ${message}${suffix}`);
}

export function logError(message: string, error?: unknown) {
  console.error(`[catalog:error] ${message}`, error);
}
