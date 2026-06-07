/** Detect WebGL1 support in the current browser (client-only). */
export function detectWebGLSupport(): boolean {
  if (typeof document === 'undefined') return true;

  try {
    const canvas = document.createElement('canvas');
    const gl =
      canvas.getContext('webgl2', {failIfMajorPerformanceCaveat: true}) ??
      canvas.getContext('webgl', {failIfMajorPerformanceCaveat: true}) ??
      canvas.getContext('experimental-webgl' as 'webgl', {
        failIfMajorPerformanceCaveat: true,
      });

    return gl != null;
  } catch {
    return false;
  }
}
