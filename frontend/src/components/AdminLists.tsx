import { useEffect, useState } from "react";
import { deleteAdminList, getAdminLists, setAdminListVisibility, type AdminList } from "../api/admin.api";
import type { Page } from "../api/types";
import Pagination from "./Pagination";
import RetryNotice from "./RetryNotice";
import { editorialText, useLocale } from "../i18n";
import { getUserName } from "../utils/userIdentity";
import styles from "./AdminShared.module.css";

export default function AdminLists() {
  const { t } = useLocale();
  const [data, setData] = useState<Page<AdminList> | null>(null);
  const [page, setPage] = useState(0);
  const [revision, setRevision] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [actionError, setActionError] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);

  useEffect(() => {
    let current = true;
    setLoading(true);
    setError(false);
    setData(null);
    getAdminLists(page)
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
  }, [page, revision]);

  const toggleVisibility = async (list: AdminList) => {
    if (busyId !== null) return;
    setBusyId(list.id);
    setActionError("");
    try {
      const { data: updated } = await setAdminListVisibility(list.id, !list.isPublic);
      setData(current => current ? { ...current, content: current.content.map(item => item.id === updated.id ? updated : item) } : current);
    } catch {
      setActionError(t("adminListVisibilityError"));
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (list: AdminList) => {
    if (list.listType !== "CUSTOM" || busyId !== null || !window.confirm(t("deleteListConfirm"))) return;
    setBusyId(list.id);
    setActionError("");
    try {
      await deleteAdminList(list.id);
      if (data?.content.length === 1 && page > 0) setPage(value => value - 1);
      else setRevision(value => value + 1);
    } catch {
      setActionError(t("adminListDeleteError"));
    } finally {
      setBusyId(null);
    }
  };

  return <section className={styles.section} aria-label={t("adminLists")} aria-busy={loading || busyId !== null}>
    <h2 className={styles.title}>{t("adminLists")}</h2>
    {actionError && <p className={styles.error} role="alert">{actionError}</p>}
    {loading && <p className={styles.feedback} role="status">{t("loading")}</p>}
    {error && <RetryNotice className={styles.error} message={t("adminLoadError")} retryLabel={t("retry")} disabled={loading} busy={loading} onRetry={() => setRevision(value => value + 1)} />}
    {data && data.content.length === 0 && <p>{t("noAdminLists")}</p>}
    {data && <>
      <ul className={styles.list}>{data.content.map(list => <li className={styles.row} key={list.id}>
        <div className={styles.rowContent}>{editorialText(list.name, t("lists"))} · {getUserName({ username: list.username }, t("someone"))} · {list.itemCount} {t("items")} · {list.isPublic ? t("publicList") : t("hiddenList")}</div>
        <div className={styles.rowActions}>
          <button type="button" aria-busy={busyId === list.id} disabled={busyId !== null} onClick={() => void toggleVisibility(list)}>{busyId === list.id ? t("loading") : list.isPublic ? t("hideList") : t("publishList")}</button>
          {list.listType === "CUSTOM" && <button type="button" aria-busy={busyId === list.id} disabled={busyId !== null} onClick={() => void remove(list)}>{busyId === list.id ? t("loading") : t("deleteList")}</button>}
        </div>
      </li>)}</ul>
      <Pagination className={styles.pagination} page={page} totalPages={data.totalPages} label={t("adminListsPagination")} busy={loading} statusSuffix={data.totalElements} onPageChange={setPage} />
    </>}
  </section>;
}
