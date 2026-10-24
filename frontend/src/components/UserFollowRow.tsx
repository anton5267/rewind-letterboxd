import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { blockUser, getBlockStatus, unblockUser, type CommunityUser } from "../api/social.api";
import { useFollowAction } from "../context/FollowActionsContext";
import { useDialogFocusTrap } from "../hooks/useDialogFocusTrap";
import { useLocale } from "../i18n";
import { getUserHandle, getUserIdentity, getUserInitial } from "../utils/userIdentity";
import ResilientImage from "./ResilientImage";
import watchedIcon from "../assets/figma/reviewer-watched.png";
import listsIcon from "../assets/figma/reviewer-lists.png";
import likesIcon from "../assets/figma/reviewer-likes.png";
import styles from "./UserFollowRow.module.css";

type ReviewerMetrics = { watched: number; lists: number; likes: number };

export default function UserFollowRow({ user, href, meta, subtitle, label, reviewerMetrics, presentation, onFollowSettled }: { user: CommunityUser; href: string; meta?: string; subtitle?: string; label?: string; reviewerMetrics?: ReviewerMetrics; presentation?: "communityShowcase" | "profileNetwork"; onFollowSettled?: () => void }) {
  const { t, path } = useLocale();
  const { actorId, authReady, state, retry, toggle } = useFollowAction(user.id);
  const [memberSheetOpen, setMemberSheetOpen] = useState(false);
  const [blockStatus, setBlockStatus] = useState<boolean | null>(null);
  const [blockStatusLoading, setBlockStatusLoading] = useState(false);
  const [blockStatusError, setBlockStatusError] = useState(false);
  const [blockStatusAttempt, setBlockStatusAttempt] = useState(0);
  const [blockBusy, setBlockBusy] = useState(false);
  const [blockActionError, setBlockActionError] = useState(false);
  const doneButtonRef = useRef<HTMLButtonElement>(null);
  const blockRequestId = useRef(0);
  const actorIdRef = useRef(actorId);
  actorIdRef.current = actorId;
  const openedByActor = useRef<number | null>(null);
  const closeMemberSheet = useCallback(() => setMemberSheetOpen(false), []);
  const refreshNetworkAfterClose = useCallback(() => {
    window.requestAnimationFrame(() => onFollowSettled?.());
  }, [onFollowSettled]);
  const sheetRef = useDialogFocusTrap<HTMLElement>(memberSheetOpen, closeMemberSheet, { initialFocusRef: doneButtonRef });
  const wasBusy = useRef(false);
  const sheetFollowRequested = useRef(false);
  useEffect(() => {
    if (wasBusy.current && !state.busy) {
      if (sheetFollowRequested.current && state.phase === "ready") {
        closeMemberSheet();
        refreshNetworkAfterClose();
      } else if (!sheetFollowRequested.current) {
        onFollowSettled?.();
      }
      sheetFollowRequested.current = false;
    }
    wasBusy.current = state.busy;
  }, [closeMemberSheet, onFollowSettled, refreshNetworkAfterClose, state.busy, state.phase]);
  useEffect(() => {
    if (!memberSheetOpen || !authReady || actorId === null || actorId === user.id) return;
    let current = true;
    const requestId = ++blockRequestId.current;
    setBlockStatus(null);
    setBlockStatusLoading(true);
    setBlockStatusError(false);
    setBlockActionError(false);
    getBlockStatus(user.id).then(({ data }) => {
      if (current && actorIdRef.current === actorId && blockRequestId.current === requestId) setBlockStatus(data.blocked);
    }).catch(() => {
      if (current && actorIdRef.current === actorId && blockRequestId.current === requestId) setBlockStatusError(true);
    }).finally(() => {
      if (current && actorIdRef.current === actorId && blockRequestId.current === requestId) setBlockStatusLoading(false);
    });
    return () => { current = false; };
  }, [actorId, authReady, blockStatusAttempt, memberSheetOpen, user.id]);
  useEffect(() => {
    if (memberSheetOpen && (!authReady || actorId === null || actorId === user.id || openedByActor.current !== actorId)) closeMemberSheet();
  }, [actorId, authReady, closeMemberSheet, memberSheetOpen, user.id]);
  const feedbackId = useId();
  const identity = getUserIdentity(user, "?");
  const hasNetworkCounts = state.followersCount !== null && state.followingCount !== null;
  const networkSubtitle = hasNetworkCounts ? t(state.followersCount === 1 ? "networkStatsOne" : "networkStats").replace("{followers}", String(state.followersCount)).replace("{following}", String(state.followingCount)) : null;
  const secondaryText = subtitle ?? (presentation === "profileNetwork" ? networkSubtitle : getUserHandle(user));
  const guest = authReady && actorId === null;
  const self = actorId === user.id;
  const loading = !authReady || state.phase === "loading" || state.busy;
  const actionLabel = `${t(state.phase === "error" ? "retry" : loading ? "loading" : state.blocked ? "interactionBlocked" : state.following ? "unfollow" : "follow")}: ${identity}`;
  const openMemberSheet = () => {
    if (!authReady || actorId === null || actorId === user.id || state.busy) return;
    openedByActor.current = actorId;
    setMemberSheetOpen(true);
  };
  const changeSheetFollow = () => {
    if (state.phase !== "ready" || state.busy || state.blocked) return;
    sheetFollowRequested.current = true;
    toggle();
  };
  const retrySheetFollow = () => {
    if (state.error === "action") sheetFollowRequested.current = true;
    retry();
  };
  const changeSheetBlock = async () => {
    if (actorId === null || actorId === user.id || blockStatus === null || blockBusy) return;
    const actor = actorId;
    const requestId = ++blockRequestId.current;
    setBlockBusy(true);
    setBlockActionError(false);
    try {
      const { data } = blockStatus ? await unblockUser(user.id) : await blockUser(user.id);
      if (actorIdRef.current !== actor || blockRequestId.current !== requestId) return;
      setBlockStatus(data.blocked);
      retry();
      closeMemberSheet();
      refreshNetworkAfterClose();
    } catch {
      if (actorIdRef.current === actor && blockRequestId.current === requestId) setBlockActionError(true);
    } finally {
      if (actorIdRef.current === actor && blockRequestId.current === requestId) setBlockBusy(false);
    }
  };

  return <li className={`${styles.row} ${reviewerMetrics ? styles.reviewerRow : ""} ${presentation ? styles[presentation] : ""}`}>
    <Link className={styles.userLink} to={href} aria-label={label ?? `${identity} ${getUserHandle(user)}`}>
      <ResilientImage className={styles.avatar} src={user.avatarUrl} alt="" width={44} height={44}
        fallback={<span className={styles.avatarFallback} aria-hidden="true">{getUserInitial(user)}</span>} />
      <span className={styles.userCopy}>
        <strong>{identity}</strong>
        {secondaryText && <span>{secondaryText}</span>}
        {meta && <span>{meta}</span>}
      </span>
    </Link>
    {reviewerMetrics && <div className={styles.metrics} role="group" aria-label={t("reviewerMetrics")}>
      {([
        [watchedIcon, t("watched"), reviewerMetrics.watched],
        [listsIcon, t("searchLists"), reviewerMetrics.lists],
        [likesIcon, t("likes"), reviewerMetrics.likes],
      ] as const).map(([icon, metricLabel, value]) => <span className={styles.metric} title={`${metricLabel}: ${value}`} key={metricLabel}>
        <img src={icon} alt="" width="35" height="35" /><span className={styles.metricValue}>{value}</span><span className={styles.metricLabel}>{metricLabel}</span>
      </span>)}
    </div>}
    {presentation === "profileNetwork" && authReady && actorId !== null && !self && <button className={`${styles.action} ${styles.moreAction}`} type="button" aria-label={`${t("moreActions")}: ${identity}`} aria-haspopup="dialog" aria-expanded={memberSheetOpen} onClick={openMemberSheet}><span className={styles.glyph} aria-hidden="true">•••</span></button>}
    {!self && (guest ? <Link className={styles.action} to={path("/login")} aria-label={`${t("follow")}: ${identity}`} title={`${t("follow")}: ${identity}`}><span className={styles.glyph} aria-hidden="true">＋</span></Link> :
      <button className={styles.action} type="button" aria-label={actionLabel} title={actionLabel}
        aria-pressed={state.phase === "ready" ? state.following : undefined} aria-busy={loading}
        aria-describedby={state.phase === "error" || state.blocked ? feedbackId : undefined}
        disabled={loading || (state.blocked && state.phase !== "error")} onClick={state.phase === "error" ? retry : toggle}>
        <span className={styles.glyph} aria-hidden="true">{state.phase === "error" ? "↻" : loading ? "…" : state.blocked ? "×" : state.following ? "✓" : "＋"}</span>
      </button>)}
    {!self && !guest && state.phase === "error" && <p className={styles.error} id={feedbackId} role="alert">{t(state.error === "action" ? "followError" : "loadFollowStatusError")}</p>}
    {!self && !guest && state.phase === "ready" && state.blocked && <p className={styles.feedback} id={feedbackId}>{t("interactionBlocked")}</p>}
    {presentation === "profileNetwork" && authReady && actorId !== null && state.countsError && <p className={styles.error} role="alert">{t("loadNetworkError")} <button type="button" className={styles.action} aria-label={`${t("retry")}: ${identity}`} onClick={retry}>↻</button></p>}
    {memberSheetOpen && <div className={styles.memberBackdrop} role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) closeMemberSheet(); }}>
      <section className={styles.memberSheet} ref={sheetRef} role="dialog" aria-modal="true" aria-labelledby={`${feedbackId}-member-title`} aria-busy={blockStatusLoading || blockBusy}>
        <header className={styles.memberHeading}>
          <h2 id={`${feedbackId}-member-title`}>{identity}</h2>
          <p>{getUserHandle(user)}</p>
        </header>
        <div className={styles.memberActions}>
          <button type="button" disabled={state.phase !== "ready" || state.busy || state.blocked} aria-busy={state.busy} onClick={changeSheetFollow}>{state.busy ? t("loading") : state.following ? t("unfollow") : t("follow")}</button>
          <button type="button" className={styles.memberBlock} disabled={blockStatusLoading || blockStatusError || blockBusy || state.busy || blockStatus === null} aria-busy={blockBusy} onClick={() => void changeSheetBlock()}>{blockBusy ? t("loading") : blockStatus ? t("unblockUser") : t("blockProfileUser")}</button>
          <Link to={href} onClick={closeMemberSheet}>{t("goToMember")}</Link>
        </div>
        {state.phase === "loading" && <p className={styles.memberMessage} role="status">{t("loading")}</p>}
        {state.phase === "error" && <p className={styles.memberError} role="alert">{t(state.error === "action" ? "followError" : "loadFollowStatusError")} <button type="button" onClick={retrySheetFollow}>{t("retry")}</button></p>}
        {blockStatusLoading && <p className={styles.memberMessage} role="status">{t("loading")}</p>}
        {blockStatusError && <p className={styles.memberError} role="alert">{t("loadBlockStatusError")} <button type="button" onClick={() => setBlockStatusAttempt(value => value + 1)}>{t("retry")}</button></p>}
        {blockActionError && <p className={styles.memberError} role="alert">{t("blockError")}</p>}
        <button className={styles.memberDone} type="button" ref={doneButtonRef} onClick={closeMemberSheet}>{t("done")}</button>
      </section>
    </div>}
  </li>;
}
