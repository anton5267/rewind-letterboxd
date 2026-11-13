import { useAuth } from "../../context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { useLocale } from "../../i18n";
import { useState, useRef, useLayoutEffect, useEffect } from "react";
import { type MoviePage } from "../../api/search.api";
import { getProfileCollection, type ProfileCollection } from "../../api/profile.api";
import { isPageOutOfRange, getLastPageIndex } from "../../utils/pagination";
import { useRovingTabs } from "../../hooks/useRovingTabs";
import { type ProfileRoute } from "./profileRoute";
import { collectionKinds } from "./profileConstants";

export function useProfileCollections({ route }: {
  route: Pick<ProfileRoute, "settingsTab" | "profileView" | "collectionKind">;
}) {
  const { isAuth, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { lang } = useLocale();
  const { settingsTab, profileView, collectionKind } = route;

  const [collectionFiltersOpen, setCollectionFiltersOpen] = useState(false);

  const collectionFilterButtonRef = useRef<HTMLButtonElement | null>(null);

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

  const collectionScopeKey = JSON.stringify([lang, isAuth, user?.id ?? null, user?.role ?? null, settingsTab, profileView, collectionKind]);

  const collectionToolbarHeadingRef = useRef<HTMLHeadingElement>(null);

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
    if (!isAuth) return;
    let current = true;
    const scope = collectionScopeGeneration.current;
    const request = ++collectionRequest.current;
    const isCurrent = () => current && collectionMounted.current && collectionScopeGeneration.current === scope && collectionRequest.current === request;
    setCollectionLoading(true);
    setCollection(null);
    setCollectionError(false);
    getProfileCollection(collectionKind, collectionPage)
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
  }, [collectionAttempt, collectionPage, collectionScopeKey, isAuth]);

  useEffect(() => {
    const pending = pendingCollectionFocus.current;
    if (!pending || collectionLoading || collectionRequest.current !== pending.request || (!collectionError && collection === null)) return;
    const frame = window.requestAnimationFrame(() => {
      if (pendingCollectionFocus.current !== pending) return;
      pendingCollectionFocus.current = null;
      if (!collectionMounted.current || collectionScopeGeneration.current !== pending.scope || collectionRequest.current !== pending.request) return;
      if (document.activeElement !== document.body && document.activeElement !== pending.origin) return;
      const mobileTitle = collectionToolbarHeadingRef.current;
      const mobileBounds = mobileTitle?.getBoundingClientRect();
      const target = mobileBounds && mobileBounds.width > 1 && mobileBounds.height > 1 ? mobileTitle : collectionHeadingRef.current;
      target?.focus();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [collection, collectionError, collectionLoading, collectionPage, collectionScopeKey]);

  const chooseCollection = (kind: ProfileCollection) => {
    setCollectionPage(0);
    const search = new URLSearchParams(location.search);
    search.set("collection", kind);
    navigate({ search: `?${search}`, hash: "#profile-collections" }, { preventScrollReset: true });
  };

  useEffect(() => { setCollectionPage(0); }, [collectionKind, user?.id]);

  useEffect(() => { setCollectionFiltersOpen(false); }, [profileView, user?.id]);

  const { setTabRef, handleKeyDown } = useRovingTabs(collectionKinds, chooseCollection);

  const closeCollectionFiltersOnEscape = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.key !== "Escape" || !collectionFiltersOpen) return false;
    event.preventDefault();
    setCollectionFiltersOpen(false);
    window.requestAnimationFrame(() => collectionFilterButtonRef.current?.focus());
    return true;
  };

  const handleCollectionTabKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, kind: ProfileCollection) => {
    if (closeCollectionFiltersOnEscape(event)) return;
    handleKeyDown(event, kind);
  };

  return {
    collectionLoading,
    collectionToolbarHeadingRef,
    collectionFilterButtonRef,
    collectionFiltersOpen,
    setCollectionFiltersOpen,
    closeCollectionFiltersOnEscape,
    setCollectionPage,
    collectionHeadingRef,
    setTabRef,
    chooseCollection,
    handleCollectionTabKeyDown,
    collection,
    collectionError,
    retryCollection,
    collectionPage,
    changeCollectionPage,
  };
}

export type ProfileCollectionsModel = ReturnType<typeof useProfileCollections>;
