import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { getAuditLogs, type AuditLog } from "../api/admin.api";
import type { Page } from "../api/types";
import { useAuth } from "../context/AuthContext";
import Pagination from "./Pagination";
import RetryNotice from "./RetryNotice";
import { formatDateTime, localizeAuditAction, localizeAuditTarget, useLocale } from "../i18n";
import styles from "./AdminShared.module.css";

export default function AdminAuditLogs() {
  const { lang, t } = useLocale();
  const { user } = useAuth();
  const [data, setData] = useState<Page<AuditLog> | null>(null);
  const [page, setPage] = useState(0);
  const [revision, setRevision] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const pendingFocus = useRef<{ origin: HTMLElement | null; generation: number } | null>(null);
  const generation = useRef(0);
  const actor = `${user?.id ?? ""}:${user?.role ?? ""}`;
  const currentActor = useRef(actor);

  useLayoutEffect(() => {
    generation.current += 1;
    if (currentActor.current !== actor) {
      currentActor.current = actor;
      pendingFocus.current = null;
      setData(null);
      setLoading(true);
      setError(false);
    } else if (pendingFocus.current) {
      pendingFocus.current = { ...pendingFocus.current, generation: generation.current };
    }
  }, [page, lang, actor]);

  useEffect(() => {
    const pending = pendingFocus.current;
    if (!pending || loading || (!error && data === null)) return;
    const frame = window.requestAnimationFrame(() => {
      if (pendingFocus.current !== pending) return;
      pendingFocus.current = null;
      if (generation.current !== pending.generation) return;
      const active = document.activeElement;
      if (active !== document.body && active !== pending.origin) return;
      heading.current?.focus();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [loading, error, data, page, lang, actor]);

  useEffect(() => {
    let current = true;
    const requestGeneration = generation.current;
    setLoading(true);
    setError(false);
    setData(null);
    getAuditLogs(page)
      .then(({ data: response }) => {
        if (!current || generation.current !== requestGeneration || currentActor.current !== actor) return;
        const lastPage = Math.max(0, response.totalPages - 1);
        if (page > lastPage) {
          setPage(lastPage);
          return;
        }
        setData(response);
      })
      .catch(() => { if (current && generation.current === requestGeneration && currentActor.current === actor) setError(true); })
      .finally(() => { if (current && generation.current === requestGeneration && currentActor.current === actor) setLoading(false); });
    return () => { current = false; };
  }, [page, revision, actor]);

  return <section className={`${styles.section} ${styles.auditSection}`} aria-label={t("auditLogs")} aria-busy={loading}>
    <h2 className={styles.title} ref={heading} tabIndex={-1}>{t("auditLogs")}</h2>
    {loading && <p className={styles.feedback} role="status">{t("loading")}</p>}
    {error && <RetryNotice className={styles.error} message={t("adminLoadError")} retryLabel={t("retry")} disabled={loading} busy={loading} onRetry={() => {
      pendingFocus.current = { origin: document.activeElement instanceof HTMLElement ? document.activeElement : null, generation: generation.current };
      setRevision(value => value + 1);
    }} />}
    {data && data.content.length === 0 && <p>{t("noAuditLogs")}</p>}
    {data && <>
      <ul className={styles.list}>{data.content.map(log => <li className={`${styles.row} ${styles.auditRow}`} key={log.id}>
        <div className={styles.auditMain}>
          <strong>{t("adminActorId")} #{log.adminId}</strong>
          <p>{localizeAuditTarget(log.targetType, lang)} #{log.targetId ?? "—"}</p>
        </div>
        <div className={styles.auditSide}>
          <span className={styles.auditAction}>{localizeAuditAction(log.action, lang)}</span>
          <time dateTime={log.createdAt}>{formatDateTime(log.createdAt, lang)}</time>
        </div>
      </li>)}</ul>
      <Pagination className={styles.pagination} page={page} totalPages={data.totalPages} label={t("adminAuditPagination")} busy={loading} statusSuffix={data.totalElements} onPageChange={nextPage => {
        if (nextPage === page) return;
        pendingFocus.current = { origin: document.activeElement instanceof HTMLElement ? document.activeElement : null, generation: generation.current };
        setPage(nextPage);
      }} />
    </>}
  </section>;
}
