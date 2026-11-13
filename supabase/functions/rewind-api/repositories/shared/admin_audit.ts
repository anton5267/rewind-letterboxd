import {
  type PgConnection,
} from "../../runtime/database.ts";

export async function recordAdminAudit(connection: PgConnection, userId: number, action: string, targetType: string, targetId: number | null, metadata: string | null) {
  await connection.queryObject({
    text: "INSERT INTO rewind.admin_audit_logs (admin_id, action, target_type, target_id, metadata) VALUES ($1, $2, $3, $4, $5)",
    args: [userId, action, targetType, targetId, metadata],
  });
}
