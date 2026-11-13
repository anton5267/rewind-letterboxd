import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { type PublicProfileResponse } from "../../api/profile.api";
import { blockUser, follow, getBlockStatus, getFollowStatus, type BlockStatus, type FollowStatus, unblockUser, unfollow } from "../../api/social.api";
import { useAuth } from "../../context/AuthContext";
import { useLocale } from "../../i18n";

export function usePublicRelationships(profileId: number, profile: PublicProfileResponse | null, onNetworkChange: () => void) {
  const { lang, t } = useLocale();
  const { isAuth, user } = useAuth();
  const location = useLocation();
  const validProfileId = Number.isSafeInteger(profileId) && profileId > 0;

  const [followStatus, setFollowStatus] = useState<FollowStatus | null>(null);

  const [followStatusLoading, setFollowStatusLoading] = useState(false);

  const [followStatusError, setFollowStatusError] = useState(false);

  const [followStatusAttempt, setFollowStatusAttempt] = useState(0);

  const relationshipStatusRequests = useRef({ follow: 0, block: 0 });

  const relationshipStatusScope = JSON.stringify([location.key, lang, isAuth, user?.id ?? null, profileId, validProfileId]);

  const currentRelationshipStatusScope = useRef(relationshipStatusScope);

  currentRelationshipStatusScope.current = relationshipStatusScope;

  const pendingRelationshipStatusFocus = useRef<Partial<Record<"follow" | "block", { origin: HTMLElement | null; scope: string; request: number }>>>({});

  useLayoutEffect(() => {
    if (pendingRelationshipStatusFocus.current.follow?.scope !== relationshipStatusScope) delete pendingRelationshipStatusFocus.current.follow;
    if (pendingRelationshipStatusFocus.current.block?.scope !== relationshipStatusScope) delete pendingRelationshipStatusFocus.current.block;
  }, [relationshipStatusScope]);

  const [followBusy, setFollowBusy] = useState(false);

  const [followError, setFollowError] = useState(false);

  const [blockStatus, setBlockStatus] = useState<BlockStatus | null>(null);

  const [blockStatusLoading, setBlockStatusLoading] = useState(false);

  const [blockStatusError, setBlockStatusError] = useState(false);

  const [blockStatusAttempt, setBlockStatusAttempt] = useState(0);

  const [blockBusy, setBlockBusy] = useState(false);

  const [blockError, setBlockError] = useState(false);

  const pendingRelationshipMutationFocus = useRef<{ target: "follow" | "block"; origin: HTMLElement | null; scope: string } | null>(null);

  const currentProfileId = useRef(profileId);

  const currentActorId = useRef<number | null>(null);

  const relationshipMutation = useRef(0);

  currentProfileId.current = profileId;

  currentActorId.current = isAuth ? user?.id ?? null : null;

  useEffect(() => {
    if (!validProfileId || profile?.id !== profileId || !isAuth || user?.id === profileId) {
      setFollowStatus(null);
      setFollowStatusLoading(false);
      setFollowStatusError(false);
      setBlockStatus(null);
      return;
    }
    let current = true;
    const request = ++relationshipStatusRequests.current.follow;
    const isCurrentRequest = () => current && relationshipStatusRequests.current.follow === request;
    setFollowStatus(null);
    setFollowStatusLoading(true);
    setFollowStatusError(false);
    getFollowStatus(profileId).then(({ data }) => { if (isCurrentRequest()) setFollowStatus(data); })
      .catch(() => { if (isCurrentRequest()) { setFollowStatus(null); setFollowStatusError(true); } })
      .finally(() => { if (isCurrentRequest()) setFollowStatusLoading(false); });
    return () => { current = false; };
  }, [followStatusAttempt, isAuth, profile?.id, profileId, user?.id, validProfileId]);

  useEffect(() => {
    if (!validProfileId || profile?.id !== profileId || !isAuth || user?.id === profileId) {
      setBlockStatus(null);
      setBlockStatusLoading(false);
      setBlockStatusError(false);
      return;
    }
    let current = true;
    const request = ++relationshipStatusRequests.current.block;
    const isCurrentRequest = () => current && relationshipStatusRequests.current.block === request;
    setBlockStatus(null);
    setBlockStatusLoading(true);
    setBlockStatusError(false);
    getBlockStatus(profileId).then(({ data }) => { if (isCurrentRequest()) setBlockStatus(data); })
      .catch(() => { if (isCurrentRequest()) { setBlockStatus(null); setBlockStatusError(true); } })
      .finally(() => { if (isCurrentRequest()) setBlockStatusLoading(false); });
    return () => { current = false; };
  }, [blockStatusAttempt, isAuth, profile?.id, profileId, user?.id, validProfileId]);

  useEffect(() => {
    for (const target of ["follow", "block"] as const) {
      const pending = pendingRelationshipStatusFocus.current[target];
      const loading = target === "follow" ? followStatusLoading : blockStatusLoading;
      const error = target === "follow" ? followStatusError : blockStatusError;
      if (!pending || pending.scope !== currentRelationshipStatusScope.current || pending.request !== relationshipStatusRequests.current[target] || loading) continue;
      const frame = window.requestAnimationFrame(() => {
        if (pendingRelationshipStatusFocus.current[target] !== pending) return;
        delete pendingRelationshipStatusFocus.current[target];
        if (pending.scope !== currentRelationshipStatusScope.current || pending.request !== relationshipStatusRequests.current[target]) return;
        const active = document.activeElement;
        if (active !== document.body && active !== pending.origin) return;
        if (error) {
          const message = t(target === "follow" ? "loadFollowStatusError" : "loadBlockStatusError");
          [...document.querySelectorAll<HTMLElement>("[role=alert]")].find(alert => alert.textContent?.includes(message))?.querySelector<HTMLButtonElement>("[data-retry-button]:not(:disabled)")?.focus();
        } else {
          document.querySelector<HTMLButtonElement>(`[data-relationship-action="${target}"]:not(:disabled)`)?.focus();
        }
      });
      return () => window.cancelAnimationFrame(frame);
    }
  }, [followStatusLoading, followStatusError, followStatus, followStatusAttempt, blockStatusLoading, blockStatusError, blockStatus, blockStatusAttempt, t, location.key, lang, isAuth, profileId, validProfileId, user?.id]);

  const retryRelationshipStatus = (target: "follow" | "block") => {
    pendingRelationshipStatusFocus.current[target] = { origin: document.activeElement instanceof HTMLElement ? document.activeElement : null, scope: currentRelationshipStatusScope.current, request: relationshipStatusRequests.current[target] + 1 };
    if (target === "follow") {
      setFollowStatusLoading(true);
      setFollowStatusError(false);
      setFollowStatusAttempt(value => value + 1);
    } else {
      setBlockStatusLoading(true);
      setBlockStatusError(false);
      setBlockStatusAttempt(value => value + 1);
    }
  };

  useEffect(() => {
    relationshipMutation.current += 1;
    pendingRelationshipMutationFocus.current = null;
    setFollowBusy(false);
    setBlockBusy(false);
    setFollowError(false);
    setBlockError(false);
  }, [profileId, isAuth, user?.id]);

  useEffect(() => {
    if (pendingRelationshipMutationFocus.current?.scope !== relationshipStatusScope) pendingRelationshipMutationFocus.current = null;
  }, [relationshipStatusScope]);

  useEffect(() => {
    const pending = pendingRelationshipMutationFocus.current;
    if (!pending || followBusy || blockBusy) return;
    const frame = window.requestAnimationFrame(() => {
      if (pendingRelationshipMutationFocus.current !== pending) return;
      pendingRelationshipMutationFocus.current = null;
      if (pending.scope !== relationshipStatusScope) return;
      const active = document.activeElement;
      if (active !== document.body && active !== pending.origin) return;
      const failed = pending.target === "follow" ? followError : blockError;
      if (failed) {
        const message = t(pending.target === "follow" ? "followError" : "blockError");
        [...document.querySelectorAll<HTMLElement>("[role=alert]")].find(alert => alert.textContent?.includes(message))?.querySelector<HTMLButtonElement>("[data-retry-button]:not(:disabled)")?.focus();
      } else {
        document.querySelector<HTMLButtonElement>(`[data-relationship-action="${pending.target}"]:not(:disabled)`)?.focus();
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, [followBusy, blockBusy, followError, blockError, relationshipStatusScope, t]);

  const changeFollow = async () => {
    if (!isAuth || !user?.id || !validProfileId || !followStatus || blockStatus?.blocked || followBusy || blockBusy) return;
    pendingRelationshipMutationFocus.current = { target: "follow", origin: document.activeElement instanceof HTMLElement ? document.activeElement : null, scope: relationshipStatusScope };
    const requestId = ++relationshipMutation.current;
    const requestActorId = user.id;
    setFollowBusy(true);
    setFollowError(false);
    setFollowStatusError(false);
    const nextFollowing = !followStatus.following;
    const isCurrentRequest = () => relationshipMutation.current === requestId && currentProfileId.current === profileId && currentActorId.current === requestActorId;
    try {
      if (followStatus.following) await unfollow(profileId); else await follow(profileId);
      if (!isCurrentRequest()) return;
      setFollowStatus(status => status ? { ...status, following: nextFollowing } : status);
      onNetworkChange();
      try {
        const { data: status } = await getFollowStatus(profileId);
        if (!isCurrentRequest()) return;
        setFollowStatus(status);
        setFollowStatusError(false);
      } catch {
        if (isCurrentRequest()) setFollowStatusError(true);
      }
    } catch {
      if (isCurrentRequest()) setFollowError(true);
    } finally {
      if (isCurrentRequest()) setFollowBusy(false);
    }
  };

  const changeBlock = async () => {
    if (!isAuth || !user?.id || !validProfileId || !blockStatus || blockBusy || followBusy) return;
    pendingRelationshipMutationFocus.current = { target: "block", origin: document.activeElement instanceof HTMLElement ? document.activeElement : null, scope: relationshipStatusScope };
    const requestId = ++relationshipMutation.current;
    const requestActorId = user.id;
    setBlockBusy(true);
    setBlockError(false);
    const isCurrentRequest = () => relationshipMutation.current === requestId && currentProfileId.current === profileId && currentActorId.current === requestActorId;
    try {
      const { data } = blockStatus.blocked ? await unblockUser(profileId) : await blockUser(profileId);
      if (!isCurrentRequest()) return;
      setBlockStatus(data);
      if (data.blocked) setFollowStatus(status => status ? { ...status, following: false } : status);
      onNetworkChange();
    } catch {
      if (isCurrentRequest()) setBlockError(true);
    } finally {
      if (isCurrentRequest()) setBlockBusy(false);
    }
  };

  const refreshFollowStatus = useCallback(() => { setFollowStatusAttempt(value => value + 1); }, []);

  return {
    followStatus, followStatusLoading, followStatusError, followBusy, followError,
    blockStatus, blockStatusLoading, blockStatusError, blockBusy, blockError,
    retryRelationshipStatus, changeFollow, changeBlock, refreshFollowStatus,
  };
}
