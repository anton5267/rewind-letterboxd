import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { getAdminUser, getAdminUserOverview, getAdminUsers, setAdminHq, setAdminUserActive, updateAdminUser, type AdminUser, type AdminUserOverview } from "../api/admin.api";
import type { Page } from "../api/types";
import { useAuth } from "../context/AuthContext";
import Pagination from "./Pagination";
import ResilientImage from "./ResilientImage";
import RetryNotice from "./RetryNotice";
import { formatDateTime, localizeAuditAction, localizeAuditTarget, localizeUserRole, useLocale } from "../i18n";
import { getUserHandle, getUserInitial, getUserName } from "../utils/userIdentity";
import styles from "./AdminShared.module.css";
import tableStyles from "./AdminUsers.module.css";

interface Props {
  onHqCountChange: (delta: number) => void;
  profileUserId?: number;
  onOpenUserProfile: (id: number) => void;
  onCloseUserProfile: () => void;
}

export default function AdminUsers({ onHqCountChange, profileUserId, onOpenUserProfile, onCloseUserProfile }: Props) {
  const { lang, path, t } = useLocale();
  const { user } = useAuth();
  const [data, setData] = useState<Page<AdminUser> | null>(null);
  const [draftQuery, setDraftQuery] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [revision, setRevision] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [actionError, setActionError] = useState<"adminSelfChangeError" | "adminLastAdminError" | "adminUserActionError" | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const selectedId = profileUserId ?? null;
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState(false);
  const [detailOverview, setDetailOverview] = useState<AdminUserOverview | null>(null);
  const [detailOverviewLoading, setDetailOverviewLoading] = useState(false);
  const [detailOverviewError, setDetailOverviewError] = useState(false);
  const [detailAttempt, setDetailAttempt] = useState(0);
  const [detailOverviewAttempt, setDetailOverviewAttempt] = useState(0);
  const detailRequest = useRef(0);
  const detailOverviewRequest = useRef(0);
  const detailHeading = useRef<HTMLHeadingElement>(null);
  const usersHeading = useRef<HTMLHeadingElement>(null);
  const detailTrigger = useRef<HTMLButtonElement | null>(null);
  const overviewHeading = useRef<HTMLHeadingElement>(null);
  const identityError = useRef<HTMLDivElement>(null);
  const overviewError = useRef<HTMLDivElement>(null);
  const catalogRequest = useRef(0);
  const scopeGeneration = useRef(0);
  const mounted = useRef(false);
  const retryFocus = useRef<{ kind: "catalog" | "identity" | "overview"; scope: number; request: number; origin: HTMLElement | null } | null>(null);
  const actor = `${user?.id ?? ""}:${user?.role ?? ""}`;
  const currentActor = useRef(actor);
  const currentSelectedId = useRef(selectedId);
  const mutationToken = useRef<object | null>(null);
  const actionAlert = useRef<HTMLParagraphElement>(null);
  const usersSection = useRef<HTMLElement>(null);
  const mutationFocus = useRef<{ scope: number; origin: HTMLElement; id: number; action: "role" | "hq" | "active"; error: boolean } | null>(null);
  const pageFocusCarry = useRef<{ page: number; query: string; lang: string; actor: string; focus: NonNullable<typeof retryFocus.current> } | null>(null);

  useLayoutEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      scopeGeneration.current += 1;
      retryFocus.current = null;
      mutationFocus.current = null;
      mutationToken.current = null;
    };
  }, []);

  useLayoutEffect(() => {
    scopeGeneration.current += 1;
    const carry = pageFocusCarry.current;
    retryFocus.current = carry && selectedId === null && carry.page === page && carry.query === query && carry.lang === lang && carry.actor === actor && retryFocus.current === carry.focus
      ? { ...carry.focus, scope: scopeGeneration.current } : null;
    pageFocusCarry.current = null;
    mutationFocus.current = null;
    setActionError(null);
    if (currentActor.current !== actor) { mutationToken.current = null; setBusyId(null); }
    currentActor.current = actor;
    currentSelectedId.current = selectedId;
  }, [selectedId, query, page, lang, user?.id, user?.role]);

  useEffect(() => {
    const pending = mutationFocus.current;
    if (!pending || busyId !== null || loading || detailLoading) return;
    const frame = window.requestAnimationFrame(() => {
      if (mutationFocus.current !== pending) return;
      mutationFocus.current = null;
      if (!mounted.current || scopeGeneration.current !== pending.scope) return;
      if (document.activeElement !== document.body && document.activeElement !== pending.origin) return;
      if (pending.error) actionAlert.current?.focus();
      else {
        const control = usersSection.current?.querySelector<HTMLButtonElement | HTMLSelectElement>(`[data-admin-user-id="${pending.id}"][data-admin-user-action="${pending.action}"]`);
        if (control && !control.disabled) control.focus();
        else (selectedId === null ? usersHeading.current : detailHeading.current)?.focus();
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, [busyId, loading, detailLoading, data, selectedUser, actionError, selectedId, lang, page, query]);

  useEffect(() => {
    const pending = retryFocus.current;
    if (!pending) return;
    const request = pending.kind === "catalog" ? catalogRequest.current : pending.kind === "identity" ? detailRequest.current : detailOverviewRequest.current;
    const busy = pending.kind === "catalog" ? loading : pending.kind === "identity" ? detailLoading : detailOverviewLoading;
    const settled = pending.kind === "catalog" ? error || data !== null : pending.kind === "identity" ? detailError || selectedUser !== null : detailOverviewError || detailOverview !== null;
    if (busy || !settled || request !== pending.request) return;
    const frame = window.requestAnimationFrame(() => {
      if (retryFocus.current !== pending) return;
      retryFocus.current = null;
      if (!mounted.current || scopeGeneration.current !== pending.scope) return;
      const latestRequest = pending.kind === "catalog" ? catalogRequest.current : pending.kind === "identity" ? detailRequest.current : detailOverviewRequest.current;
      if (latestRequest !== pending.request || (document.activeElement !== document.body && document.activeElement !== pending.origin)) return;
      const target = pending.kind === "catalog" ? usersHeading.current
        : pending.kind === "identity" ? detailError ? identityError.current : detailHeading.current
        : detailOverviewError ? overviewError.current : overviewHeading.current;
      target?.focus();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [loading, error, data, detailLoading, detailError, selectedUser, detailOverviewLoading, detailOverviewError, detailOverview, lang, selectedId, page, query]);

  const retry = (kind: "catalog" | "identity" | "overview") => {
    mutationFocus.current = null;
    const request = kind === "catalog" ? catalogRequest.current : kind === "identity" ? detailRequest.current : detailOverviewRequest.current;
    retryFocus.current = { kind, scope: scopeGeneration.current, request: request + 1, origin: document.activeElement instanceof HTMLElement ? document.activeElement : null };
    if (kind === "catalog") { setLoading(true); setRevision(value => value + 1); }
    else if (kind === "identity") { setDetailLoading(true); setDetailAttempt(value => value + 1); }
    else { setDetailOverviewLoading(true); setDetailOverviewAttempt(value => value + 1); }
  };

  useEffect(() => {
    if (selectedId !== null) {
      detailHeading.current?.focus();
      return;
    }
    const trigger = detailTrigger.current;
    if (trigger) {
      if (trigger.isConnected) trigger.focus();
      else usersHeading.current?.focus();
      detailTrigger.current = null;
    }
  }, [selectedId]);

  const explainActionError = (reason: unknown) => {
    const message = (reason as { response?: { data?: { message?: unknown } } })?.response?.data?.message;
    if (message === "Administrators cannot deactivate or demote their own account") return "adminSelfChangeError" as const;
    if (message === "At least one active administrator is required") return "adminLastAdminError" as const;
    return "adminUserActionError" as const;
  };

  useEffect(() => {
    const requestId = ++catalogRequest.current;
    const scope = scopeGeneration.current;
    if (profileUserId !== undefined) {
      setLoading(false);
      setError(false);
      setData(null);
      return;
    }
    let current = true;
    setLoading(true);
    setError(false);
    setActionError(null);
    setData(null);
    getAdminUsers(query, page)
      .then(({ data: response }) => {
        if (!current || scopeGeneration.current !== scope || catalogRequest.current !== requestId) return;
        const lastPage = Math.max(0, response.totalPages - 1);
        if (page > lastPage) {
          const focus = retryFocus.current;
          if (focus?.kind === "catalog" && focus.scope === scope) pageFocusCarry.current = { page: lastPage, query, lang, actor, focus: { ...focus, request: requestId + 1 } };
          if (pageFocusCarry.current) retryFocus.current = pageFocusCarry.current.focus;
          setPage(lastPage);
          return;
        }
        setData(response);
      })
      .catch(() => { if (current && scopeGeneration.current === scope && catalogRequest.current === requestId) setError(true); })
      .finally(() => { if (current && scopeGeneration.current === scope && catalogRequest.current === requestId) setLoading(false); });
    return () => { current = false; };
  }, [page, profileUserId, query, revision, lang, user?.id, user?.role]);

  useEffect(() => {
    const requestId = ++detailRequest.current;
    const scope = scopeGeneration.current;
    if (selectedId === null) {
      setSelectedUser(null);
      setDetailLoading(false);
      setDetailError(false);
      return;
    }

    let current = true;
    setDetailLoading(true);
    setDetailError(false);
    setSelectedUser(null);
    getAdminUser(selectedId)
      .then(({ data: response }) => {
        if (current && scopeGeneration.current === scope && requestId === detailRequest.current) setSelectedUser(response);
      })
      .catch(() => {
        if (current && scopeGeneration.current === scope && requestId === detailRequest.current) setDetailError(true);
      })
      .finally(() => {
        if (current && scopeGeneration.current === scope && requestId === detailRequest.current) setDetailLoading(false);
      });
    return () => { current = false; };
  }, [selectedId, detailAttempt, lang, user?.id, user?.role]);

  useEffect(() => {
    const requestId = ++detailOverviewRequest.current;
    const scope = scopeGeneration.current;
    if (selectedId === null) {
      setDetailOverview(null);
      setDetailOverviewLoading(false);
      setDetailOverviewError(false);
      return;
    }

    let current = true;
    setDetailOverview(null);
    setDetailOverviewLoading(true);
    setDetailOverviewError(false);
    getAdminUserOverview(selectedId)
      .then(({ data: response }) => {
        if (current && scopeGeneration.current === scope && requestId === detailOverviewRequest.current) setDetailOverview(response);
      })
      .catch(() => {
        if (current && scopeGeneration.current === scope && requestId === detailOverviewRequest.current) setDetailOverviewError(true);
      })
      .finally(() => {
        if (current && scopeGeneration.current === scope && requestId === detailOverviewRequest.current) setDetailOverviewLoading(false);
      });
    return () => { current = false; };
  }, [selectedId, detailOverviewAttempt, lang, user?.id, user?.role]);

  const search = (event: React.FormEvent) => {
    event.preventDefault();
    const nextQuery = draftQuery.trim();
    setPage(0);
    if (nextQuery === query) setRevision(value => value + 1);
    else setQuery(nextQuery);
  };

  const refreshCurrentView = () => {
    if (currentSelectedId.current === null) setRevision(value => value + 1);
    else {
      setDetailAttempt(value => value + 1);
      setDetailOverviewAttempt(value => value + 1);
    }
  };

  const mutateUser = async (target: AdminUser, action: "role" | "hq" | "active", origin: HTMLElement, role?: "USER" | "ADMIN") => {
    if (mutationToken.current !== null || (action === "role" && (!role || role === target.role))) return;
    const token = {};
    mutationToken.current = token;
    const scope = scopeGeneration.current;
    const sameActor = () => mounted.current && currentActor.current === actor && mutationToken.current === token;
    const sameScope = () => sameActor() && scopeGeneration.current === scope;
    retryFocus.current = null;
    mutationFocus.current = null;
    setActionError(null);
    setBusyId(target.id);
    try {
      let updated: AdminUser;
      if (action === "hq") updated = (await setAdminHq(target.id, !target.isHq)).data;
      else if (action === "role") updated = (await updateAdminUser(target.id, { role: role! })).data;
      else {
        await setAdminUserActive(target.id, !target.isActive);
        updated = { ...target, isActive: !target.isActive };
      }
      if (!sameActor()) return;
      if (action === "hq" && updated.isHq !== target.isHq) onHqCountChange(updated.isHq ? 1 : -1);
      if (!sameScope()) { refreshCurrentView(); return; }
      setData(current => current ? { ...current, content: current.content.map(item => item.id === updated.id ? updated : item) } : current);
      setSelectedUser(current => current?.id === updated.id ? updated : current);
      if (currentSelectedId.current === target.id) setDetailOverviewAttempt(value => value + 1);
      mutationFocus.current = { scope, origin, id: target.id, action, error: false };
    } catch (reason) {
      if (!sameActor()) return;
      if (!sameScope()) { refreshCurrentView(); return; }
      setActionError(explainActionError(reason));
      mutationFocus.current = { scope, origin, id: target.id, action, error: true };
    } finally {
      if (sameActor()) { mutationToken.current = null; setBusyId(null); }
    }
  };

  const selectUser = (target: AdminUser, trigger: HTMLButtonElement) => {
    detailTrigger.current = trigger;
    setActionError(null);
    setDetailAttempt(0);
    setDetailOverviewAttempt(0);
    onOpenUserProfile(target.id);
    if (selectedId === target.id) detailHeading.current?.focus();
  };

  const closeUserProfile = () => {
    onCloseUserProfile();
    setSelectedUser(null);
    setDetailOverview(null);
  };

  return <section ref={usersSection} className={`${styles.section} ${styles.usersSection} ${selectedId !== null ? styles.userProfileSection : ""}`} aria-label={t(profileUserId === undefined ? "adminUsers" : "adminUserProfile")} aria-busy={loading || detailLoading || detailOverviewLoading || busyId !== null}>
    <h2 ref={profileUserId === undefined ? usersHeading : undefined} className={styles.title} tabIndex={profileUserId === undefined ? -1 : undefined}>{t(profileUserId === undefined ? "adminUsers" : "adminUserProfile")}</h2>
    {actionError && <p ref={actionAlert} className={`${styles.error} ${styles.userRetryFocus}`} tabIndex={-1} role="alert">{t(actionError)}</p>}
    {profileUserId === undefined && <form className={styles.toolbar} onSubmit={search} aria-busy={loading}>
      <input className={styles.control} aria-label={t("userSearch")} placeholder={t("userSearch")} value={draftQuery} onChange={event => setDraftQuery(event.target.value)} />
      <button type="submit">{t("search")}</button>
    </form>}
    {selectedId !== null && <><section className={styles.detailPanel} id="admin-user-profile" aria-labelledby="admin-user-profile-title" aria-busy={detailLoading || busyId === selectedId}>
      <div className={styles.detailHeader}>
        <div>
          <p className={styles.detailEyebrow}>{t("adminUserProfile")}</p>
          <h3 ref={detailHeading} className={`${styles.detailTitle} ${styles.userRetryFocus}`} id="admin-user-profile-title" tabIndex={-1}>{selectedUser ? getUserName(selectedUser, t("someone")) : t(detailLoading ? "loading" : "adminUserProfile")}</h3>
        </div>
        <button type="button" onClick={closeUserProfile}>{t("close")}</button>
      </div>
      {detailLoading && <p className={styles.feedback} role="status">{t("loading")}</p>}
      {detailError && <div ref={identityError} className={styles.userRetryFocus} tabIndex={-1}><RetryNotice className={styles.error} message={t("loadAdminUserError")} retryLabel={t("retry")} disabled={detailLoading} busy={detailLoading} onRetry={() => retry("identity")} /></div>}
      {selectedUser && <>
        <div className={styles.detailIdentity}>
          <ResilientImage className={styles.detailAvatar} src={selectedUser.avatarUrl} alt="" width={72} height={72} fallback={<span className={styles.detailAvatarFallback} aria-hidden="true">{getUserInitial(selectedUser)}</span>} />
          <div className={styles.detailIdentityCopy}>
            <strong>{getUserName(selectedUser, t("someone"))}</strong>
            <span>{getUserHandle(selectedUser, t("someone"))}</span>
          </div>
        </div>
        <dl className={styles.detailGrid}>
          <div><dt>{t("email")}</dt><dd>{selectedUser.email}</dd></div>
          <div><dt>{t("userRole")}</dt><dd>{localizeUserRole(selectedUser.role, t)}</dd></div>
          <div><dt>{t("userStatus")}</dt><dd>{selectedUser.isActive ? t("activeUser") : t("blockedUser")}</dd></div>
          <div><dt>{t("userHqStatus")}</dt><dd>{selectedUser.isHq ? t("hqMember") : t("notHqMember")}</dd></div>
          <div><dt>{t("userCreatedAt")}</dt><dd>{selectedUser.createdAt ? formatDateTime(selectedUser.createdAt, lang) : "—"}</dd></div>
        </dl>
        <div className={styles.detailActions}>
          <select className={`${styles.control} ${styles.userRetryFocus}`} data-admin-user-id={selectedUser.id} data-admin-user-action="role" aria-label={`${t("userRole")}: ${getUserName(selectedUser, t("someone"))}`} value={selectedUser.role} disabled={busyId !== null} onChange={event => void mutateUser(selectedUser, "role", event.currentTarget, event.target.value as "USER" | "ADMIN")}>
            <option value="USER">{localizeUserRole("USER", t)}</option>
            <option value="ADMIN">{localizeUserRole("ADMIN", t)}</option>
          </select>
          <button className={styles.userRetryFocus} data-admin-user-id={selectedUser.id} data-admin-user-action="hq" type="button" disabled={busyId !== null} aria-busy={busyId === selectedUser.id} onClick={event => void mutateUser(selectedUser, "hq", event.currentTarget)}>{busyId === selectedUser.id ? t("loading") : selectedUser.isHq ? t("revokeHq") : t("grantHq")}</button>
          <Link to={path(`/users/${selectedUser.id}`)}>{t("viewPublicProfile")}</Link>
          <Link to={`${path("/messages")}?user=${selectedUser.id}`}>{t("openConversation")}</Link>
          <button className={styles.userRetryFocus} data-admin-user-id={selectedUser.id} data-admin-user-action="active" type="button" disabled={busyId !== null} aria-busy={busyId === selectedUser.id} onClick={event => void mutateUser(selectedUser, "active", event.currentTarget)}>{busyId === selectedUser.id ? t("loading") : selectedUser.isActive ? t("blockUser") : t("activateUser")}</button>
        </div>
      </>}
    </section>
      {detailOverviewLoading && <p className={styles.feedback} role="status">{t("loading")}</p>}
      {detailOverviewError && <div ref={overviewError} className={styles.userRetryFocus} tabIndex={-1}><RetryNotice className={styles.error} message={t("loadAdminUserOverviewError")} retryLabel={t("retry")} disabled={detailOverviewLoading} busy={detailOverviewLoading} onRetry={() => retry("overview")} /></div>}
      {detailOverview && <div className={styles.detailOverviewGrid}>
        <section className={styles.detailSubsection} aria-labelledby="admin-user-history">
          <h4 id="admin-user-history" ref={overviewHeading} className={styles.userRetryFocus} tabIndex={-1}>{t("adminActionHistory")}</h4>
          {detailOverview.adminHistory.length === 0 ? <p className={styles.feedback}>{t("noAdminHistory")}</p> : <ul className={styles.detailList}>
            {detailOverview.adminHistory.map(item => <li key={item.id}>
              <div className={styles.detailListHeading}><span>{localizeAuditAction(item.action, lang)}</span><time dateTime={item.createdAt}>{formatDateTime(item.createdAt, lang)}</time></div>
              <p className={styles.detailListText}>{localizeAuditTarget(item.targetType, lang)} #{item.targetId ?? "—"}</p>
            </li>)}
          </ul>}
        </section>
        <section className={styles.detailSubsection} aria-labelledby="admin-user-stats">
          <h4 id="admin-user-stats">{t("adminUserStats")}</h4>
          <div className={styles.detailStats}>
            <div className={styles.detailStat}><strong>{detailOverview.stats.watched}</strong><span>{t("adminWatchedMovies")}</span></div>
            <div className={styles.detailStat}><strong>{detailOverview.stats.reviews}</strong><span>{t("adminUserReviewsCount")}</span></div>
            <div className={styles.detailStat}><strong>{detailOverview.stats.likesReceived} / {detailOverview.stats.comments}</strong><span>{t("adminUserLikesComments")}</span></div>
            <div className={styles.detailStat}><strong>{detailOverview.stats.customLists}</strong><span>{t("adminUserListsCount")}</span></div>
          </div>
        </section>
      </div>}
    </>}
    {profileUserId === undefined && loading && <p className={styles.feedback} role="status">{t("loading")}</p>}
    {profileUserId === undefined && error && <RetryNotice className={styles.error} message={t("adminLoadError")} retryLabel={t("retry")} disabled={loading} busy={loading} onRetry={() => retry("catalog")} />}
    {profileUserId === undefined && data && data.content.length === 0 && <p>{t("noAdminUsers")}</p>}
    {profileUserId === undefined && data && <>
      <div className={tableStyles.tableRail}>
      <table className={tableStyles.table}>
        <caption className={tableStyles.caption}>{t("adminUsers")}</caption>
        <thead><tr>
          <th scope="col">{t("adminUserNameColumn")}</th>
          <th scope="col">{t("email")}</th>
          <th scope="col">{t("adminUserRoleColumn")}</th>
          <th scope="col">{t("userStatus")}</th>
          <th scope="col">{t("adminUserActionsColumn")}</th>
        </tr></thead>
        <tbody>{data.content.map(target => <tr key={target.id}>
        <td>
          <span className={tableStyles.cellLabel} aria-hidden="true">{t("adminUserNameColumn")}</span>
          <strong className={styles.userName}>{getUserName(target, t("someone"))}</strong>
        </td>
        <td>
          <span className={tableStyles.cellLabel} aria-hidden="true">{t("email")}</span>
          <span>{target.email}</span>
        </td>
        <td>
          <span className={tableStyles.cellLabel} aria-hidden="true">{t("adminUserRoleColumn")}</span>
          <select className={`${styles.control} ${styles.userRetryFocus}`} data-admin-user-id={target.id} data-admin-user-action="role" aria-label={`${t("userRole")}: ${getUserName(target, t("someone"))}`} value={target.role} disabled={busyId !== null} onChange={event => void mutateUser(target, "role", event.currentTarget, event.target.value as "USER" | "ADMIN")}>
            <option value="USER">{t("adminUserRoleOption")}</option>
            <option value="ADMIN">{t("adminAdministratorRoleOption")}</option>
          </select>
        </td>
        <td>
          <span className={tableStyles.cellLabel} aria-hidden="true">{t("userStatus")}</span>
          <span>{target.isActive ? t("activeUser") : t("blockedUser")}</span>
        </td>
        <td>
          <span className={tableStyles.cellLabel} aria-hidden="true">{t("adminUserActionsColumn")}</span>
          <div className={`${styles.rowActions} ${tableStyles.actions}`}>
          <button type="button" onClick={event => selectUser(target, event.currentTarget)}>{t("viewUserProfile")}</button>
          <button className={styles.userRetryFocus} data-admin-user-id={target.id} data-admin-user-action="hq" type="button" aria-busy={busyId === target.id} disabled={busyId !== null} onClick={event => void mutateUser(target, "hq", event.currentTarget)}>{busyId === target.id ? t("loading") : target.isHq ? t("revokeHq") : t("grantHq")}</button>
          <button className={styles.userRetryFocus} data-admin-user-id={target.id} data-admin-user-action="active" type="button" aria-busy={busyId === target.id} disabled={busyId !== null} onClick={event => void mutateUser(target, "active", event.currentTarget)}>{busyId === target.id ? t("loading") : target.isActive ? t("blockUser") : t("activateUser")}</button>
        </div>
        </td>
      </tr>)}</tbody>
      </table>
      </div>
      <Pagination className={styles.pagination} page={page} totalPages={data.totalPages} label={t("adminUsersPagination")} busy={loading} statusSuffix={data.totalElements} onPageChange={nextPage => {
        if (nextPage === page) return;
        mutationFocus.current = null;
        const focus = { kind: "catalog" as const, scope: scopeGeneration.current, request: catalogRequest.current + 1, origin: document.activeElement instanceof HTMLElement ? document.activeElement : null };
        retryFocus.current = focus;
        pageFocusCarry.current = { page: nextPage, query, lang, actor, focus };
        setLoading(true);
        setPage(nextPage);
      }} />
    </>}
  </section>;
}
