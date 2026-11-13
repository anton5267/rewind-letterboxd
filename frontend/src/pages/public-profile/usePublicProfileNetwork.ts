import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { type PublicProfileResponse } from "../../api/profile.api";
import { getFollowers, getFollowing, type NetworkPage } from "../../api/social.api";
import { useAuth } from "../../context/AuthContext";
import { useLocale } from "../../i18n";
import { isPageOutOfRange, getLastPageIndex } from "../../utils/pagination";
import type { PublicProfileView } from "./publicProfileNavigation";

export function usePublicProfileNetwork(profileId: number, profile: PublicProfileResponse | null, profileView: PublicProfileView) {
  const { lang } = useLocale();
  const { isAuth, user } = useAuth();
  const location = useLocation();
  const validProfileId = Number.isSafeInteger(profileId) && profileId > 0;

  const [followers, setFollowers] = useState<NetworkPage | null>(null);

  const [following, setFollowing] = useState<NetworkPage | null>(null);

  const [followersPage, setFollowersPage] = useState(0);

  const [followingPage, setFollowingPage] = useState(0);

  const [followersLoading, setFollowersLoading] = useState(false);

  const [followersError, setFollowersError] = useState(false);

  const [followersAttempt, setFollowersAttempt] = useState(0);

  const followersHeadingRef = useRef<HTMLHeadingElement>(null);

  const [followingLoading, setFollowingLoading] = useState(false);

  const [followingError, setFollowingError] = useState(false);

  const [followingAttempt, setFollowingAttempt] = useState(0);

  const followingHeadingRef = useRef<HTMLHeadingElement>(null);

  const networkListRetryScope = JSON.stringify([location.key, lang, profileId, profileView, followingPage, followersPage]);

  const pendingNetworkListRetryFocus = useRef<{ target: "following" | "followers"; scope: string; origin: HTMLElement | null } | null>(null);

  const networkFocusOrigin = useRef<HTMLElement | null>(null);

  const pendingNetworkFocus = useRef<{ origin: HTMLElement; memberId: string; action: string; sectionId: string; scope: string } | null>(null);

  const networkFocusScope = `${location.key}:${profileId}:${lang}:${isAuth ? user?.id : "guest"}`;

  const currentNetworkFocusScope = useRef(networkFocusScope);

  currentNetworkFocusScope.current = networkFocusScope;

  useEffect(() => {
    pendingNetworkFocus.current = null;
    networkFocusOrigin.current = null;
  }, [networkFocusScope]);

  useEffect(() => {
    const pending = pendingNetworkFocus.current;
    if (!pending) return;
    const settled = pending.sectionId === "public-profile-following" ? !followingLoading && (followingError || following !== null) :
      !followersLoading && (followersError || followers !== null);
    if (!settled) return;
    const frame = window.requestAnimationFrame(() => {
      if (pendingNetworkFocus.current !== pending || pending.scope !== currentNetworkFocusScope.current) return;
      pendingNetworkFocus.current = null;
      if (pending.origin.isConnected || (document.activeElement !== document.body && document.activeElement !== null)) return;
      const section = document.getElementById(pending.sectionId);
      const row = Array.from(section?.querySelectorAll<HTMLElement>("[data-network-member-id]") ?? []).find(item => item.dataset.networkMemberId === pending.memberId);
      const action = row?.querySelector<HTMLElement>(`[data-network-action="${pending.action}"]:not(:disabled)`);
      const mobileTitle = document.getElementById("public-profile-view-title");
      const target = action?.getClientRects().length ? action : mobileTitle?.getClientRects().length ? mobileTitle : section?.querySelector<HTMLElement>("h2");
      target?.focus();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [following, followingError, followingLoading, followers, followersError, followersLoading, networkFocusScope]);

  useEffect(() => {
    setFollowersPage(0);
    setFollowingPage(0);
  }, [profileId, isAuth, user?.id]);

  useEffect(() => {
    if (!validProfileId || profile?.id !== profileId) return;
    let current = true;
    setFollowersLoading(true);
    setFollowers(null);
    setFollowersError(false);
    getFollowers(profileId, followersPage)
      .then(({ data }) => {
        if (!current) return;
        if (isPageOutOfRange(followersPage, data.totalPages)) {
          setFollowersPage(getLastPageIndex(data.totalPages));
          return;
        }
        setFollowers(data);
      })
      .catch(() => { if (current) setFollowersError(true); })
      .finally(() => { if (current) setFollowersLoading(false); });
    return () => { current = false; };
  }, [followersAttempt, followersPage, lang, profile?.id, profileId, validProfileId]);

  useEffect(() => {
    if (!validProfileId || profile?.id !== profileId) return;
    let current = true;
    setFollowingLoading(true);
    setFollowing(null);
    setFollowingError(false);
    getFollowing(profileId, followingPage)
      .then(({ data }) => {
        if (!current) return;
        if (isPageOutOfRange(followingPage, data.totalPages)) {
          setFollowingPage(getLastPageIndex(data.totalPages));
          return;
        }
        setFollowing(data);
      })
      .catch(() => { if (current) setFollowingError(true); })
      .finally(() => { if (current) setFollowingLoading(false); });
    return () => { current = false; };
  }, [followingAttempt, followingPage, lang, profile?.id, profileId, validProfileId]);

  useEffect(() => {
    const pending = pendingNetworkListRetryFocus.current;
    if (!pending) return;
    if (pending.scope !== networkListRetryScope) {
      pendingNetworkListRetryFocus.current = null;
      return;
    }
    const state = pending.target === "following"
      ? { loading: followingLoading, error: followingError, data: following }
      : { loading: followersLoading, error: followersError, data: followers };
    if (state.loading || (!state.error && state.data === null)) return;
    const frame = window.requestAnimationFrame(() => {
      if (pendingNetworkListRetryFocus.current !== pending) return;
      pendingNetworkListRetryFocus.current = null;
      if (pending.scope !== networkListRetryScope) return;
      const active = document.activeElement;
      if (active !== document.body && active !== pending.origin) return;
      const section = document.getElementById(`public-profile-${pending.target}`);
      if (state.error) {
        section?.querySelector<HTMLButtonElement>("[data-retry-button]")?.focus();
        return;
      }
      const mobileTitle = document.getElementById("public-profile-view-title");
      const mobileBounds = mobileTitle?.getBoundingClientRect();
      const target = mobileBounds && mobileBounds.width > 1 && mobileBounds.height > 1
        ? mobileTitle : pending.target === "following" ? followingHeadingRef.current : followersHeadingRef.current;
      target?.focus({ preventScroll: true });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [following, followingError, followingLoading, followers, followersError, followersLoading, networkListRetryScope]);

  const retryNetworkList = (target: "following" | "followers") => {
    pendingNetworkListRetryFocus.current = {
      target, scope: networkListRetryScope,
      origin: document.activeElement instanceof HTMLElement ? document.activeElement : null,
    };
    if (target === "following") {
      setFollowingLoading(true);
      setFollowingError(false);
      setFollowingAttempt(value => value + 1);
    } else {
      setFollowersLoading(true);
      setFollowersError(false);
      setFollowersAttempt(value => value + 1);
    }
  };

  useEffect(() => {
    if (profileView !== "following" && !location.hash.startsWith("#public-profile-following")) setFollowingPage(0);
  }, [profileView, profileId, location.hash]);

  const refreshNetwork = useCallback(() => {
    const origin = networkFocusOrigin.current;
    const sectionId = origin?.closest("section")?.id;
    const memberId = origin?.closest<HTMLElement>("[data-network-member-id]")?.dataset.networkMemberId;
    const action = origin?.dataset.networkAction;
    pendingNetworkFocus.current = origin && memberId && (action === "more" || action === "follow") &&
      (sectionId === "public-profile-following" || sectionId === "public-profile-followers") &&
      (document.activeElement === origin || document.activeElement === document.body) ?
      { origin, memberId, action, sectionId, scope: currentNetworkFocusScope.current } : null;
    setFollowersAttempt(value => value + 1);
    setFollowingAttempt(value => value + 1);
  }, []);

  const retryFollowingPreview = () => {
    setFollowingLoading(true); setFollowingError(false); setFollowingAttempt(value => value + 1);
  };

  const refreshNetworkLists = useCallback(() => {
    setFollowersAttempt(value => value + 1);
    setFollowingAttempt(value => value + 1);
  }, []);

  return {
    followers, followersPage, followersLoading, followersError, followersHeadingRef, setFollowersPage,
    following, followingPage, followingLoading, followingError, followingHeadingRef, setFollowingPage,
    networkFocusOrigin, retryNetworkList, retryFollowingPreview, refreshNetwork, refreshNetworkLists,
  };
}
