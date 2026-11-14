import { useAuth } from "../../context/AuthContext";
import { useLocale } from "../../i18n";
import { useState, useRef, useLayoutEffect, useEffect } from "react";
import { type MoviePage } from "../../api/search.api";
import { getProfileCollection } from "../../api/profile.api";
import { clearMovieFlag } from "../../api/movies.api";
import { type ProfileFeedbackModel } from "./useProfileFeedback";
import { type ProfileIdentityModel } from "./useProfileIdentity";

export function useProfileFavorites({ feedback, identity }: {
  feedback: Pick<ProfileFeedbackModel, "activeUserId" | "setError" | "setMessage">;
  identity: Pick<ProfileIdentityModel, "setProfile">;
}) {
  const { isAuth, user } = useAuth();
  const { t } = useLocale();
  const { activeUserId, setError, setMessage } = feedback;
  const { setProfile } = identity;

  const [favoritePreview, setFavoritePreview] = useState<MoviePage | null>(null);

  const [favoritePreviewLoading, setFavoritePreviewLoading] = useState(false);

  const [favoritePreviewError, setFavoritePreviewError] = useState(false);

  const [favoritePreviewAttempt, setFavoritePreviewAttempt] = useState(0);

  const [favoriteRemovalId, setFavoriteRemovalId] = useState<number | null>(null);
  const favoriteMutation = useRef(0);
  const removalFocus = useRef<{ requestId: number; index: number; origin: Element | null } | null>(null);

  const favoriteSettingsRef = useRef<HTMLElement | null>(null);

  const favoriteOverviewRef = useRef<HTMLElement | null>(null);

  const favoriteOverviewHeadingRef = useRef<HTMLHeadingElement>(null);

  const favoriteRetryFocus = useRef<{ origin: HTMLElement | null; attempt: number; target: "overview" | "settings" } | null>(null);

  const favoriteActorScope = isAuth && user ? user.id : null;
  useLayoutEffect(() => {
    favoriteMutation.current += 1;
    removalFocus.current = null;
    setFavoriteRemovalId(null);
  }, [favoriteActorScope]);

  useLayoutEffect(() => {
    const pending = removalFocus.current;
    if (!pending || favoriteRemovalId !== null) return;
    removalFocus.current = null;
    if (pending.requestId !== favoriteMutation.current) return;
    const active = document.activeElement;
    if (active !== document.body && active !== pending.origin) return;
    const section = favoriteSettingsRef.current;
    const buttons = section?.querySelectorAll<HTMLButtonElement>("[data-favorite-remove]");
    const next = buttons?.item(Math.min(pending.index, (buttons?.length ?? 1) - 1));
    (next ?? section?.querySelector<HTMLElement>("h2"))?.focus();
  }, [favoritePreview, favoriteRemovalId]);

  useEffect(() => {
    setFavoritePreview(null);
    setFavoritePreviewError(false);
    if (!isAuth || !user?.id) {
      setFavoritePreviewLoading(false);
      return;
    }
    const requestUserId = user.id;
    let current = true;
    const isCurrentRequest = () => current && activeUserId.current === requestUserId;
    setFavoritePreviewLoading(true);
    getProfileCollection("favorites", 0)
      .then(({ data }) => { if (isCurrentRequest()) setFavoritePreview(data); })
      .catch(() => { if (isCurrentRequest()) setFavoritePreviewError(true); })
      .finally(() => { if (isCurrentRequest()) setFavoritePreviewLoading(false); });
    return () => { current = false; };
  }, [isAuth, user?.id, favoritePreviewAttempt]);

  useEffect(() => {
    const pending = favoriteRetryFocus.current;
    if (!pending || pending.attempt !== favoritePreviewAttempt || favoritePreviewLoading) return;
    const frame = window.requestAnimationFrame(() => {
      if (favoriteRetryFocus.current !== pending) return;
      favoriteRetryFocus.current = null;
      const active = document.activeElement;
      if (active !== document.body && active !== pending.origin) return;
      if (favoritePreviewError) {
        const section = pending.target === "settings" ? favoriteSettingsRef.current : favoriteOverviewRef.current;
        section?.querySelector<HTMLButtonElement>("[data-retry-button]:not(:disabled)")?.focus();
      } else if (pending.target === "settings") {
        favoriteSettingsRef.current?.querySelector<HTMLElement>("h2")?.focus();
      } else {
        favoriteOverviewHeadingRef.current?.focus();
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, [favoritePreviewAttempt, favoritePreviewError, favoritePreviewLoading, favoritePreview]);

  const removeFavorite = async (movieId: number, index: number) => {
    if (favoriteRemovalId !== null) return;
    const requestId = ++favoriteMutation.current;
    const requestUserId = activeUserId.current;
    const isCurrentRequest = () => requestUserId !== null
      && activeUserId.current === requestUserId && favoriteMutation.current === requestId;
    const origin = document.activeElement;
    setFavoriteRemovalId(movieId);
    setError("");
    setMessage("");
    try {
      await clearMovieFlag(movieId, "favorite");
      if (!isCurrentRequest()) return;
      removalFocus.current = { requestId, index, origin };
      setFavoritePreview(current => current ? {
        ...current,
        content: current.content.filter(movie => movie.id !== movieId),
        totalElements: Math.max(0, current.totalElements - 1),
      } : current);
      setProfile(current => current ? { ...current, stats: { ...current.stats, favorites: Math.max(0, current.stats.favorites - 1) } } : current);
      setMessage(t("favoriteRemoved"));
    } catch {
      if (isCurrentRequest()) setError(t("removeItemError"));
    } finally {
      if (isCurrentRequest()) setFavoriteRemovalId(null);
    }
  };

  return {
    favoriteSettingsRef,
    favoritePreviewLoading,
    favoriteRemovalId,
    favoritePreviewError,
    favoriteRetryFocus,
    favoritePreviewAttempt,
    setFavoritePreviewLoading,
    setFavoritePreviewError,
    setFavoritePreviewAttempt,
    favoritePreview,
    removeFavorite,
    favoriteOverviewRef,
    favoriteOverviewHeadingRef,
  };
}

export type ProfileFavoritesModel = ReturnType<typeof useProfileFavorites>;
