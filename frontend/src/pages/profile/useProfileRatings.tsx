import { useAuth } from "../../context/AuthContext";
import { useLocation } from "react-router-dom";
import { useLocale } from "../../i18n";
import { useState, useRef, useEffect } from "react";
import { getProfileRatings, type ProfilePage, type ProfileRating } from "../../api/profile.api";
import { isPageOutOfRange, getLastPageIndex } from "../../utils/pagination";
import { type ProfileRoute } from "./profileRoute";

export function useProfileRatings({ route }: {
  route: Pick<ProfileRoute, "profileView" | "settingsTab">;
}) {
  const { isAuth, user } = useAuth();
  const location = useLocation();
  const { lang } = useLocale();
  const { profileView, settingsTab } = route;

  const [ratingsHistory, setRatingsHistory] = useState<ProfilePage<ProfileRating> | null>(null);

  const [ratingsPage, setRatingsPage] = useState(0);

  const [ratingsLoading, setRatingsLoading] = useState(false);

  const [ratingsError, setRatingsError] = useState(false);

  const [ratingsAttempt, setRatingsAttempt] = useState(0);

  const ratingsHeadingRef = useRef<HTMLHeadingElement>(null);

  const ratingsRequest = useRef(0);

  const ratingsFocusScope = JSON.stringify([location.key, lang, isAuth, user?.id ?? null, ratingsPage, profileView, settingsTab]);

  const currentRatingsFocusScope = useRef(ratingsFocusScope);

  currentRatingsFocusScope.current = ratingsFocusScope;

  const pendingRatingsFocus = useRef<{ origin: HTMLElement | null; scope: string; request: number } | null>(null);

  useEffect(() => {
    if (!isAuth) return;
    let current = true;
    const request = ++ratingsRequest.current;
    const isCurrentRequest = () => current && ratingsRequest.current === request;
    setRatingsLoading(true);
    setRatingsError(false);
    setRatingsHistory(null);
    getProfileRatings(ratingsPage)
      .then(({ data }) => {
        if (!isCurrentRequest()) return;
        if (isPageOutOfRange(ratingsPage, data.totalPages)) {
          setRatingsPage(getLastPageIndex(data.totalPages));
          return;
        }
        setRatingsHistory(data);
      })
      .catch(() => { if (isCurrentRequest()) setRatingsError(true); })
      .finally(() => { if (isCurrentRequest()) setRatingsLoading(false); });
    return () => { current = false; };
  }, [isAuth, ratingsPage, ratingsAttempt, user?.id]);

  useEffect(() => {
    const pending = pendingRatingsFocus.current;
    if (!pending || pending.scope !== currentRatingsFocusScope.current || pending.request !== ratingsRequest.current || ratingsLoading) return;
    const frame = window.requestAnimationFrame(() => {
      if (pendingRatingsFocus.current !== pending) return;
      pendingRatingsFocus.current = null;
      if (pending.scope !== currentRatingsFocusScope.current || pending.request !== ratingsRequest.current) return;
      const active = document.activeElement;
      if (active !== document.body && active !== pending.origin) return;
      if (ratingsError) document.querySelector<HTMLButtonElement>("#profile-ratings [data-retry-button]:not(:disabled)")?.focus();
      else ratingsHeadingRef.current?.focus();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [ratingsAttempt, ratingsError, ratingsLoading, ratingsHistory, ratingsPage, profileView, settingsTab, lang, isAuth, user?.id, location.key]);

  return {
    ratingsLoading,
    ratingsHeadingRef,
    ratingsError,
    pendingRatingsFocus,
    currentRatingsFocusScope,
    ratingsRequest,
    setRatingsLoading,
    setRatingsError,
    setRatingsAttempt,
    ratingsHistory,
    ratingsPage,
    setRatingsPage,
  };
}

export type ProfileRatingsModel = ReturnType<typeof useProfileRatings>;
