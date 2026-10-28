import AdminLoading from "./AdminLoading";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { isAxiosError } from "axios";
import { useSearchParams } from "react-router-dom";
import { getAdminUser, getAuditLogs, type AdminUser, type AuditLog } from "../api/admin.api";
import type { Page } from "../api/types";
import { useAuth } from "../context/AuthContext";
import Pagination from "./Pagination";
import RetryNotice from "./RetryNotice";
import { formatDateTime, localizeAuditAction, localizeAuditTarget, localizeUserRole, useLocale } from "../i18n";
import { getUserName } from "../utils/userIdentity";
import styles from "./AdminShared.module.css";

export default function AdminAuditLogs({ onOpenUserProfile }: { onOpenUserProfile: (adminId: number, logId: number) => void }) {
  const { lang, t } = useLocale();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [data, setData] = useState<Page<AuditLog> | null>(null);
  const [actors, setActors] = useState<Record<number, AdminUser | null>>({});
  const [actorsLoading, setActorsLoading] = useState(false);
  const [actorRetryIds, setActorRetryIds] = useState<number[]>([]);
  const [page, setPage] = useState(0);
  const [revision, setRevision] = useState(0);
  const [actorRevision, setActorRevision] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const pendingFocus = useRef<{ origin: HTMLElement | null; generation: number } | null>(null);
  const generation = useRef(0);
  const actorGeneration = useRef(0);
  const actorCache = useRef(new Map<number, AdminUser | null>());
  const actorRequests = useRef(new Map<number, symbol>());
  const actor = `${user?.id ?? ""}:${user?.role ?? ""}`;
  const currentActor = useRef(actor);

  useLayoutEffect(() => {
    generation.current += 1;
    if (currentActor.current !== actor) {
      currentActor.current = actor;
      pendingFocus.current = null;
      actorGeneration.current += 1;
      actorCache.current.clear();
      actorRequests.current.clear();
      setActors({});
      setActorsLoading(false);
      setActorRetryIds([]);
      setData(null);
      setLoading(true);
      setError(false);
    } else if (pendingFocus.current) {
      pendingFocus.current = { ...pendingFocus.current, generation: generation.current };
    }
  }, [page, lang, actor]);

  useEffect(() => {
    if (!data) return;
    const ids = [...new Set(data.content.map(log => log.adminId))]
      .filter(id => !actorCache.current.has(id) && !actorRequests.current.has(id));
    if (ids.length === 0) return;
    const scope = actorGeneration.current;
    let current = true;
    const requestToken = Symbol("audit-actors");
    ids.forEach(id => actorRequests.current.set(id, requestToken));
    setActorsLoading(true);
    Promise.all(ids.map(async id => {
      try {
        const { data: actorData } = await getAdminUser(id);
        return { id, actorData, retryable: false };
      } catch (cause) {
        const status = isAxiosError(cause) ? cause.response?.status : undefined;
        const retryable = status === undefined || status === 408 || status === 429 || status >= 500;
        return { id, actorData: null, retryable };
      }
    })).then(entries => {
      if (!current || actorGeneration.current !== scope || currentActor.current !== actor) return;
      const additions: Record<number, AdminUser | null> = {};
      const retryableIds: number[] = [];
      entries.forEach(({ id, actorData, retryable }) => {
        if (retryable) retryableIds.push(id);
        else actorCache.current.set(id, actorData);
        additions[id] = actorData;
      });
      setActors(existing => ({ ...existing, ...additions }));
      setActorRetryIds(existing => [...new Set([...existing, ...retryableIds])]);
    }).finally(() => {
      ids.forEach(id => {
        if (actorRequests.current.get(id) === requestToken) actorRequests.current.delete(id);
      });
      if (current && actorGeneration.current === scope) setActorsLoading(false);
    });
    return () => {
      current = false;
      ids.forEach(id => {
        if (actorRequests.current.get(id) === requestToken) actorRequests.current.delete(id);
      });
      if (actorGeneration.current === scope) setActorsLoading(false);
    };
  }, [data, actor, actorRevision]);

  const focusLogId = searchParams.get("focusLog");
  useEffect(() => {
    if (!focusLogId || loading || actorsLoading || !data) return;
    const parsedId = /^\d+$/.test(focusLogId) ? Number(focusLogId) : NaN;
    if (!Number.isSafeInteger(parsedId) || parsedId <= 0) return;
    const frame = window.requestAnimationFrame(() => {
      const target = document.querySelector<HTMLButtonElement>(`[data-admin-log-profile="${parsedId}"]`);
      (target ?? heading.current)?.focus();
      const next = new URLSearchParams(searchParams);
      next.delete("focusLog");
      setSearchParams(next, { replace: true });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [focusLogId, loading, actorsLoading, data, searchParams, setSearchParams]);

  useEffect(() => {
    const pending = pendingFocus.current;
    if (!pending || loading || actorsLoading || (!error && data === null)) return;
    const frame = window.requestAnimationFrame(() => {
      if (pendingFocus.current !== pending) return;
      pendingFocus.current = null;
      if (generation.current !== pending.generation) return;
      const active = document.activeElement;
      if (active !== document.body && active !== pending.origin) return;
      heading.current?.focus();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [loading, actorsLoading, error, data, page, lang, actor]);

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

  const visibleActorRetryIds = actorRetryIds.filter(id => data?.content.some(log => log.adminId === id));

  return <section className={`${styles.section} ${styles.auditSection}`} aria-label={t("auditLogs")} aria-busy={loading || actorsLoading}>
    <h2 className={styles.title} ref={heading} tabIndex={-1}>{t("auditLogs")}</h2>
    {loading && <AdminLoading label={t("loading")} layout="logs" />}
    {actorsLoading && <p className={styles.feedback} role="status">{t("loading")}</p>}
    {error && <RetryNotice className={styles.error} message={t("adminLoadError")} retryLabel={t("retry")} disabled={loading} busy={loading} onRetry={() => {
      pendingFocus.current = { origin: document.activeElement instanceof HTMLElement ? document.activeElement : null, generation: generation.current };
      setRevision(value => value + 1);
    }} />}
    {visibleActorRetryIds.length > 0 && <RetryNotice className={styles.error} message={t("adminLoadError")} retryLabel={t("retry")} disabled={actorsLoading} busy={actorsLoading} onRetry={() => {
      pendingFocus.current = { origin: document.activeElement instanceof HTMLElement ? document.activeElement : null, generation: generation.current };
      visibleActorRetryIds.forEach(id => actorCache.current.delete(id));
      setActorRetryIds(existing => existing.filter(id => !visibleActorRetryIds.includes(id)));
      setActorsLoading(true);
      setActorRevision(value => value + 1);
    }} />}
    {data && data.content.length === 0 && <p>{t("noAuditLogs")}</p>}
    {data && <>
      <ul className={styles.list}>{data.content.map(log => <li className={`${styles.row} ${styles.auditRow}`} key={log.id}>
        <div className={styles.auditMain}>
          <strong>{actors[log.adminId] ? getUserName(actors[log.adminId]!, `${t("adminActorId")} #${log.adminId}`) : `${t("adminActorId")} #${log.adminId}`}</strong>
          {actors[log.adminId] && <>
            <p>{actors[log.adminId]!.email}</p>
            <span className={styles.auditActorRole}>{localizeUserRole(actors[log.adminId]!.role, t)}</span>
            <button className={styles.auditProfileButton} type="button" data-admin-log-profile={log.id} aria-label={`${t("viewUserProfile")}: ${getUserName(actors[log.adminId]!, t("someone"))}`} onClick={() => onOpenUserProfile(log.adminId, log.id)}>{t("viewUserProfile")}</button>
          </>}
          <p>{localizeAuditTarget(log.targetType, lang)} #{log.targetId ?? "—"}</p>
        </div>
        <div className={styles.auditSide}>
          <span className={styles.auditAction}>{localizeAuditAction(log.action, lang)}</span>
          <time dateTime={log.createdAt}>{formatDateTime(log.createdAt, lang)}</time>
        </div>
      </li>)}</ul>
      <Pagination className={styles.pagination} page={page} totalPages={data.totalPages} label={t("adminAuditPagination")} busy={loading || actorsLoading} statusSuffix={data.totalElements} onPageChange={nextPage => {
        if (nextPage === page) return;
        pendingFocus.current = { origin: document.activeElement instanceof HTMLElement ? document.activeElement : null, generation: generation.current };
        setPage(nextPage);
      }} />
    </>}
  </section>;
}
