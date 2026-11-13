/** Recover a deleted lazy chunk only after confirming a different deployed entry. */
export function enableStaleAssetRecovery() {
  const storageKey = `rewind:stale-asset:${import.meta.env.BASE_URL}`;
  let checking = false;

  async function checkDeployment() {
    if (checking) return;
    const currentEntry = document.querySelector<HTMLScriptElement>('script[type="module"][src]');
    if (!currentEntry) return;
    checking = true;

    try {
      // Record the public bundle URL before reloading to bound recovery even
      // when an intermediary serves the old HTML again.
      const previous = JSON.parse(sessionStorage.getItem(storageKey) ?? "null") as { entry?: string; at?: number } | null;
      if (previous?.entry === currentEntry.src || (previous?.at ?? 0) > Date.now() - 60_000) return;
      const response = await fetch(import.meta.env.BASE_URL, {
        cache: "no-cache",
        credentials: "omit",
        signal: AbortSignal.timeout(5000),
      });
      if (!response.ok) return;
      const html = new DOMParser().parseFromString(await response.text(), "text/html");
      const nextSource = html.querySelector('script[type="module"][src]')?.getAttribute("src");
      if (!nextSource) return;
      const nextEntry = new URL(nextSource, response.url);
      if (nextEntry.origin !== window.location.origin || nextEntry.href === currentEntry.src) return;

      sessionStorage.setItem(storageKey, JSON.stringify({ entry: currentEntry.src, at: Date.now() }));
      window.location.reload();
    } catch {
      // The existing error boundary keeps its manual Reload action when the
      // network or session storage is unavailable.
    } finally {
      checking = false;
    }
  }

  window.addEventListener("vite:preloadError", () => { void checkDeployment(); });
}
