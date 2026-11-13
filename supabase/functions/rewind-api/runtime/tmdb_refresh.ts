import type { HostedAuthUser } from "../contracts/auth.ts";
import {
  syncOneTmdb,
} from "../repositories/admin_tmdb.ts";
import {
  matchesWorkerSecret,
  runTmdbRefreshBatch,
  type TmdbRefreshCandidate,
  type TmdbRefreshErrorCode,
} from "../tmdb_refresh.ts";
import {
  pool,
  tmdbRefreshLockPool,
} from "./database.ts";

async function readTmdbRefreshSecret(): Promise<string | null> {
  const connection = await pool.connect();
  try {
    // Pool connections may have passed through role-scoped application work.
    // Vault is read only under the database login role, before any app role is set.
    await connection.queryObject("RESET ROLE");
    const result = await connection.queryObject<{ decrypted_secret: string }>({
      text: "SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'rewind_tmdb_refresh_secret' LIMIT 1",
    });
    return result.rows[0]?.decrypted_secret ?? null;
  } finally { connection.release(); }
}

async function getTmdbRefreshAdmin(): Promise<HostedAuthUser> {
  const connection = await pool.connect();
  try {
    const result = await connection.queryObject<{ id: string; email: string; supabase_user_id: string | null }>({
      text: `SELECT id::text AS id, email, supabase_user_id::text AS supabase_user_id
             FROM rewind.users WHERE role = 'ADMIN' AND is_active AND supabase_user_id IS NOT NULL
             ORDER BY id LIMIT 1`,
    });
    const admin = result.rows[0];
    if (!admin?.supabase_user_id || !admin.email) throw new Error("No active linked administrator");
    return { id: admin.supabase_user_id, email: admin.email, emailConfirmed: true, username: "scheduled-catalog-worker" };
  } finally { connection.release(); }
}

async function getTmdbRefreshCandidates(): Promise<TmdbRefreshCandidate[]> {
  const connection = await pool.connect();
  try {
    await connection.queryObject("BEGIN");
    await connection.queryObject("SET LOCAL ROLE rewind_edge_app");
    await connection.queryObject("SELECT set_config('rewind.tmdb_refresh_worker', 'true', TRUE)");
    const result = await connection.queryObject<{ movie_id: string; tmdb_id: string }>({
      text: `SELECT m.id::text AS movie_id, m.tmdb_id::text AS tmdb_id
             FROM rewind.movies m
             LEFT JOIN rewind.tmdb_refresh_state s ON s.movie_id = m.id
             WHERE m.tmdb_id IS NOT NULL
               AND (s.attempted_at IS NULL OR s.attempted_at < CURRENT_TIMESTAMP - INTERVAL '4 days')
             ORDER BY s.attempted_at ASC NULLS FIRST, m.id ASC
             LIMIT 10`,
    });
    await connection.queryObject("COMMIT");
    return result.rows.flatMap((row) => {
      const movieId = Number(row.movie_id), tmdbId = Number(row.tmdb_id);
      return Number.isSafeInteger(movieId) && movieId > 0 && Number.isSafeInteger(tmdbId) && tmdbId > 0
        ? [{ movieId, tmdbId }]
        : [];
    });
  } catch (error) {
    try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may have closed */ }
    throw error;
  } finally { connection.release(); }
}

async function recordTmdbRefreshAttempt(candidate: TmdbRefreshCandidate, succeeded: boolean, errorCode: TmdbRefreshErrorCode | null): Promise<void> {
  const connection = await pool.connect();
  try {
    await connection.queryObject("BEGIN");
    await connection.queryObject("SET LOCAL ROLE rewind_edge_app");
    await connection.queryObject("SELECT set_config('rewind.tmdb_refresh_worker', 'true', TRUE)");
    await connection.queryObject({
      text: `INSERT INTO rewind.tmdb_refresh_state (movie_id, attempted_at, succeeded_at, last_error_code)
             VALUES ($1, CURRENT_TIMESTAMP, CASE WHEN $2 THEN CURRENT_TIMESTAMP ELSE NULL END, $3)
             ON CONFLICT (movie_id) DO UPDATE SET attempted_at = EXCLUDED.attempted_at,
               succeeded_at = CASE WHEN $2 THEN EXCLUDED.succeeded_at ELSE rewind.tmdb_refresh_state.succeeded_at END,
               last_error_code = EXCLUDED.last_error_code`,
      args: [candidate.movieId, succeeded, errorCode],
    });
    await connection.queryObject("COMMIT");
  } catch (error) {
    try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may have closed */ }
    throw error;
  } finally { connection.release(); }
}

async function runScheduledTmdbRefresh(): Promise<{ attempted: number; succeeded: number; failed: number }> {
  const admin = await getTmdbRefreshAdmin();
  const candidates = await getTmdbRefreshCandidates();
  return await runTmdbRefreshBatch(
    candidates,
    async ({ movieId, tmdbId }) => await syncOneTmdb(admin, movieId, tmdbId, false),
    recordTmdbRefreshAttempt,
    10,
  );
}

export async function handleTmdbRefreshRequest(request: Request): Promise<Response> {
  let expectedSecret: string | null;
  try { expectedSecret = await readTmdbRefreshSecret(); }
  catch { return new Response(JSON.stringify({ message: "Worker configuration unavailable" }), { status: 503, headers: { "Content-Type": "application/json" } }); }
  if (!matchesWorkerSecret(request.headers.get("X-Rewind-Cron-Secret"), expectedSecret)) {
    return new Response(JSON.stringify({ message: "Authentication required" }), { status: 401, headers: { "Content-Type": "application/json" } });
  }

  const lock = await tmdbRefreshLockPool.connect();
  let locked = false;
  try {
    // Transaction-scoped locks also work through Supabase's transaction pooler.
    await lock.queryObject("BEGIN");
    const lockResult = await lock.queryObject<{ locked: boolean }>({
      text: "SELECT pg_try_advisory_xact_lock(76211841011::bigint) AS locked",
    });
    locked = lockResult.rows[0]?.locked === true;
    if (!locked) return new Response(JSON.stringify({ message: "Refresh already running" }), { status: 409, headers: { "Content-Type": "application/json" } });
    const result = await runScheduledTmdbRefresh();
    return new Response(JSON.stringify(result), { status: 200, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
  } catch {
    return new Response(JSON.stringify({ message: "Unable to refresh catalog" }), { status: 503, headers: { "Content-Type": "application/json" } });
  } finally {
    try { await lock.queryObject("COMMIT"); } catch { try { await lock.queryObject("ROLLBACK"); } catch { /* connection will release transaction */ } }
    lock.release();
  }
}
