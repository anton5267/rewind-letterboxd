/** Accept only explicitly allowed local route paths from React Router state. */
export function getAuthReturnTo(state: unknown, allowedPaths: readonly string[]): string | null {
  if (typeof state !== "object" || state === null || !("returnTo" in state)) return null;
  const { returnTo } = state;
  if (typeof returnTo !== "string" || returnTo.length > 2048 || /[\u0000-\u001f\u007f\\]/.test(returnTo)) return null;

  const pathname = returnTo.split(/[?#]/, 1)[0];
  return allowedPaths.some(path => pathname === path || pathname === `${path}/`)
    ? returnTo
    : null;
}
