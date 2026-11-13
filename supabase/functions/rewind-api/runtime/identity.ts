import type { RewindAuthVerifier } from "../contracts/auth.ts";
import { RewindApiError } from "../http/errors.ts";
import {
  createHostedAccessTokenVerifier,
  createHostedEmailChangeRequester,
  createHostedIdentityDeleter,
  createHostedPasswordChanger,
  createHostedPasswordVerifier,
} from "../hosted_auth.ts";
import {
  supabaseAnonKey,
  supabaseSecretKey,
  supabaseUrl,
  publicBaseUrl,
} from "./config.ts";
import {
  pool,
} from "./database.ts";

const changeHostedPassword = createHostedPasswordChanger(supabaseUrl, supabaseAnonKey);

const verifyHostedAccessToken = createHostedAccessTokenVerifier(supabaseUrl, supabaseAnonKey);

const requestHostedEmailChange = createHostedEmailChangeRequester(supabaseUrl, supabaseAnonKey, publicBaseUrl);

const verifyHostedPassword = createHostedPasswordVerifier(supabaseUrl, supabaseAnonKey);

const deleteHostedIdentity = createHostedIdentityDeleter(supabaseUrl, supabaseSecretKey);

export async function processPendingIdentityDeletion(): Promise<void> {
  const connection = await pool.connect();
  let job: { id: string; supabase_user_id: string; attempts: number } | undefined;
  try {
    await connection.queryObject("BEGIN");
    await connection.queryObject("SET LOCAL ROLE rewind_edge_app");
    await connection.queryObject("SELECT set_config('rewind.identity_cleanup_worker', 'true', TRUE)");
    const candidate = await connection.queryObject<{ id: string; supabase_user_id: string; attempts: number }>({
      text: `SELECT id::text AS id, supabase_user_id, attempts
             FROM rewind.supabase_identity_deletion_outbox
             WHERE next_attempt_at <= CURRENT_TIMESTAMP
               AND (locked_until IS NULL OR locked_until <= CURRENT_TIMESTAMP)
             ORDER BY next_attempt_at ASC, id ASC
             FOR UPDATE SKIP LOCKED LIMIT 1`,
    });
    if (candidate.rows[0]) {
      job = { ...candidate.rows[0], attempts: candidate.rows[0].attempts + 1 };
      await connection.queryObject({
        text: `UPDATE rewind.supabase_identity_deletion_outbox
               SET attempts = attempts + 1, locked_until = CURRENT_TIMESTAMP + INTERVAL '2 minutes'
               WHERE id = $1`, args: [job.id],
      });
    }
    await connection.queryObject("COMMIT");
  } catch (error) {
    try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
    throw error;
  } finally { connection.release(); }
  if (!job) return;

  let status = 200;
  try {
    await deleteHostedIdentity(job.supabase_user_id);
  } catch (error) {
    status = error instanceof RewindApiError ? error.status : 503;
  }

  const finish = await pool.connect();
  try {
    await finish.queryObject("BEGIN");
    await finish.queryObject("SET LOCAL ROLE rewind_edge_app");
    await finish.queryObject("SELECT set_config('rewind.identity_cleanup_worker', 'true', TRUE)");
    if (status === 200) {
      await finish.queryObject({
        text: "DELETE FROM rewind.supabase_identity_deletion_outbox WHERE id = $1 AND supabase_user_id = $2",
        args: [job.id, job.supabase_user_id],
      });
    } else {
      const retrySeconds = Math.min(21600, 30 * (2 ** Math.min(job.attempts - 1, 10)));
      await finish.queryObject({
        text: `UPDATE rewind.supabase_identity_deletion_outbox
               SET next_attempt_at = CURRENT_TIMESTAMP + ($2 * INTERVAL '1 second'),
                   locked_until = NULL, last_http_status = $3
               WHERE id = $1 AND supabase_user_id = $4`,
        args: [job.id, retrySeconds, Math.min(32767, Math.max(0, status)), job.supabase_user_id],
      });
    }
    await finish.queryObject("COMMIT");
  } catch (error) {
    try { await finish.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
    throw error;
  } finally { finish.release(); }
}

export const hostedAuthVerifier: RewindAuthVerifier = {
  verifyAccessToken: verifyHostedAccessToken,
  requestEmailChange: requestHostedEmailChange,
  verifyCurrentPassword: verifyHostedPassword,
  changePassword: changeHostedPassword,
  async processPendingIdentityDeletion() { await processPendingIdentityDeletion(); },
};
