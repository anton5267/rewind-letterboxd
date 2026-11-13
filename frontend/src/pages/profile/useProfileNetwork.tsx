import { useAuth } from "../../context/AuthContext";
import { useLocation } from "react-router-dom";
import { useLocale } from "../../i18n";
import { useState, useRef, useCallback, useLayoutEffect, useEffect } from "react";
import { getFollowing, getFollowers, type NetworkPage } from "../../api/social.api";
import { isPageOutOfRange, getLastPageIndex } from "../../utils/pagination";
import { type ProfileRoute } from "./profileRoute";

export function useProfileNetwork({ route }: {
  route: Pick<ProfileRoute, "profileView" | "settingsTab">;
}) {
  const { isAuth, user } = useAuth();
  const location = useLocation();
  const { lang } = useLocale();
  const { profileView, settingsTab } = route;

  const [following, setFollowing] = useState<NetworkPage | null>(null);

  const [followingPage, setFollowingPage] = useState(0);

  const [followingLoading, setFollowingLoading] = useState(false);

  const [followingError, setFollowingError] = useState(false);

  const [followingAttempt, setFollowingAttempt] = useState(0);

  const [followers, setFollowers] = useState<NetworkPage | null>(null);

  const [followersPage, setFollowersPage] = useState(0);

  const [followersLoading, setFollowersLoading] = useState(false);

  const [followersError, setFollowersError] = useState(false);

  const [followersAttempt, setFollowersAttempt] = useState(0);

  const networkMounted = useRef(false);

  const networkToolbarHeadingRef = useRef<HTMLHeadingElement>(null);

  const networkRequests = useRef({ following: 0, followers: 0 });

  const networkFocusScope = JSON.stringify([location.key, lang, isAuth, user?.id ?? null, user?.role ?? null, profileView, settingsTab, followingPage, followersPage]);

  const currentNetworkFocusScope = useRef(networkFocusScope);

  currentNetworkFocusScope.current = networkFocusScope;

  const networkFocusOrigin = useRef<{ element: HTMLElement; scope: string } | null>(null);

  const pendingNetworkFocus = useRef<{ origin: HTMLElement | null; container?: HTMLElement | null; memberId?: string; action?: "more" | "follow"; target: "member" | "retry"; sectionId: "profile-following" | "profile-followers"; scope: string; request: number } | null>(null);

  const refreshNetwork = useCallback(() => {
    const captured = networkFocusOrigin.current;
    const origin = captured?.element;
    const sectionId = origin?.closest("section")?.id;
    const memberId = origin?.closest<HTMLElement>("[data-network-member-id]")?.dataset.networkMemberId;
    const action = origin?.dataset.networkAction;
    pendingNetworkFocus.current = captured?.scope === currentNetworkFocusScope.current && origin && memberId && (action === "more" || action === "follow") &&
      (sectionId === "profile-following" || sectionId === "profile-followers") && (document.activeElement === origin || document.activeElement === document.body)
      ? { origin, memberId, action, target: "member", sectionId, scope: currentNetworkFocusScope.current, request: networkRequests.current[sectionId === "profile-following" ? "following" : "followers"] + 1 } : null;
    setFollowingLoading(true);
    setFollowersLoading(true);
    setFollowingAttempt(value => value + 1);
    setFollowersAttempt(value => value + 1);
  }, []);

  const retryNetwork = (sectionId: "profile-following" | "profile-followers") => {
    const followingSection = sectionId === "profile-following";
    const origin = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    pendingNetworkFocus.current = {
      origin,
      container: origin?.closest<HTMLElement>("section"),
      target: "retry",
      sectionId,
      scope: currentNetworkFocusScope.current,
      request: networkRequests.current[followingSection ? "following" : "followers"] + 1,
    };
    if (followingSection) {
      setFollowingLoading(true);
      setFollowingError(false);
      setFollowingAttempt(value => value + 1);
    } else {
      setFollowersLoading(true);
      setFollowersError(false);
      setFollowersAttempt(value => value + 1);
    }
  };

  useLayoutEffect(() => {
    networkMounted.current = true;
    return () => {
      networkMounted.current = false;
      pendingNetworkFocus.current = null;
      networkFocusOrigin.current = null;
    };
  }, []);

  useLayoutEffect(() => {
    pendingNetworkFocus.current = null;
    networkFocusOrigin.current = null;
  }, [networkFocusScope]);

  useEffect(() => {
    const pending = pendingNetworkFocus.current;
    if (!pending) return;
    const followingSection = pending.sectionId === "profile-following";
    const request = networkRequests.current[followingSection ? "following" : "followers"];
    const settled = followingSection ? !followingLoading && (followingError || following !== null) : !followersLoading && (followersError || followers !== null);
    if (!settled || request !== pending.request) return;
    const frame = window.requestAnimationFrame(() => {
      if (!networkMounted.current || pendingNetworkFocus.current !== pending || pending.scope !== currentNetworkFocusScope.current) return;
      pendingNetworkFocus.current = null;
      if (networkRequests.current[followingSection ? "following" : "followers"] !== pending.request) return;
      if (document.activeElement !== document.body && document.activeElement !== pending.origin) return;
      const section = pending.target === "retry" ? pending.container : document.getElementById(pending.sectionId);
      if (pending.target === "retry") {
        const error = followingSection ? followingError : followersError;
        const mobileTitle = networkToolbarHeadingRef.current;
        const mobileBounds = mobileTitle?.getBoundingClientRect();
        const target = error
          ? section?.querySelector<HTMLButtonElement>("[data-retry-button]:not(:disabled)")
          : mobileBounds && mobileBounds.width > 1 && mobileBounds.height > 1 ? mobileTitle : section?.querySelector<HTMLElement>("h2");
        if (target && !target.hasAttribute("tabindex") && !target.matches("button, a, input, select, textarea")) target.tabIndex = -1;
        target?.focus();
        return;
      }
      const row = Array.from(section?.querySelectorAll<HTMLElement>("[data-network-member-id]") ?? []).find(item => item.dataset.networkMemberId === pending.memberId);
      const action = row?.querySelector<HTMLButtonElement>(`[data-network-action="${pending.action}"]:not(:disabled)`);
      const mobileTitle = networkToolbarHeadingRef.current;
      const mobileBounds = mobileTitle?.getBoundingClientRect();
      const target = action?.getClientRects().length ? action : mobileBounds && mobileBounds.width > 1 && mobileBounds.height > 1 ? mobileTitle : section?.querySelector<HTMLElement>("h2");
      if (target) {
        if (!target.hasAttribute("tabindex") && !target.matches("button, a, input, select, textarea")) target.tabIndex = -1;
        target.focus();
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, [following, followingError, followingLoading, followers, followersError, followersLoading, networkFocusScope]);

  useEffect(() => {
    if (!isAuth || !user?.id) return;
    let current = true;
    const request = ++networkRequests.current.following;
    const isCurrent = () => current && networkMounted.current && networkRequests.current.following === request;
    setFollowingLoading(true);
    setFollowingError(false);
    setFollowing(null);
    getFollowing(user.id, followingPage)
      .then(({ data }) => {
        if (!isCurrent()) return;
        if (isPageOutOfRange(followingPage, data.totalPages)) {
          setFollowingPage(getLastPageIndex(data.totalPages));
          return;
        }
        setFollowing(data);
      })
      .catch(() => { if (isCurrent()) setFollowingError(true); })
      .finally(() => { if (isCurrent()) setFollowingLoading(false); });
    return () => { current = false; };
  }, [isAuth, user?.id, followingPage, followingAttempt]);

  useEffect(() => {
    if (!isAuth || !user?.id) return;
    let current = true;
    const request = ++networkRequests.current.followers;
    const isCurrent = () => current && networkMounted.current && networkRequests.current.followers === request;
    setFollowers(null); setFollowersLoading(true); setFollowersError(false);
    getFollowers(user.id, followersPage).then(({ data }) => {
      if (!isCurrent()) return;
      if (isPageOutOfRange(followersPage, data.totalPages)) { setFollowersPage(getLastPageIndex(data.totalPages)); return; }
      setFollowers(data);
    }).catch(() => { if (isCurrent()) setFollowersError(true); })
      .finally(() => { if (isCurrent()) setFollowersLoading(false); });
    return () => { current = false; };
  }, [isAuth, user?.id, followersPage, followersAttempt]);

  useEffect(() => {
    setFollowingPage(0);
    setFollowersPage(0);
  }, [user?.id]);

  return {
    followingLoading,
    networkFocusOrigin,
    currentNetworkFocusScope,
    followersLoading,
    networkToolbarHeadingRef,
    following,
    followers,
    followingError,
    retryNetwork,
    followersError,
    refreshNetwork,
    followingPage,
    setFollowingPage,
    followersPage,
    setFollowersPage,
  };
}

export type ProfileNetworkModel = ReturnType<typeof useProfileNetwork>;
