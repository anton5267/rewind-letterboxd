export const PENDING_PKCE_SIGNUP_CALLBACK = "rewind:pending-pkce-signup-callback";

export function capturePkceSignupCallback(): void {
  const hasCode = new URLSearchParams(window.location.search).has("code");
  const isLoginRoute = /\/(?:uk|en)\/login\/?$/.test(window.location.pathname);
  if (hasCode && isLoginRoute) {
    window.sessionStorage.setItem(PENDING_PKCE_SIGNUP_CALLBACK, "1");
  }
}
