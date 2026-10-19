import { useEffect, useState } from "react";
import { getAuditLogs, type AuditLog, type Page } from "../api/admin.api";
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
      .then(({ data: response }) => { if (current) setData(response); })
      .catch(() => { if (current) setError(true); })
      .finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [page, revision]);

  return <section className={styles.section} aria-label={t("auditLogs")} aria-busy={loading}>
    <h2 className={styles.title}>{t("auditLogs")}</h2>
    {loading && <p className={styles.feedback}>{t("loading")}</p>}
    {error && <div><p className={styles.error} role="alert">{t("adminLoadError")}</p><button type="button" onClick={() => setRevision(value => value + 1)}>{t("retry")}</button></div>}
    {data && data.content.length === 0 && <p>{t("noAuditLogs")}</p>}
    {data && <>
      <ul className={styles.list}>{data.content.map(log => <li className={styles.row} key={log.id}>{localizeAuditAction(log.action, lang)} · {localizeAuditTarget(log.targetType, lang)} #{log.targetId ?? "—"} · {formatDateTime(log.createdAt, lang)}</li>)}</ul>
      <nav className={styles.pagination} aria-label={t("adminAuditPagination")}>
        <button type="button" disabled={loading || page === 0} onClick={() => setPage(value => Math.max(0, value - 1))}>{t("previous")}</button>
        <span role="status">{t("page")} {data.totalPages === 0 ? 0 : page + 1} {t("of")} {data.totalPages} · {data.totalElements}</span>
        <button type="button" disabled={loading || page + 1 >= data.totalPages} onClick={() => setPage(value => value + 1)}>{t("next")}</button>
      </nav>
    </>}
  </section>;
}
