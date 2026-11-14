import { useLayoutEffect, useRef, useState, type RefObject } from "react";
import { moveProfileFavorite } from "../../api/profile.api";
import { useLocale } from "../../i18n";

interface Props {
  viewerId: number | null;
  activeUserId: RefObject<number | null>;
  movieIds: number[];
  removalBusy: boolean;
  previewLoading: boolean;
  sectionRef: RefObject<HTMLElement>;
  reload: () => void;
  setError: (message: string) => void;
  setMessage: (message: string) => void;
}

export function useProfileFavoriteOrder({ viewerId, activeUserId, movieIds, removalBusy, previewLoading, sectionRef, reload, setError, setMessage }: Props) {
  const { t } = useLocale();
  const [busy, setBusy] = useState(false);
  const requestScope = useRef(0);
  const inFlight = useRef(false);
  const pendingFocus = useRef<{ movieId: number; origin: Element | null } | null>(null);

  useLayoutEffect(() => {
    requestScope.current += 1;
    inFlight.current = false;
    pendingFocus.current = null;
    setBusy(false);
    return () => { requestScope.current += 1; };
  }, [viewerId]);

  useLayoutEffect(() => {
    const pending = pendingFocus.current;
    if (!pending || busy || previewLoading) return;
    pendingFocus.current = null;
    if (document.activeElement !== document.body && document.activeElement !== pending.origin) return;
    const target = sectionRef.current?.querySelector<HTMLButtonElement>(`[data-list-reorder-item="${pending.movieId}"]`)
      ?? sectionRef.current?.querySelector<HTMLElement>("h2");
    target?.focus();
  }, [busy, previewLoading, sectionRef]);

  const move = async (movieId: number, targetMovieId: number) => {
    if (viewerId === null || inFlight.current || removalBusy || previewLoading || movieId === targetMovieId) return;
    const scope = requestScope.current;
    const actorId = viewerId;
    const isCurrentRequest = () => requestScope.current === scope && activeUserId.current === actorId;
    if (!isCurrentRequest()) return;
    inFlight.current = true;
    const origin = document.activeElement;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const sourceIndex = movieIds.indexOf(movieId);
      const targetIndex = movieIds.indexOf(targetMovieId);
      if (sourceIndex < 0 || targetIndex < 0) return;
      await moveProfileFavorite(movieId, targetMovieId, sourceIndex < targetIndex ? "after" : "before", actorId);
      if (isCurrentRequest()) setMessage(t("favoriteOrderSaved"));
    } catch {
      if (isCurrentRequest()) setError(t("reorderListError"));
    } finally {
      if (isCurrentRequest()) {
        pendingFocus.current = { movieId, origin };
        // Read back after both success and failure because a disconnected write may have committed.
        reload();
        inFlight.current = false;
        setBusy(false);
      }
    }
  };

  return { busy, available: viewerId !== null, move };
}
