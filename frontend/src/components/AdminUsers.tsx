import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { getAdminUser, getAdminUserOverview, getAdminUsers, setAdminHq, setAdminUserActive, updateAdminUser, type AdminUser, type AdminUserOverview } from "../api/admin.api";
import type { Page } from "../api/types";
import Pagination from "./Pagination";
import ResilientImage from "./ResilientImage";
import RetryNotice from "./RetryNotice";
import { formatDateTime, localizeAuditAction, localizeAuditTarget, localizeUserRole, useLocale } from "../i18n";
import { getUserHandle, getUserInitial, getUserName } from "../utils/userIdentity";
import styles from "./AdminShared.module.css";

interface Props {
  onHqCountChange: (delta: number) => void;
}

export default function AdminUsers({ onHqCountChange }: Props) {
  const { lang, path, t } = useLocale();
  const [data, setData] = useState<Page<AdminUser> | null>(null);
  const [draftQuery, setDraftQuery] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [revision, setRevision] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
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
    if (message === "Administrators cannot deactivate or demote their own account") return t("adminSelfChangeError");
    if (message === "At least one active administrator is required") return t("adminLastAdminError");
    return t("adminUserActionError");
  };

  useEffect(() => {
    let current = true;
    setLoading(true);
    setError(false);
    setActionError(null);
    setData(null);
    getAdminUsers(query, page)
      .then(({ data: response }) => {
        if (!current) return;
        const lastPage = Math.max(0, response.totalPages - 1);
        if (page > lastPage) {
          setPage(lastPage);
          return;
        }
        setData(response);
      })
      .catch(() => { if (current) setError(true); })
      .finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [page, query, revision]);

  useEffect(() => {
    const requestId = ++detailRequest.current;
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
        if (current && requestId === detailRequest.current) setSelectedUser(response);
      })
      .catch(() => {
        if (current && requestId === detailRequest.current) setDetailError(true);
      })
      .finally(() => {
        if (current && requestId === detailRequest.current) setDetailLoading(false);
      });
    return () => { current = false; };
  }, [selectedId, detailAttempt]);

  useEffect(() => {
    const requestId = ++detailOverviewRequest.current;
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
        if (current && requestId === detailOverviewRequest.current) setDetailOverview(response);
      })
      .catch(() => {
        if (current && requestId === detailOverviewRequest.current) setDetailOverviewError(true);
      })
      .finally(() => {
        if (current && requestId === detailOverviewRequest.current) setDetailOverviewLoading(false);
      });
    return () => { current = false; };
  }, [selectedId, detailOverviewAttempt]);

  const search = (event: React.FormEvent) => {
    event.preventDefault();
    const nextQuery = draftQuery.trim();
    setPage(0);
    if (nextQuery === query) setRevision(value => value + 1);
    else setQuery(nextQuery);
  };

  const toggleHq = async (target: AdminUser) => {
    if (busyId !== null) return;
    setBusyId(target.id);
    try {
      const { data: updated } = await setAdminHq(target.id, !target.isHq);
      setData(current => current ? { ...current, content: current.content.map(item => item.id === updated.id ? updated : item) } : current);
      setSelectedUser(current => current?.id === updated.id ? updated : current);
      onHqCountChange(updated.isHq ? 1 : -1);
      setActionError(null);
    } catch (reason) {
      setActionError(explainActionError(reason));
    } finally {
      setBusyId(null);
    }
  };

  const toggleActive = async (target: AdminUser) => {
    if (busyId !== null) return;
    setBusyId(target.id);
    try {
      await setAdminUserActive(target.id, !target.isActive);
      setData(current => current ? { ...current, content: current.content.map(item => item.id === target.id ? { ...item, isActive: !target.isActive } : item) } : current);
      setSelectedUser(current => current?.id === target.id ? { ...current, isActive: !target.isActive } : current);
      setActionError(null);
    } catch (reason) {
      setActionError(explainActionError(reason));
    } finally {
      setBusyId(null);
    }
  };

  const updateRole = async (target: AdminUser, role: "USER" | "ADMIN") => {
    if (busyId !== null || role === target.role) return;
    setBusyId(target.id);
    try {
      const { data: updated } = await updateAdminUser(target.id, { role });
      setData(current => current ? { ...current, content: current.content.map(item => item.id === updated.id ? updated : item) } : current);
      setSelectedUser(current => current?.id === updated.id ? updated : current);
      setActionError(null);
    } catch (reason) {
      setActionError(explainActionError(reason));
    } finally {
      setBusyId(null);
    }
  };

  const selectUser = (target: AdminUser, trigger: HTMLButtonElement) => {
    detailTrigger.current = trigger;
    setActionError(null);
    setDetailAttempt(0);
    setDetailOverviewAttempt(0);
    setSelectedId(target.id);
    if (selectedId === target.id) detailHeading.current?.focus();
  };

  const closeUserProfile = () => {
    setSelectedId(null);
    setSelectedUser(null);
    setDetailOverview(null);
  };

  return <section className={`${styles.section} ${styles.usersSection}`} aria-label={t("adminUsers")} aria-busy={loading || busyId !== null}>
    <h2 ref={usersHeading} className={styles.title} tabIndex={-1}>{t("adminUsers")}</h2>
    {actionError && <p className={styles.error} role="alert">{actionError}</p>}
    <form className={styles.toolbar} onSubmit={search} aria-busy={loading}>
      <input className={styles.control} aria-label={t("userSearch")} placeholder={t("userSearch")} value={draftQuery} onChange={event => setDraftQuery(event.target.value)} />
      <button type="submit">{t("search")}</button>
    </form>
    {selectedId !== null && <section className={styles.detailPanel} id="admin-user-profile" aria-labelledby="admin-user-profile-title" aria-busy={detailLoading || detailOverviewLoading || busyId === selectedId}>
      <div className={styles.detailHeader}>
        <div>
          <p className={styles.detailEyebrow}>{t("adminUserProfile")}</p>
          <h3 ref={detailHeading} className={styles.detailTitle} id="admin-user-profile-title" tabIndex={-1}>{selectedUser ? getUserName(selectedUser, t("someone")) : t("loading")}</h3>
        </div>
        <button type="button" onClick={closeUserProfile}>{t("close")}</button>
      </div>
      {detailLoading && <p className={styles.feedback} role="status">{t("loading")}</p>}
      {detailError && <RetryNotice className={styles.error} message={t("loadAdminUserError")} retryLabel={t("retry")} disabled={detailLoading} busy={detailLoading} onRetry={() => setDetailAttempt(value => value + 1)} />}
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
          <select className={styles.control} aria-label={`${t("userRole")}: ${getUserName(selectedUser, t("someone"))}`} value={selectedUser.role} disabled={busyId !== null} onChange={event => void updateRole(selectedUser, event.target.value as "USER" | "ADMIN")}>
            <option value="USER">{localizeUserRole("USER", t)}</option>
            <option value="ADMIN">{localizeUserRole("ADMIN", t)}</option>
          </select>
          <button type="button" disabled={busyId !== null} aria-busy={busyId === selectedUser.id} onClick={() => void toggleHq(selectedUser)}>{busyId === selectedUser.id ? t("loading") : selectedUser.isHq ? t("revokeHq") : t("grantHq")}</button>
          <Link to={path(`/users/${selectedUser.id}`)}>{t("viewPublicProfile")}</Link>
          <Link to={`${path("/messages")}?user=${selectedUser.id}`}>{t("openConversation")}</Link>
          <button type="button" disabled={busyId !== null} aria-busy={busyId === selectedUser.id} onClick={() => void toggleActive(selectedUser)}>{busyId === selectedUser.id ? t("loading") : selectedUser.isActive ? t("blockUser") : t("activateUser")}</button>
        </div>
      </>}
      {detailOverviewLoading && <p className={styles.feedback} role="status">{t("loading")}</p>}
      {detailOverviewError && <RetryNotice className={styles.error} message={t("loadAdminUserOverviewError")} retryLabel={t("retry")} disabled={detailOverviewLoading} busy={detailOverviewLoading} onRetry={() => setDetailOverviewAttempt(value => value + 1)} />}
      {detailOverview && <div className={styles.detailOverviewGrid}>
        <section className={styles.detailSubsection} aria-labelledby="admin-user-history">
          <h4 id="admin-user-history">{t("adminActionHistory")}</h4>
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
    </section>}
    {loading && <p className={styles.feedback} role="status">{t("loading")}</p>}
    {error && <RetryNotice className={styles.error} message={t("adminLoadError")} retryLabel={t("retry")} disabled={loading} busy={loading} onRetry={() => setRevision(value => value + 1)} />}
    {data && data.content.length === 0 && <p>{t("noAdminUsers")}</p>}
    {data && <>
      <ul className={styles.list}>{data.content.map(target => <li className={styles.row} key={target.id}>
        <div className={styles.userSummary}>
          <strong className={styles.userName}>{getUserName(target, t("someone"))}</strong>
          <span className={styles.userMeta}>{localizeUserRole(target.role, t)} · {target.isActive ? t("activeUser") : t("blockedUser")}</span>
        </div>
        <div className={styles.rowActions}>
          <select className={styles.control} aria-label={`${t("userRole")}: ${getUserName(target, t("someone"))}`} value={target.role} disabled={busyId !== null} onChange={event => void updateRole(target, event.target.value as "USER" | "ADMIN")}>
            <option value="USER">{localizeUserRole("USER", t)}</option>
            <option value="ADMIN">{localizeUserRole("ADMIN", t)}</option>
          </select>
          <button type="button" aria-expanded={selectedId === target.id} aria-controls={selectedId === target.id ? "admin-user-profile" : undefined} onClick={event => selectUser(target, event.currentTarget)}>{t("viewUserProfile")}</button>
          <button type="button" aria-busy={busyId === target.id} disabled={busyId !== null} onClick={() => void toggleHq(target)}>{busyId === target.id ? t("loading") : target.isHq ? t("revokeHq") : t("grantHq")}</button>
          <button type="button" aria-busy={busyId === target.id} disabled={busyId !== null} onClick={() => void toggleActive(target)}>{busyId === target.id ? t("loading") : target.isActive ? t("blockUser") : t("activateUser")}</button>
        </div>
      </li>)}</ul>
      <Pagination className={styles.pagination} page={page} totalPages={data.totalPages} label={t("adminUsersPagination")} busy={loading} statusSuffix={data.totalElements} onPageChange={setPage} />
    </>}
  </section>;
}
