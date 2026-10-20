import { useEffect, useState } from "react";
import { getAuditLogs, type AuditLog } from "../api/admin.api";
import type { Page } from "../api/types";
import Pagination from "./Pagination";
import RetryNotice from "./RetryNotice";
import { formatDateTime, localizeAuditAction, localizeAuditTarget, useLocale } from "../i18n";
import styles from "./AdminShared.module.css";

export default function AdminAuditLogs() {
  const { lang, t } = useLocale();
  const [data, setData] = useState<Page<AuditLog> | null>(null);
  const [page, setPage] = useState(0);
  const [revision, setRevision] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let current = true;
    setLoading(true);
    setError(false);
    setData(null);
    getAuditLogs(page)
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

  return <section className={styles.section} aria-label={t("auditLogs")} aria-busy={loading}>
    <h2 className={styles.title}>{t("auditLogs")}</h2>
    {loading && <p className={styles.feedback} role="status">{t("loading")}</p>}
    {error && <RetryNotice className={styles.error} message={t("adminLoadError")} retryLabel={t("retry")} disabled={loading} busy={loading} onRetry={() => setRevision(value => value + 1)} />}
    {data && data.content.length === 0 && <p>{t("noAuditLogs")}</p>}
    {data && <>
      <ul className={styles.list}>{data.content.map(log => <li className={styles.row} key={log.id}>{localizeAuditAction(log.action, lang)} · {localizeAuditTarget(log.targetType, lang)} #{log.targetId ?? "—"} · {formatDateTime(log.createdAt, lang)}</li>)}</ul>
      <Pagination className={styles.pagination} page={page} totalPages={data.totalPages} label={t("adminAuditPagination")} busy={loading} statusSuffix={data.totalElements} onPageChange={setPage} />
    </>}
  </section>;
}
