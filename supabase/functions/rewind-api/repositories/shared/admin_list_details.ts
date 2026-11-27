import type { MovieCardResponse } from "../../contracts/catalog.ts";
import type { AdminAuditLogResponse, AdminListDetailsResponse } from "../../contracts/admin.ts";
import type { ReviewReportReason } from "../../contracts/reviews.ts";
import type { PgConnection } from "../../runtime/database.ts";
import { parseSafeCount } from "../../http/parsers/query.ts";
import { safeId } from "./results.ts";
import { toAdminList } from "./lists.ts";
import { recordAdminAudit } from "./admin_audit.ts";

type AdminListRow = {
  id: string; user_id: string; username: string; email: string; owner_is_active: boolean; name: string; description: string | null;
  list_type: "CUSTOM" | "WATCHED" | "WATCHLIST" | "FAVORITES"; is_public: boolean; item_count: string;
  created_at: string; updated_at: string; featured_position: number | null; featured_category: AdminListDetailsResponse["featuredCategory"];
};

export async function loadAdminListDetails(connection: PgConnection, id: number, reportId?: number): Promise<AdminListDetailsResponse | null> {
  const listResult = await connection.queryObject<AdminListRow>({
    text: `SELECT l.id::text AS id, l.user_id::text AS user_id, u.username, u.email, u.is_active AS owner_is_active, l.name, l.description,
                  l.list_type, l.is_public,
                  (SELECT COUNT(*)::text FROM rewind.list_items li WHERE li.list_id=l.id) AS item_count,
                  l.created_at::text AS created_at, l.updated_at::text AS updated_at,
                  l.featured_position, l.featured_category
           FROM rewind.lists l JOIN rewind.users u ON u.id=l.user_id WHERE l.id=$1`,
    args: [id],
  });
  const row = listResult.rows[0];
  if (!row) return null;

  let report: AdminListDetailsResponse["report"] = null;
  if (reportId !== undefined) {
    const reportResult = await connection.queryObject<{ id: string; reason: ReviewReportReason; created_at: string }>({
      text: `SELECT lr.id::text AS id, lr.reason, lr.created_at::text AS created_at
             FROM rewind.list_reports lr WHERE lr.list_id=$1 AND lr.id=$2 AND lr.status='OPEN'`,
      args: [id, reportId],
    });
    const reportRow = reportResult.rows[0];
    if (!reportRow) return null;
    report = { id: safeId(reportRow.id, "Report ID"), reason: reportRow.reason, createdAt: reportRow.created_at };
  }

  const [likes, reports, filmRows, historyRows] = await Promise.all([
    connection.queryObject<{ count: string }>({ text: "SELECT COUNT(*)::text AS count FROM rewind.list_likes WHERE list_id=$1", args: [id] }),
    connection.queryObject<{ count: string }>({ text: "SELECT COUNT(*)::text AS count FROM rewind.list_reports WHERE list_id=$1 AND status='OPEN'", args: [id] }),
    connection.queryObject<{ id: string; title: string; release_date: string | null; rating: number | null; photo_url: string | null }>({
      text: `SELECT m.id::text AS id, m.title, m.release_date::text AS release_date, m.rating, m.photo_url
             FROM rewind.list_items li JOIN rewind.movies m ON m.id=li.movie_id
             WHERE li.list_id=$1 AND m.is_published=TRUE
             ORDER BY li.position ASC NULLS LAST, li.added_at ASC, li.id ASC LIMIT 4`,
      args: [id],
    }),
    connection.queryObject<{ id: string; admin_id: string; action: string; target_type: string; target_id: string | null; metadata: string | null; created_at: string }>({
      text: `SELECT id::text AS id, admin_id::text AS admin_id, action, target_type, target_id::text AS target_id, metadata, created_at::text AS created_at
             FROM rewind.admin_audit_logs WHERE target_type='LIST' AND target_id=$1
             ORDER BY created_at DESC, id DESC LIMIT 20`,
      args: [id],
    }),
  ]);

  const films: MovieCardResponse[] = filmRows.rows.map(film => ({
    id: safeId(film.id, "Film ID"), title: film.title, releaseDate: film.release_date, rating: film.rating, photoUrl: film.photo_url,
  }));
  const history: AdminAuditLogResponse[] = historyRows.rows.map(entry => ({
    id: safeId(entry.id, "Audit log ID"), adminId: safeId(entry.admin_id, "Admin ID"), action: entry.action,
    targetType: entry.target_type, targetId: entry.target_id === null ? null : safeId(entry.target_id, "Target ID"),
    metadata: entry.metadata, createdAt: entry.created_at,
  }));
  return {
    ...toAdminList(row),
    email: row.email,
    ownerIsActive: row.owner_is_active,
    likeCount: parseSafeCount(likes.rows[0]?.count ?? "0"),
    reportCount: parseSafeCount(reports.rows[0]?.count ?? "0"),
    report,
    films,
    history,
  };
}

export async function addAdminListMovie(
  connection: PgConnection,
  adminId: number,
  listId: number,
  movieId: number,
): Promise<AdminListDetailsResponse | "NOT_FOUND" | "SYSTEM_LIST" | "UNPUBLISHED" | "DUPLICATE"> {
  const list = await connection.queryObject<{ list_type: string }>({
    text: "SELECT list_type FROM rewind.lists WHERE id=$1 FOR UPDATE", args: [listId],
  });
  if (!list.rows[0]) return "NOT_FOUND";
  if (list.rows[0].list_type !== "CUSTOM") return "SYSTEM_LIST";

  const movie = await connection.queryObject<{ is_published: boolean }>({
    text: "SELECT is_published FROM rewind.movies WHERE id=$1", args: [movieId],
  });
  if (!movie.rows[0]?.is_published) return "UNPUBLISHED";
  const duplicate = await connection.queryObject({
    text: "SELECT 1 FROM rewind.list_items WHERE list_id=$1 AND movie_id=$2", args: [listId, movieId],
  });
  if (duplicate.rows.length) return "DUPLICATE";
  const position = await connection.queryObject<{ next_position: number }>({
    text: "SELECT COALESCE(MAX(position), -1) + 1 AS next_position FROM rewind.list_items WHERE list_id=$1", args: [listId],
  });
  await connection.queryObject({
    text: "INSERT INTO rewind.list_items (list_id, movie_id, position) VALUES ($1, $2, $3)",
    args: [listId, movieId, position.rows[0]?.next_position ?? 0],
  });
  await recordAdminAudit(connection, adminId, "LIST_FILM_ADDED", "LIST", listId, JSON.stringify({ movie: movieId }));
  return await loadAdminListDetails(connection, listId) ?? "NOT_FOUND";
}
