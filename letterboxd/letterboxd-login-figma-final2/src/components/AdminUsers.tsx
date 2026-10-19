import { useEffect, useState } from "react";
import { getAdminUsers, setAdminHq, setAdminUserActive, updateAdminUser, type AdminUser, type Page } from "../api/admin.api";
import { localizeUserRole, useLocale } from "../i18n";
import styles from "./AdminShared.module.css";

interface Props {
  onHqCountChange: (delta: number) => void;
}

export default function AdminUsers({ onHqCountChange }: Props) {
  const { t } = useLocale();
  const [data, setData] = useState<Page<AdminUser> | null>(null);
  const [draftQuery, setDraftQuery] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [revision, setRevision] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

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
      .then(({ data: response }) => { if (current) setData(response); })
      .catch(() => { if (current) setError(true); })
      .finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [page, query, revision]);

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
      setActionError(null);
    } catch (reason) {
      setActionError(explainActionError(reason));
    } finally {
      setBusyId(null);
    }
  };

  return <section className={styles.section} aria-label={t("adminUsers")} aria-busy={loading || busyId !== null}>
    <h2 className={styles.title}>{t("adminUsers")}</h2>
    {actionError && <p className={styles.error} role="alert">{actionError}</p>}
    <form className={styles.toolbar} onSubmit={search} aria-busy={loading}>
      <input className={styles.control} aria-label={t("userSearch")} placeholder={t("userSearch")} value={draftQuery} onChange={event => setDraftQuery(event.target.value)} />
      <button type="submit">{t("search")}</button>
    </form>
    {loading && <p className={styles.feedback}>{t("loading")}</p>}
    {error && <div><p className={styles.error} role="alert">{actionError || t("adminLoadError")}</p><button type="button" onClick={() => setRevision(value => value + 1)}>{t("retry")}</button></div>}
    {data && data.content.length === 0 && <p>{t("noAdminUsers")}</p>}
    {data && <>
      <ul className={styles.list}>{data.content.map(target => <li className={styles.row} key={target.id}>
        <div className={styles.userSummary}>
          <strong className={styles.userName}>{target.displayName || target.username}</strong>
          <span className={styles.userMeta}>{localizeUserRole(target.role, t)} · {target.isActive ? t("activeUser") : t("blockedUser")}</span>
        </div>
        <div className={styles.rowActions}>
          <select className={styles.control} aria-label={`${t("userRole")}: ${target.username}`} value={target.role} disabled={busyId !== null} onChange={event => void updateRole(target, event.target.value as "USER" | "ADMIN")}>
            <option value="USER">{localizeUserRole("USER", t)}</option>
            <option value="ADMIN">{localizeUserRole("ADMIN", t)}</option>
          </select>
          <button type="button" aria-busy={busyId === target.id} disabled={busyId !== null} onClick={() => void toggleHq(target)}>{busyId === target.id ? t("loading") : target.isHq ? t("revokeHq") : t("grantHq")}</button>
          <button type="button" aria-busy={busyId === target.id} disabled={busyId !== null} onClick={() => void toggleActive(target)}>{busyId === target.id ? t("loading") : target.isActive ? t("blockUser") : t("activateUser")}</button>
        </div>
      </li>)}</ul>
      <nav className={styles.pagination} aria-label={t("adminUsersPagination")}>
        <button type="button" disabled={loading || page === 0} onClick={() => setPage(value => Math.max(0, value - 1))}>{t("previous")}</button>
        <span role="status">{t("page")} {data.totalPages === 0 ? 0 : page + 1} {t("of")} {data.totalPages} · {data.totalElements}</span>
        <button type="button" disabled={loading || page + 1 >= data.totalPages} onClick={() => setPage(value => value + 1)}>{t("next")}</button>
      </nav>
    </>}
  </section>;
}
