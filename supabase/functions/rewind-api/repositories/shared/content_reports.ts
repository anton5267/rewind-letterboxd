import type { HostedAuthUser } from "../../contracts/auth.ts";
import type { ReviewReportReason, ReviewReportResponse, ReviewReportStatusResponse } from "../../contracts/reviews.ts";
import {
  beginAdminTransaction,
  beginUserTransaction,
} from "../../runtime/transactions.ts";
import {
  recordAdminAudit,
} from "./admin_audit.ts";
import {
  safeId,
} from "./results.ts";

type ReportableContent = "comment" | "list";

function contentReportTable(target: ReportableContent) {
  return target === "comment"
    ? { reports: "rewind.comment_reports", targetColumn: "comment_id", targetTable: "rewind.comments", valid: `EXISTS (
        SELECT 1 FROM rewind.comments c
        JOIN rewind.users ca ON ca.id=c.user_id
        WHERE c.id=t.id AND NOT c.is_hidden AND c.user_id<>$2 AND ca.is_active
          AND rewind.comment_target_is_visible(c.review_id, c.list_id)
      )` }
    : { reports: "rewind.list_reports", targetColumn: "list_id", targetTable: "rewind.lists", valid: `EXISTS (
        SELECT 1 FROM rewind.lists l JOIN rewind.users owner ON owner.id=l.user_id
        WHERE l.id=t.id AND l.list_type='CUSTOM' AND l.is_public=TRUE
          AND l.user_id<>$2 AND owner.is_active=TRUE
      )` };
}

export async function getMyContentReport(authUser: HostedAuthUser, target: ReportableContent, targetId: number): Promise<ReviewReportStatusResponse | null> {
  const { connection, userId } = await beginUserTransaction(authUser);
  const config = contentReportTable(target);
  try {
    const valid = await connection.queryObject<{ id: string }>({
      text: `SELECT t.id::text AS id FROM ${config.targetTable} t WHERE t.id=$1 AND ${config.valid}`,
      args: [targetId, userId],
    });
    if (!valid.rows[0]) { await connection.queryObject("COMMIT"); return null; }
    const result = await connection.queryObject<{ id: string; reason: ReviewReportReason; created_at: string }>({
      text: `SELECT id::text AS id, reason, created_at::text AS created_at
             FROM ${config.reports} WHERE ${config.targetColumn}=$1 AND reporter_id=$2 AND status='OPEN'`,
      args: [targetId, userId],
    });
    await connection.queryObject("COMMIT");
    const row = result.rows[0];
    return row ? { reported: true, report: { id: safeId(row.id, "Report ID"), reason: row.reason, createdAt: row.created_at } }
      : { reported: false, report: null };
  } catch (error) {
    try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
    throw error;
  } finally { connection.release(); }
}

export async function submitContentReport(authUser: HostedAuthUser, target: ReportableContent, targetId: number, reason: ReviewReportReason): Promise<ReviewReportResponse | null> {
  const { connection, userId } = await beginUserTransaction(authUser);
  const config = contentReportTable(target);
  try {
    const insert = await connection.queryObject<{ id: string; reason: ReviewReportReason; created_at: string }>({
      text: `INSERT INTO ${config.reports} (${config.targetColumn}, reporter_id, reason)
             SELECT t.id, $2, $3 FROM ${config.targetTable} t
             WHERE t.id=$1 AND ${config.valid}
             ON CONFLICT (${config.targetColumn}, reporter_id) WHERE status='OPEN' DO NOTHING
             RETURNING id::text AS id, reason, created_at::text AS created_at`,
      args: [targetId, userId, reason],
    });
    const row = insert.rows[0] ?? (await connection.queryObject<{ id: string; reason: ReviewReportReason; created_at: string }>({
      text: `SELECT id::text AS id, reason, created_at::text AS created_at FROM ${config.reports}
             WHERE ${config.targetColumn}=$1 AND reporter_id=$2 AND status='OPEN'`, args: [targetId, userId],
    })).rows[0];
    await connection.queryObject("COMMIT");
    return row ? { id: safeId(row.id, "Report ID"), reason: row.reason, createdAt: row.created_at } : null;
  } catch (error) {
    try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
    throw error;
  } finally { connection.release(); }
}

export async function dismissContentReport(authUser: HostedAuthUser, reportId: number, target: ReportableContent): Promise<boolean> {
  const { connection, userId } = await beginAdminTransaction(authUser);
  const config = contentReportTable(target);
  const targetType = target === "comment" ? "COMMENT_REPORT" : "LIST_REPORT";
  try {
    const result = await connection.queryObject<{ id: string }>({
      text: `UPDATE ${config.reports} SET status='DISMISSED', reviewed_at=CURRENT_TIMESTAMP, reviewed_by=$2
             WHERE id=$1 AND status='OPEN' RETURNING id::text AS id`, args: [reportId, userId],
    });
    if (result.rows.length) await recordAdminAudit(connection, userId, `${target.toUpperCase()}_REPORT_DISMISSED`, targetType, reportId, null);
    await connection.queryObject("COMMIT");
    return result.rows.length > 0;
  } catch (error) {
    try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
    throw error;
  } finally { connection.release(); }
}
