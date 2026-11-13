import { PostgresError, type PoolClient } from "@db/postgres";
import type { HostedAuthUser } from "../contracts/auth.ts";
import { RewindApiError } from "../http/errors.ts";

export const syncVerifiedEmailSql = `UPDATE rewind.users
  SET email = $3, supabase_email_updated_at = $4::timestamptz
  WHERE id = $1 AND supabase_user_id = $2 AND is_active
    AND (supabase_email_updated_at IS NULL OR supabase_email_updated_at < $4::timestamptz)`;

export async function syncVerifiedProfileEmail(
  connection: Pick<PoolClient, "queryObject">,
  userId: number,
  authUser: HostedAuthUser,
): Promise<void> {
  if (!authUser.emailConfirmed || !authUser.updatedAt || !Number.isFinite(Date.parse(authUser.updatedAt))) return;
  if (!authUser.email || authUser.email.length > 150) {
    throw new RewindApiError(409, "Confirmed email cannot be stored in this REWIND profile");
  }
  try {
    await connection.queryObject({ text: syncVerifiedEmailSql, args: [userId, authUser.id, authUser.email, authUser.updatedAt] });
  } catch (error) {
    if (error instanceof PostgresError && error.fields.code === "23505") {
      throw new RewindApiError(409, "Confirmed email conflicts with another REWIND profile");
    }
    throw error;
  }
}
