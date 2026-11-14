import { createProfileStorageClient } from "../profile_storage.ts";
import { RewindApiError } from "../http/errors.ts";
import { supabaseSecretKey, supabaseUrl } from "./config.ts";
import { pool } from "./database.ts";

export const profileStorage = createProfileStorageClient(
  supabaseUrl,
  supabaseSecretKey,
);

let cleanupRunning = false;
let lastCleanupAt = 0;

export async function processPendingProfileMediaDeletion(
  force = false,
): Promise<void> {
  if (cleanupRunning || (!force && Date.now() - lastCleanupAt < 30000)) return;
  cleanupRunning = true;
  lastCleanupAt = Date.now();
  try {
    // Bound work per invocation while allowing an account's images to drain together.
    for (let processed = 0; processed < 6; processed++) {
      if (!await deleteNextProfileMediaObject()) break;
    }
  } finally {
    cleanupRunning = false;
  }
}

async function deleteNextProfileMediaObject(): Promise<boolean> {
  const connection = await pool.connect();
  const lease = crypto.randomUUID();
  let job: { object_path: string; attempts: number } | undefined;
  try {
    await connection.queryObject("BEGIN");
    await connection.queryObject("SET LOCAL ROLE rewind_edge_app");
    await connection.queryObject(
      "SELECT set_config('rewind.media_cleanup_worker', 'true', TRUE)",
    );
    const result = await connection.queryObject<
      { object_path: string; attempts: number }
    >({
      text: `SELECT object_path, attempts FROM rewind.profile_media_objects
             WHERE status <> 'ACTIVE' AND next_attempt_at <= CURRENT_TIMESTAMP
               AND (locked_until IS NULL OR locked_until <= CURRENT_TIMESTAMP)
             ORDER BY next_attempt_at, object_path FOR UPDATE SKIP LOCKED LIMIT 1`,
    });
    job = result.rows[0];
    if (job) {
      await connection.queryObject({
        text:
          `UPDATE rewind.profile_media_objects SET status = 'DELETE', attempts = attempts + 1,
                   locked_until = CURRENT_TIMESTAMP + INTERVAL '2 minutes', lock_token = $2
               WHERE object_path = $1`,
        args: [job.object_path, lease],
      });
    }
    await connection.queryObject("COMMIT");
  } catch (error) {
    try {
      await connection.queryObject("ROLLBACK");
    } catch { /* transaction may already be closed */ }
    throw error;
  } finally {
    connection.release();
  }
  if (!job) return false;

  let status = 200;
  try {
    await profileStorage.remove(job.object_path);
  } catch (error) {
    status = error instanceof RewindApiError ? error.status : 503;
  }

  const finish = await pool.connect();
  try {
    await finish.queryObject("BEGIN");
    await finish.queryObject("SET LOCAL ROLE rewind_edge_app");
    await finish.queryObject(
      "SELECT set_config('rewind.media_cleanup_worker', 'true', TRUE)",
    );
    if (status === 200) {
      await finish.queryObject({
        text: `DELETE FROM rewind.profile_media_objects
               WHERE object_path = $1 AND lock_token = $2 AND status = 'DELETE'`,
        args: [job.object_path, lease],
      });
    } else {
      const retrySeconds = Math.min(
        21600,
        30 * (2 ** Math.min(job.attempts, 10)),
      );
      await finish.queryObject({
        text: `UPDATE rewind.profile_media_objects
               SET next_attempt_at = CURRENT_TIMESTAMP + ($3 * INTERVAL '1 second'),
                   locked_until = NULL, lock_token = NULL, last_http_status = $4
               WHERE object_path = $1 AND lock_token = $2 AND status = 'DELETE'`,
        args: [job.object_path, lease, retrySeconds, status],
      });
    }
    await finish.queryObject("COMMIT");
  } catch (error) {
    try {
      await finish.queryObject("ROLLBACK");
    } catch { /* transaction may already be closed */ }
    throw error;
  } finally {
    finish.release();
  }
  return true;
}
