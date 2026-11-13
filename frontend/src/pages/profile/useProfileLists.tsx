import { useAuth } from "../../context/AuthContext";
import { useState, useRef, useEffect } from "react";
import { getUserLists, type UserList } from "../../api/lists.api";
import { type ProfileRoute } from "./profileRoute";

export function useProfileLists({ route }: {
  route: Pick<ProfileRoute, "settingsTab" | "profileView">;
}) {
  const { isAuth, user } = useAuth();
  const { settingsTab, profileView } = route;

  const [listMetadata, setListMetadata] = useState<UserList[] | null>(null);

  const [listMetadataLoading, setListMetadataLoading] = useState(false);

  const [listMetadataError, setListMetadataError] = useState(false);

  const [listMetadataAttempt, setListMetadataAttempt] = useState(0);

  const listMetadataHeadingRef = useRef<HTMLHeadingElement>(null);

  const listMetadataRetryFocus = useRef<{ origin: HTMLElement | null; attempt: number } | null>(null);

  useEffect(() => {
    let current = true;
    setListMetadata(null); setListMetadataError(false); setListMetadataLoading(false);
    if (!isAuth || !user?.id || settingsTab || (profileView && profileView !== "lists")) return;
    setListMetadataLoading(true);
    getUserLists().then(({ data }) => { if (current) setListMetadata(data); })
      .catch(() => { if (current) setListMetadataError(true); })
      .finally(() => { if (current) setListMetadataLoading(false); });
    return () => { current = false; };
  }, [settingsTab, isAuth, listMetadataAttempt, profileView, user?.id]);

  useEffect(() => {
    const pending = listMetadataRetryFocus.current;
    if (!pending || pending.attempt !== listMetadataAttempt || listMetadataLoading) return;
    const frame = window.requestAnimationFrame(() => {
      if (listMetadataRetryFocus.current !== pending) return;
      listMetadataRetryFocus.current = null;
      const active = document.activeElement;
      if (active !== document.body && active !== pending.origin) return;
      if (listMetadataError) document.querySelector<HTMLButtonElement>("#profile-lists [data-retry-button]:not(:disabled)")?.focus();
      else listMetadataHeadingRef.current?.focus();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [listMetadataAttempt, listMetadataError, listMetadataLoading, listMetadata]);

  return {
    listMetadataLoading,
    listMetadataHeadingRef,
    listMetadataError,
    listMetadataRetryFocus,
    listMetadataAttempt,
    setListMetadataLoading,
    setListMetadataError,
    setListMetadataAttempt,
    listMetadata,
  };
}

export type ProfileListsModel = ReturnType<typeof useProfileLists>;
