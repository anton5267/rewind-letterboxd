import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { follow, getBlockStatus, getFollowStatus, unfollow } from "../api/social.api";
import { useAuth } from "./AuthContext";

type FollowState = {
  phase: "loading" | "ready" | "error";
  following: boolean;
  blocked: boolean;
  followersCount: number | null;
  followingCount: number | null;
  busy: boolean;
  error: "followStatus" | "blockStatus" | "action" | null;
};

interface FollowActions {
  actorId: number | null;
  authReady: boolean;
  states: Record<number, FollowState>;
  load: (targetId: number, retry?: boolean) => void;
  toggle: (targetId: number) => void;
}

const initialState: FollowState = { phase: "loading", following: false, blocked: false, followersCount: null, followingCount: null, busy: false, error: null };
const FollowActionsContext = createContext<FollowActions | null>(null);

class RelationshipStatusError extends Error {
  constructor(readonly kind: "followStatus" | "blockStatus") {
    super(kind);
  }
}

async function readRelationship(targetId: number) {
  // Follow actions are safe only when both relationship statuses are known.
  // Let either request fail so the row exposes its retry state instead of
  // treating an unavailable status as false and incorrectly enabling actions.
  const [followResult, blockResult] = await Promise.allSettled([
    getFollowStatus(targetId),
    getBlockStatus(targetId),
  ]);
  if (followResult.status === "rejected") throw new RelationshipStatusError("followStatus");
  if (blockResult.status === "rejected") throw new RelationshipStatusError("blockStatus");
  const followResponse = followResult.value;
  const blockResponse = blockResult.value;
  const followStatus = followResponse.data;
  return {
    following: followStatus.following,
    followersCount: followStatus.followers,
    followingCount: followStatus.followingCount,
    blocked: blockResponse.data.blocked,
  };
}

/** Page-scoped state deduplicates the same member across Community sections. */
function FollowActionsState({ actorId, authReady, children }: { actorId: number | null; authReady: boolean; children: ReactNode }) {
  const [states, setStates] = useState<Record<number, FollowState>>({});
  const stateRef = useRef(states);
  const requests = useRef<Record<number, number>>({});
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  const update = useCallback((targetId: number, state: FollowState) => {
    if (!mounted.current) return;
    const next = { ...stateRef.current, [targetId]: state };
    stateRef.current = next;
    setStates(next);
  }, []);

  const load = useCallback(async (targetId: number, retry = false) => {
    if (actorId === null || actorId === targetId || !Number.isSafeInteger(targetId) || targetId <= 0) return;
    const previous = stateRef.current[targetId];
    if (previous?.busy || (previous && (!retry || previous.phase === "loading"))) return;
    const requestId = (requests.current[targetId] ?? 0) + 1;
    requests.current[targetId] = requestId;
    update(targetId, { ...(previous ?? initialState), phase: "loading", error: null, busy: false });
    try {
      const relationship = await readRelationship(targetId);
      if (mounted.current && requests.current[targetId] === requestId) {
        update(targetId, { ...relationship, phase: "ready", busy: false, error: null });
      }
    } catch (error) {
      if (mounted.current && requests.current[targetId] === requestId) {
        const statusError = error instanceof RelationshipStatusError ? error.kind : "followStatus";
        update(targetId, { ...(previous ?? initialState), phase: "error", busy: false, error: statusError });
      }
    }
  }, [actorId, update]);

  const toggle = useCallback(async (targetId: number) => {
    const previous = stateRef.current[targetId];
    if (actorId === null || actorId === targetId || previous?.phase !== "ready" || previous.busy || previous.blocked) return;
    // Write the lock synchronously so duplicate rows cannot start a second mutation.
    const requestId = (requests.current[targetId] ?? 0) + 1;
    requests.current[targetId] = requestId;
    update(targetId, { ...previous, busy: true, error: null });
    let mutationCompleted = false;
    try {
      if (previous.following) await unfollow(targetId); else await follow(targetId);
      if (!mounted.current || requests.current[targetId] !== requestId) return;
      mutationCompleted = true;
      const relationship = await readRelationship(targetId);
      if (mounted.current && requests.current[targetId] === requestId) {
        update(targetId, { ...relationship, phase: "ready", busy: false, error: null });
      }
    } catch (error) {
      if (mounted.current && requests.current[targetId] === requestId) {
        const statusError = error instanceof RelationshipStatusError ? error.kind : "followStatus";
        update(targetId, {
          ...previous, phase: "error", busy: false,
          following: mutationCompleted ? !previous.following : previous.following,
          error: mutationCompleted ? statusError : "action",
        });
      }
    }
  }, [actorId, update]);

  return <FollowActionsContext.Provider value={{ actorId, authReady, states, load, toggle }}>{children}</FollowActionsContext.Provider>;
}

export function FollowActionsProvider({ children }: { children: ReactNode }) {
  const { ready, isAuth, user } = useAuth();
  const actorId = ready && isAuth && user ? user.id : null;
  // A different actor must never see cached relationships or delayed mutations.
  return <FollowActionsState key={actorId ?? "guest"} actorId={actorId} authReady={ready}>{children}</FollowActionsState>;
}

export function useFollowAction(targetId: number) {
  const context = useContext(FollowActionsContext);
  if (!context) throw new Error("useFollowAction requires FollowActionsProvider");
  const { load } = context;
  useEffect(() => { load(targetId); }, [load, targetId]);
  return {
    actorId: context.actorId,
    authReady: context.authReady,
    state: context.states[targetId] ?? initialState,
    retry: () => context.load(targetId, true),
    toggle: () => context.toggle(targetId),
  };
}
