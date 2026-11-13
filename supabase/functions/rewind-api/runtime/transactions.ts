import type { HostedAuthUser } from "../contracts/auth.ts";
import { RewindApiError } from "../http/errors.ts";
import {
  pool,
} from "./database.ts";

export async function beginUserTransaction(authUser: HostedAuthUser) {
  const connection = await pool.connect();
  try {
    await connection.queryObject("BEGIN");
    await connection.queryObject("SET LOCAL ROLE rewind_edge_app");
    await connection.queryObject({
      text: "SELECT set_config('rewind.supabase_user_id', $1, TRUE)",
      args: [authUser.id],
    });
    const profile = await connection.queryObject<{ id: string; is_active: boolean }>({
      text: "SELECT id::text AS id, is_active FROM rewind.users WHERE supabase_user_id = $1",
      args: [authUser.id],
    });
    const row = profile.rows[0];
    if (!row || !row.is_active) throw new Error("The REWIND profile is unavailable.");
    const userId = Number(row.id);
    if (!Number.isSafeInteger(userId) || userId <= 0) throw new Error("The REWIND user ID is invalid.");
    await connection.queryObject({
      text: "SELECT set_config('rewind.user_id', $1, TRUE)",
      args: [String(userId)],
    });
    return { connection, userId };
  } catch (error) {
    try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may not have started */ }
    connection.release();
    throw error;
  }
}

export async function beginAdminTransaction(authUser: HostedAuthUser) {
  const context = await beginUserTransaction(authUser);
  try {
    const result = await context.connection.queryObject<{ role: string }>({
      text: "SELECT role FROM rewind.users WHERE id = $1 AND is_active", args: [context.userId],
    });
    if (result.rows[0]?.role !== "ADMIN") throw new RewindApiError(403, "Administrator access required");
    return context;
  } catch (error) {
    try { await context.connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
    context.connection.release();
    throw error;
  }
}
