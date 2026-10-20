import { useId } from "react";
import { Link } from "react-router-dom";
import type { CommunityUser } from "../api/social.api";
import { useFollowAction } from "../context/FollowActionsContext";
import { useLocale } from "../i18n";
import { getUserHandle, getUserIdentity, getUserInitial } from "../utils/userIdentity";
import ResilientImage from "./ResilientImage";
import styles from "./UserFollowRow.module.css";

export default function UserFollowRow({ user, href, meta, subtitle, label }: { user: CommunityUser; href: string; meta?: string; subtitle?: string; label?: string }) {
  const { t, path } = useLocale();
  const { actorId, authReady, state, retry, toggle } = useFollowAction(user.id);
  const feedbackId = useId();
  const identity = getUserIdentity(user, "?");
  const guest = authReady && actorId === null;
  const self = actorId === user.id;
  const loading = !authReady || state.phase === "loading" || state.busy;
  const actionLabel = `${t(state.phase === "error" ? "retry" : loading ? "loading" : state.blocked ? "interactionBlocked" : state.following ? "unfollow" : "follow")}: ${identity}`;

  return <li className={styles.row}>
    <Link className={styles.userLink} to={href} aria-label={label ?? `${identity} ${getUserHandle(user)}`}>
      <ResilientImage className={styles.avatar} src={user.avatarUrl} alt="" width={44} height={44}
        fallback={<span className={styles.avatarFallback} aria-hidden="true">{getUserInitial(user)}</span>} />
      <span className={styles.userCopy}>
        <strong>{identity}</strong>
        <span>{subtitle ?? getUserHandle(user)}</span>
        {meta && <span>{meta}</span>}
      </span>
    </Link>
    {!self && (guest ? <Link className={styles.action} to={path("/login")} aria-label={`${t("follow")}: ${identity}`} title={`${t("follow")}: ${identity}`}><span className={styles.glyph} aria-hidden="true">＋</span></Link> :
      <button className={styles.action} type="button" aria-label={actionLabel} title={actionLabel}
        aria-pressed={state.phase === "ready" ? state.following : undefined} aria-busy={loading}
        aria-describedby={state.phase === "error" || state.blocked ? feedbackId : undefined}
        disabled={loading || (state.blocked && state.phase !== "error")} onClick={state.phase === "error" ? retry : toggle}>
        <span className={styles.glyph} aria-hidden="true">{state.phase === "error" ? "↻" : loading ? "…" : state.blocked ? "×" : state.following ? "✓" : "＋"}</span>
      </button>)}
    {!self && !guest && state.phase === "error" && <p className={styles.error} id={feedbackId} role="alert">{t(state.error === "action" ? "followError" : "loadFollowStatusError")}</p>}
    {!self && !guest && state.phase === "ready" && state.blocked && <p className={styles.feedback} id={feedbackId}>{t("interactionBlocked")}</p>}
  </li>;
}
