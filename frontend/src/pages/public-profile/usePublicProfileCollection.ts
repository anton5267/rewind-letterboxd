import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { getPublicProfileCollection, type PublicCollection, type PublicProfileResponse } from "../../api/profile.api";
import type { MoviePage } from "../../api/search.api";
import { useAuth } from "../../context/AuthContext";
import { useLocale } from "../../i18n";
import { isPageOutOfRange, getLastPageIndex } from "../../utils/pagination";
import type { PublicProfileView } from "./publicProfileNavigation";

export function usePublicProfileCollection(profileId: number, profile: PublicProfileResponse | null, profileView: PublicProfileView, collectionKind: PublicCollection) {
  const { lang } = useLocale();
  const { isAuth, user } = useAuth();
  const validProfileId = Number.isSafeInteger(profileId) && profileId > 0;

  const [collection, setCollection] = useState<MoviePage | null>(null);

  const [collectionPage, setCollectionPage] = useState(0);

  const [collectionLoading, setCollectionLoading] = useState(false);

  const [collectionError, setCollectionError] = useState(false);

  const [collectionAttempt, setCollectionAttempt] = useState(0);

  const collectionHeadingRef = useRef<HTMLHeadingElement>(null);

  const collectionMounted = useRef(false);

  const collectionScopeGeneration = useRef(0);

  const collectionRequest = useRef(0);

  const pendingCollectionFocus = useRef<{ scope: number; request: number; origin: HTMLElement | null } | null>(null);

  const collectionPageCarry = useRef<{ key: string; page: number; focus: NonNullable<typeof pendingCollectionFocus.current> } | null>(null);

  const collectionScopeKey = JSON.stringify([lang, isAuth, user?.id ?? null, user?.role ?? null, profileId, profileView, collectionKind]);

  useLayoutEffect(() => {
    collectionMounted.current = true;
    return () => {
      collectionMounted.current = false;
      collectionScopeGeneration.current += 1;
      pendingCollectionFocus.current = null;
    };
  }, []);

  useLayoutEffect(() => {
    collectionScopeGeneration.current += 1;
    const carry = collectionPageCarry.current;
    pendingCollectionFocus.current = carry && carry.key === collectionScopeKey && carry.page === collectionPage && pendingCollectionFocus.current === carry.focus
      ? { ...carry.focus, scope: collectionScopeGeneration.current } : null;
    collectionPageCarry.current = null;
  }, [collectionScopeKey, collectionPage]);

  const changeCollectionPage = (nextPage: number) => {
    if (nextPage === collectionPage || collectionLoading) return;
    const focus = { scope: collectionScopeGeneration.current, request: collectionRequest.current + 1, origin: document.activeElement instanceof HTMLElement ? document.activeElement : null };
    pendingCollectionFocus.current = focus;
    collectionPageCarry.current = { key: collectionScopeKey, page: nextPage, focus };
    setCollectionLoading(true);
    setCollectionPage(nextPage);
  };

  const retryCollection = () => {
    pendingCollectionFocus.current = { scope: collectionScopeGeneration.current, request: collectionRequest.current + 1, origin: document.activeElement instanceof HTMLElement ? document.activeElement : null };
    setCollectionLoading(true);
    setCollectionAttempt(value => value + 1);
  };

  useEffect(() => {
    if (!validProfileId || profile?.id !== profileId) return;
    let current = true;
    const scope = collectionScopeGeneration.current;
    const request = ++collectionRequest.current;
    const isCurrent = () => current && collectionMounted.current && collectionScopeGeneration.current === scope && collectionRequest.current === request;
    setCollectionLoading(true);
    setCollection(null);
    setCollectionError(false);
    getPublicProfileCollection(profileId, collectionKind, collectionPage)
      .then(({ data }) => {
        if (!isCurrent()) return;
        if (isPageOutOfRange(collectionPage, data.totalPages)) {
          const page = getLastPageIndex(data.totalPages);
          const pending = pendingCollectionFocus.current;
          if (pending && pending.scope === scope && pending.request === request) {
            const focus = { ...pending, request: request + 1 };
            pendingCollectionFocus.current = focus;
            collectionPageCarry.current = { key: collectionScopeKey, page, focus };
          }
          setCollectionPage(page);
          return;
        }
        setCollection(data);
      })
      .catch(() => { if (isCurrent()) setCollectionError(true); })
      .finally(() => { if (isCurrent()) setCollectionLoading(false); });
    return () => { current = false; };
  }, [collectionAttempt, collectionPage, collectionScopeKey, profile?.id, profileId, validProfileId]);

  useEffect(() => {
    const pending = pendingCollectionFocus.current;
    if (!pending || collectionLoading || collectionRequest.current !== pending.request || (!collectionError && collection === null)) return;
    const frame = window.requestAnimationFrame(() => {
      if (pendingCollectionFocus.current !== pending) return;
      pendingCollectionFocus.current = null;
      if (!collectionMounted.current || collectionScopeGeneration.current !== pending.scope || collectionRequest.current !== pending.request) return;
      if (document.activeElement !== document.body && document.activeElement !== pending.origin) return;
      const mobileTitle = profileView === "collection" ? document.getElementById("public-profile-view-title") : null;
      const mobileBounds = mobileTitle?.getBoundingClientRect();
      const target = collectionError
        ? document.getElementById("public-profile-collection-content")?.querySelector<HTMLButtonElement>("[data-retry-button]")
        : mobileBounds && mobileBounds.width > 1 && mobileBounds.height > 1 ? mobileTitle : collectionHeadingRef.current;
      target?.focus();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [collection, collectionError, collectionLoading, collectionPage, collectionScopeKey]);

  useEffect(() => { setCollectionPage(0); }, [collectionKind, profileId]);

  return { collection, collectionPage, collectionLoading, collectionError, collectionHeadingRef, setCollectionPage, changeCollectionPage, retryCollection };
}
