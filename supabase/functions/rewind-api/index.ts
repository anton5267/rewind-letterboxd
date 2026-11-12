import { Pool } from "@db/postgres";
import { buildAdminMovieAuditMetadata, buildAdminMovieUpdateQuery } from "./admin_movie_update.ts";
import { replaceAdminMovieGenres } from "./admin_movie_genres.ts";
import { replaceAdminMovieCredits } from "./admin_movie_credits.ts";
import {
  createRewindApiHandler,
  type MovieDetailsResponse,
  type MovieCardResponse,
  type GenreResponse,
  type MovieSearchParams,
  type MovieSearchResult,
  type GlobalSearchArticleResponse,
  type GlobalSearchResponse,
  type PersonFilmographyResponse,
  type PersonSearchParams,
  type PersonSearchResult,
  type HostedAuthUser,
  type PublicListCardResponse,
  type PublicListDetailsResponse,
  type PopularTagResponse,
  type MyListResponse,
  type MyListPageResponse,
  type MyListItemResponse,
  type CreateMyListRequest,
  type UpdateMyListRequest,
  type ReviewResponse,
  type ReviewDetailsResponse,
  type ReviewPageResponse,
  type CommentPageResponse,
  type CommentResponse,
  type ReviewMutationRequest,
  type PublicProfileResponse,
  type PublicSocialUser,
  type ActivityResponse,
  type FollowStatusResponse,
  type PopularReviewerResponse,
  type NotificationResponse,
  type NotificationPreferencesResponse,
  type ConversationResponse,
  type MessageResponse,
  type JournalArticleResponse,
  type JournalArchiveEntry,
  type AdminJournalArticleRequest,
  type AdminReviewResponse,
  type AdminReportedReviewResponse,
  type ReviewReportReason,
  type ReviewReportResponse,
  type ReviewReportStatusResponse,
  type AdminCommentResponse,
  type AdminModerationQueueItem,
  type AdminModerationTarget,
  type AdminNotificationResponse,
  type AdminConversationResponse,
  type AdminCreateNotificationRequest,
  type AdminUserResponse,
  type AdminUserUpdateRequest,
  type AdminUserOverviewResponse,
  type AdminListResponse,
  type AdminAuditLogResponse,
  type AdminDashboardResponse,
  type AdminSettingResponse,
  type NewsletterQueueResponse,
  type NewsletterDeliveryStatusResponse,
  type AdminMovieResponse,
  type AdminMovieCatalogResponse,
  parseSafeCount,
  type AdminTmdbMovieCandidate,
  type AdminMovieWriteRequest,
  type AdminTmdbQualityReport,
  type AdminTmdbSyncResponse,
  type AdminTmdbBatchResponse,
  type AdminTmdbDiscoveryResponse,
  type AdminTmdbSyncInput,
  type AdminTmdbDiscoveryInput,
  RewindApiError,
} from "./handler.ts";
import { discoverTmdbMovies, fetchTmdbMovie, searchTmdbMovieCandidates, TmdbError, type TmdbMovie, type TmdbPerson } from "./tmdb.ts";
import { matchesWorkerSecret, runTmdbRefreshBatch, type TmdbRefreshCandidate, type TmdbRefreshErrorCode } from "./tmdb_refresh.ts";
import {
  createHostedIdentityDeleter,
  createHostedPasswordChanger,
  createHostedPasswordVerifier,
  readPublishableKey,
  readSecretKey,
} from "./hosted_auth.ts";

const databaseUrl = Deno.env.get("SUPABASE_DB_URL");
if (!databaseUrl) {
  throw new Error("SUPABASE_DB_URL must be available to this Edge Function");
}

// The server-only connection URL never leaves this function. Each checkout
// assumes a narrowly scoped NOLOGIN role for each operation.
const pool = new Pool(databaseUrl, 1, true);
// A separate connection is held only for the advisory lock. The main pool has
// one connection and must remain available to the normal per-movie transactions.
const tmdbRefreshLockPool = new Pool(databaseUrl, 1, true);
type PgConnection = Awaited<ReturnType<typeof pool.connect>>;
const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseAnonKey = readPublishableKey((name) => Deno.env.get(name));
const supabaseSecretKey = readSecretKey((name) => Deno.env.get(name));

const allowedOrigins = (Deno.env.get("REWIND_ALLOWED_ORIGINS")
  ?? "https://anton5267.github.io,http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

async function beginUserTransaction(authUser: HostedAuthUser) {
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

async function beginAdminTransaction(authUser: HostedAuthUser) {
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

async function recordAdminAudit(connection: PgConnection, userId: number, action: string, targetType: string, targetId: number | null, metadata: string | null) {
  await connection.queryObject({
    text: "INSERT INTO rewind.admin_audit_logs (admin_id, action, target_type, target_id, metadata) VALUES ($1, $2, $3, $4, $5)",
    args: [userId, action, targetType, targetId, metadata],
  });
}

const tmdbApiKey = Deno.env.get("TMDB_API_KEY");
const tmdbApiBaseUrl = Deno.env.get("TMDB_API_BASE_URL");

const changeHostedPassword = createHostedPasswordChanger(supabaseUrl, supabaseAnonKey);
const verifyHostedPassword = createHostedPasswordVerifier(supabaseUrl, supabaseAnonKey);
const deleteHostedIdentity = createHostedIdentityDeleter(supabaseUrl, supabaseSecretKey);

async function processPendingIdentityDeletion(): Promise<void> {
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

function tmdbApiFailure(error: unknown): never {
  if (error instanceof TmdbError) throw new RewindApiError(error.status, error.message);
  throw error;
}

async function assertTmdbAdmin(authUser: HostedAuthUser) {
  const { connection } = await beginAdminTransaction(authUser);
  try { await connection.queryObject("COMMIT"); }
  catch (error) { try { await connection.queryObject("ROLLBACK"); } catch { /* closed */ } throw error; }
  finally { connection.release(); }
}

async function resolveTmdbPerson(connection: PgConnection, table: "actors" | "directors" | "producers", value: TmdbPerson): Promise<number> {
  const found = await connection.queryObject<{ id: string }>({
    text: `SELECT id::text AS id FROM rewind.${table} WHERE tmdb_id=$1 OR LOWER(name)=LOWER($2) ORDER BY (tmdb_id=$1) DESC NULLS LAST LIMIT 1`,
    args: [value.tmdbId, value.name],
  });
  if (found.rows[0]) {
    const id = Number(found.rows[0].id);
    await connection.queryObject({ text: `UPDATE rewind.${table} SET name=$2, tmdb_id=$3, photo_url=$4 WHERE id=$1`, args: [id, value.name, value.tmdbId, value.photoUrl] });
    return id;
  }
  const inserted = await connection.queryObject<{ id: string }>({
    text: `INSERT INTO rewind.${table} (name, tmdb_id, photo_url) VALUES ($1,$2,$3) RETURNING id::text AS id`,
    args: [value.name, value.tmdbId, value.photoUrl],
  });
  return Number(inserted.rows[0]!.id);
}

async function applyTmdbMovie(connection: PgConnection, adminId: number, movieId: number, data: TmdbMovie, syncSimilar: boolean): Promise<AdminTmdbSyncResponse> {
  const movie = await connection.queryObject<{ id: string; title: string }>({
    text: "SELECT id::text AS id, title FROM rewind.movies WHERE id=$1 FOR UPDATE", args: [movieId],
  });
  if (!movie.rows[0]) throw new RewindApiError(404, "Movie not found");
  if (data.imdbId) {
    const collision = await connection.queryObject<{ id: string }>({ text: "SELECT id::text AS id FROM rewind.movies WHERE imdb_id=$1 AND id<>$2", args: [data.imdbId, movieId] });
    if (collision.rows.length) throw new RewindApiError(409, "IMDb id is already linked to another movie");
  }
  const update = await connection.queryObject<{ title: string }>({
    text: `UPDATE rewind.movies SET tmdb_id=$2, imdb_id=COALESCE(NULLIF($3,''),imdb_id), original_language=$4, title=$5,
           duration_minutes=$6, release_date=$7, short_plot=NULLIF($8,''), photo_url=$9, backdrop_url=$10,
           trailer_url=$11, updated_at=CURRENT_TIMESTAMP WHERE id=$1 RETURNING title`,
    args: [movieId, data.tmdbId, data.imdbId, data.originalLanguage, data.title, data.runtime, data.releaseDate, data.overview, data.posterUrl, data.backdropUrl, data.trailerUrl],
  });
  for (const genre of data.genres) {
    const found = await connection.queryObject<{ id: string }>({ text: "SELECT id::text AS id FROM rewind.genres WHERE tmdb_id=$1 OR LOWER(name)=LOWER($2) ORDER BY (tmdb_id=$1) DESC NULLS LAST LIMIT 1", args: [genre.tmdbId, genre.name] });
    if (found.rows[0]) await connection.queryObject({ text: "UPDATE rewind.genres SET name=$2, tmdb_id=$3 WHERE id=$1", args: [Number(found.rows[0].id), genre.name, genre.tmdbId] });
    else await connection.queryObject({ text: "INSERT INTO rewind.genres (name,tmdb_id) VALUES ($1,$2)", args: [genre.name, genre.tmdbId] });
  }
  await connection.queryObject({ text: "DELETE FROM rewind.movie_genres WHERE movie_id=$1", args: [movieId] });
  await connection.queryObject({ text: `INSERT INTO rewind.movie_genres(movie_id,genre_id)
      SELECT $1,id FROM rewind.genres WHERE tmdb_id=ANY($2::bigint[])`, args: [movieId, data.genres.map((x) => x.tmdbId)] });

  const actorIds: { id: number; characterName: string | null; castOrder: number | null }[] = [];
  for (const cast of data.cast) actorIds.push({ id: await resolveTmdbPerson(connection, "actors", cast), characterName: cast.characterName, castOrder: cast.castOrder });
  await connection.queryObject({ text: "DELETE FROM rewind.movie_actors WHERE movie_id=$1", args: [movieId] });
  for (const actor of actorIds) await connection.queryObject({ text: "INSERT INTO rewind.movie_actors(movie_id,actor_id,character_name,cast_order) VALUES($1,$2,$3,$4)", args: [movieId, actor.id, actor.characterName, actor.castOrder] });

  const directorIds: number[] = [];
  for (const person of data.directors) directorIds.push(await resolveTmdbPerson(connection, "directors", person));
  await connection.queryObject({ text: "DELETE FROM rewind.movie_directors WHERE movie_id=$1", args: [movieId] });
  for (const id of directorIds) await connection.queryObject({ text: "INSERT INTO rewind.movie_directors(movie_id,director_id) VALUES($1,$2)", args: [movieId, id] });

  const producerIds: number[] = [];
  for (const person of data.producers) producerIds.push(await resolveTmdbPerson(connection, "producers", person));
  await connection.queryObject({ text: "DELETE FROM rewind.movie_producers WHERE movie_id=$1", args: [movieId] });
  for (const id of producerIds) await connection.queryObject({ text: "INSERT INTO rewind.movie_producers(movie_id,producer_id) VALUES($1,$2)", args: [movieId, id] });

  if (data.voteAverage !== null) await connection.queryObject({
    text: `INSERT INTO rewind.external_ratings(movie_id,source,rating,votes_count,last_updated_at) VALUES($1,'TMDB',$2,$3,CURRENT_TIMESTAMP)
           ON CONFLICT(movie_id,source) DO UPDATE SET rating=EXCLUDED.rating,votes_count=EXCLUDED.votes_count,last_updated_at=CURRENT_TIMESTAMP`,
    args: [movieId, data.voteAverage, data.voteCount],
  });
  let similarMoviesLinked = 0;
  if (syncSimilar) {
    await connection.queryObject({ text: "DELETE FROM rewind.similar_movies WHERE movie_id=$1", args: [movieId] });
    const linked = await connection.queryObject({
      text: `INSERT INTO rewind.similar_movies(movie_id,similar_movie_id)
        SELECT $1,m.id FROM rewind.movies m WHERE m.tmdb_id=ANY($2::bigint[]) AND m.id<>$1
        ORDER BY array_position($2::bigint[],m.tmdb_id) LIMIT 6 ON CONFLICT DO NOTHING`,
      args: [movieId, data.similarTmdbIds],
    });
    similarMoviesLinked = linked.rowCount ?? 0;
  }
  await recordAdminAudit(connection, adminId, "MOVIE_TMDB_SYNCED", "MOVIE", movieId, `tmdbId=${data.tmdbId}`);
  return { movieId, tmdbId: data.tmdbId, title: update.rows[0]?.title ?? movie.rows[0].title,
    genresUpdated: data.genres.length, actorsUpdated: data.cast.length, directorsUpdated: data.directors.length,
    producersUpdated: data.producers.length, similarMoviesLinked, trailerUpdated: !!data.trailerUrl };
}

async function syncOneTmdb(authUser: HostedAuthUser, movieId: number, tmdbId: number, syncSimilar: boolean, importIfMissing = false): Promise<AdminTmdbSyncResponse> {
  await assertTmdbAdmin(authUser);
  let data: TmdbMovie;
  try { data = await fetchTmdbMovie(tmdbId, tmdbApiKey, fetch, tmdbApiBaseUrl); } catch (error) { return tmdbApiFailure(error); }
  const { connection, userId } = await beginAdminTransaction(authUser);
  try {
    const result = await connection.queryObject<{ id: string }>({ text: "SELECT id::text AS id FROM rewind.movies WHERE id=$1", args: [movieId] });
    if (!result.rows[0] && !importIfMissing) throw new RewindApiError(404, "Movie not found");
    let actualMovieId = movieId;
    if (!result.rows[0]) {
      const existing = await connection.queryObject<{ id: string }>({ text: "SELECT id::text AS id FROM rewind.movies WHERE tmdb_id=$1", args: [tmdbId] });
      if (existing.rows[0]) actualMovieId = Number(existing.rows[0].id);
      else {
        const inserted = await connection.queryObject<{ id: string }>({ text: "INSERT INTO rewind.movies(title) VALUES($1) RETURNING id::text AS id", args: [`TMDB ${tmdbId}`] });
        actualMovieId = Number(inserted.rows[0]!.id);
      }
    }
    const synced = await applyTmdbMovie(connection, userId, actualMovieId, data, syncSimilar);
    await connection.queryObject("COMMIT");
    return synced;
  } catch (error) {
    try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may be closed */ }
    throw error;
  } finally { connection.release(); }
}

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

async function handleTmdbRefreshRequest(request: Request): Promise<Response> {
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

function batchResult(items: AdminTmdbBatchResponse["items"]): AdminTmdbBatchResponse {
  const succeeded = items.filter((item) => item.status !== "FAILED").length;
  return { requested: items.length, succeeded, failed: items.length - succeeded, items };
}

async function importTmdbIds(authUser: HostedAuthUser, tmdbIds: number[], syncSimilar: boolean): Promise<AdminTmdbBatchResponse> {
  const items: AdminTmdbBatchResponse["items"] = [];
  for (const tmdbId of tmdbIds) {
    try {
      const result = await syncOneTmdb(authUser, -1, tmdbId, syncSimilar, true);
      items.push({ movieId: result.movieId, tmdbId, status: "IMPORTED", title: result.title, message: "Movie imported and metadata synchronized" });
    } catch (error) {
      items.push({ movieId: null, tmdbId, status: "FAILED", title: null, message: error instanceof Error ? error.message : "TMDB import failed" });
    }
  }
  return batchResult(items);
}

async function setReviewModeration(connection: PgConnection, userId: number, id: number, hidden: boolean, reason: string | null) {
  const result = await connection.queryObject<{ id: string }>({
    text: `UPDATE rewind.reviews SET is_hidden=$2, moderated_reason=$3, moderated_at=CURRENT_TIMESTAMP, moderated_by=$4
           WHERE id=$1 RETURNING id`, args: [id, hidden, hidden ? reason : null, userId],
  });
  if (result.rows.length === 0) throw new RewindApiError(404, "Review not found");
  if (hidden) {
    await connection.queryObject({
      text: `UPDATE rewind.review_reports
             SET status='ACTION_TAKEN', reviewed_at=CURRENT_TIMESTAMP, reviewed_by=$2
             WHERE review_id=$1 AND status='OPEN'`, args: [id, userId],
    });
  }
  await recordAdminAudit(connection, userId, hidden ? "REVIEW_HIDDEN" : "REVIEW_UNHIDDEN", "REVIEW", id, hidden ? reason : null);
}

async function setCommentModeration(connection: PgConnection, userId: number, id: number, hidden: boolean, reason: string | null) {
  const result = await connection.queryObject<{ id: string }>({
    text: `UPDATE rewind.comments SET is_hidden=$2, moderated_reason=$3, moderated_at=CURRENT_TIMESTAMP, moderated_by=$4
           WHERE id=$1 RETURNING id`, args: [id, hidden, hidden ? reason : null, userId],
  });
  if (result.rows.length === 0) throw new RewindApiError(404, "Comment not found");
  await recordAdminAudit(connection, userId, hidden ? "COMMENT_HIDDEN" : "COMMENT_UNHIDDEN", "COMMENT", id, hidden ? reason : null);
}

async function ensureSystemLists(connection: Awaited<ReturnType<typeof pool.connect>>, userId: number) {
  // Serialize first-login requests for the same profile so each system list is
  // created once even when the browser fires multiple API calls concurrently.
  await connection.queryObject({ text: "SELECT pg_advisory_xact_lock($1::bigint)", args: [userId] });
  for (const [type, name] of [["WATCHLIST", "Watchlist"], ["WATCHED", "Watched"], ["FAVORITES", "Favorites"]] as const) {
    await connection.queryObject({
      text: `INSERT INTO rewind.lists (user_id, name, list_type, is_public)
             SELECT $1::BIGINT, $2::VARCHAR, $3::VARCHAR, FALSE
             WHERE NOT EXISTS (
               SELECT 1 FROM rewind.lists WHERE user_id = $1::BIGINT AND list_type = $3::VARCHAR
             )`,
      args: [userId, name, type],
    });
  }
}

function safeId(value: string, label: string): number {
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id <= 0) throw new Error(`${label} is outside the safe JSON integer range.`);
  return id;
}

function reviewResponse(row: {
  id: string; user_id: string; username: string; user_avatar_url: string | null;
  content: string; rating: number | null; created_at: string;
}): ReviewResponse {
  return {
    id: safeId(row.id, "Review ID"), userId: safeId(row.user_id, "User ID"), username: row.username,
    userAvatarUrl: row.user_avatar_url, content: row.content, rating: row.rating, createdAt: row.created_at,
  };
}

function commentResponse(row: {
  id: string; review_id: string; user_id: string; username: string; user_avatar_url: string | null;
  content: string; created_at: string; updated_at: string;
}): CommentResponse {
  return {
    id: safeId(row.id, "Comment ID"), reviewId: safeId(row.review_id, "Review ID"),
    userId: safeId(row.user_id, "User ID"), username: row.username, userAvatarUrl: row.user_avatar_url,
    text: row.content, createdAt: row.created_at, updatedAt: row.updated_at,
  };
}

function pageResult<T>(content: T[], total: string | number, page: number, size: number) {
  const totalElements = Number(total);
  return { content, totalPages: Math.ceil(totalElements / size), totalElements, number: page };
}

function toPublicUser(row: { id: string; username: string; display_name: string | null; avatar_url: string | null }): PublicSocialUser {
  return { id: safeId(row.id, "User ID"), username: row.username, displayName: row.display_name?.trim() || row.username, avatarUrl: row.avatar_url };
}

function toActivity(row: {
  id: string; activity_type: ActivityResponse["type"]; created_at: string;
  actor_id: string | null; actor_username: string | null; actor_display_name: string | null; actor_avatar_url: string | null;
  movie_id: string | null; movie_title: string | null;
  related_user_id: string | null; related_username: string | null; related_display_name: string | null;
  list_id: string | null; list_name: string | null;
}): ActivityResponse {
  const actor = row.actor_id && row.actor_username ? {
    id: safeId(row.actor_id, "User ID"), username: row.actor_username,
    displayName: row.actor_display_name?.trim() || row.actor_username, avatarUrl: row.actor_avatar_url,
  } : null;
  const relatedUser = row.related_user_id && row.related_username ? {
    id: safeId(row.related_user_id, "User ID"), username: row.related_username,
    displayName: row.related_display_name?.trim() || row.related_username,
  } : null;
  return {
    id: safeId(row.id, "Activity ID"), type: row.activity_type, createdAt: row.created_at,
    actor,
    movie: row.movie_id && row.movie_title ? { id: safeId(row.movie_id, "Movie ID"), title: row.movie_title } : null,
    relatedUser,
    list: row.list_id && row.list_name ? { id: safeId(row.list_id, "List ID"), name: row.list_name } : null,
  };
}

function toNotification(row: {
  id: string; notification_type: NotificationResponse["type"]; created_at: string; read_at: string | null;
  actor_id: string | null; actor_username: string | null; actor_display_name: string | null; actor_avatar_url: string | null;
  related_user_id: string | null; review_id: string | null;
}): NotificationResponse {
  return {
    id: safeId(row.id, "Notification ID"), type: row.notification_type, createdAt: row.created_at, readAt: row.read_at,
    actor: row.actor_id && row.actor_username ? {
      id: safeId(row.actor_id, "User ID"), username: row.actor_username, displayName: row.actor_display_name,
      avatarUrl: row.actor_avatar_url,
    } : null,
    relatedUserId: row.related_user_id ? safeId(row.related_user_id, "User ID") : null,
    reviewId: row.review_id ? safeId(row.review_id, "Review ID") : null,
  };
}

function toMessage(row: { id: string; conversation_id: string; sender_id: string; body: string; created_at: string; read_at: string | null }): MessageResponse {
  return { id: safeId(row.id, "Message ID"), conversationId: safeId(row.conversation_id, "Conversation ID"),
    senderId: safeId(row.sender_id, "User ID"), body: row.body, createdAt: row.created_at, readAt: row.read_at };
}

function toConversation(row: {
  id: string; updated_at: string; other_id: string; other_username: string; other_display_name: string | null; other_avatar_url: string | null;
  last_id: string | null; last_sender_id: string | null; last_body: string | null; last_created_at: string | null; last_read_at: string | null;
}): ConversationResponse {
  return {
    id: safeId(row.id, "Conversation ID"),
    otherUser: { id: safeId(row.other_id, "User ID"), username: row.other_username, displayName: row.other_display_name, avatarUrl: row.other_avatar_url },
    updatedAt: row.updated_at,
    lastMessage: row.last_id && row.last_sender_id && row.last_body && row.last_created_at ? {
      id: safeId(row.last_id, "Message ID"), senderId: safeId(row.last_sender_id, "User ID"), body: row.last_body,
      createdAt: row.last_created_at, readAt: row.last_read_at,
    } : null,
  };
}

function toJournalArticle(row: {
  id: string; slug: string; language: string; category: string; title: string; excerpt: string | null;
  content: string; cover_url: string | null; audio_url: string | null; published_at: string | null;
}): JournalArticleResponse {
  return { id: safeId(row.id, "Journal article ID"), slug: row.slug, language: row.language, category: row.category,
    title: row.title, excerpt: row.excerpt, content: row.content, coverUrl: row.cover_url, audioUrl: row.audio_url,
    publishedAt: row.published_at };
}

function toAdminReview(row: {
  id: string; movie_id: string; movie_title: string; user_id: string; username: string; content: string;
  rating: number | null; is_hidden: boolean; moderated_reason: string | null; moderated_at: string | null; created_at: string;
}): AdminReviewResponse {
  return {
    id: safeId(row.id, "Review ID"), movieId: safeId(row.movie_id, "Movie ID"), movieTitle: row.movie_title,
    userId: safeId(row.user_id, "User ID"), username: row.username, content: row.content, rating: row.rating,
    isHidden: row.is_hidden, moderatedReason: row.moderated_reason, moderatedAt: row.moderated_at, createdAt: row.created_at,
  };
}

function toAdminComment(row: {
  id: string; review_id: string; user_id: string; username: string; content: string; is_hidden: boolean;
  moderated_reason: string | null; moderated_at: string | null; created_at: string;
}): AdminCommentResponse {
  return {
    id: safeId(row.id, "Comment ID"), reviewId: safeId(row.review_id, "Review ID"),
    userId: safeId(row.user_id, "User ID"), username: row.username, content: row.content,
    isHidden: row.is_hidden, moderatedReason: row.moderated_reason, moderatedAt: row.moderated_at, createdAt: row.created_at,
  };
}

function toAdminModerationQueueItem(row: {
  type: "REVIEW" | "COMMENT"; id: string; parent_id: string | null; movie_id: string | null;
  subject: string; user_id: string; username: string; content: string; created_at: string;
}): AdminModerationQueueItem {
  return {
    type: row.type, id: safeId(row.id, "Moderation item ID"),
    parentId: row.parent_id === null ? null : safeId(row.parent_id, "Review ID"),
    movieId: row.movie_id === null ? null : safeId(row.movie_id, "Movie ID"), subject: row.subject,
    userId: safeId(row.user_id, "User ID"), username: row.username, content: row.content, createdAt: row.created_at,
  };
}

function toAdminNotification(row: {
  id: string; recipient_id: string; actor_id: string | null; type: AdminNotificationResponse["type"];
  review_id: string | null; created_at: string; read_at: string | null;
}): AdminNotificationResponse {
  return {
    id: safeId(row.id, "Notification ID"), recipientId: safeId(row.recipient_id, "User ID"),
    actorId: row.actor_id === null ? null : safeId(row.actor_id, "User ID"), type: row.type,
    reviewId: row.review_id === null ? null : safeId(row.review_id, "Review ID"), createdAt: row.created_at, readAt: row.read_at,
  };
}

function toAdminConversation(row: {
  id: string; user_one_id: string; user_two_id: string; message_count: string;
  created_at: string; updated_at: string; last_message_at: string | null;
}): AdminConversationResponse {
  return {
    id: safeId(row.id, "Conversation ID"), userOneId: safeId(row.user_one_id, "User ID"),
    userTwoId: safeId(row.user_two_id, "User ID"), messageCount: Number(row.message_count),
    createdAt: row.created_at, updatedAt: row.updated_at, lastMessageAt: row.last_message_at,
  };
}

function toAdminUser(row: {
  id: string; username: string; display_name: string | null; email: string; role: string;
  avatar_url: string | null; is_active: boolean; is_hq: boolean; created_at: string | null;
}): AdminUserResponse {
  return {
    id: safeId(row.id, "User ID"), username: row.username, displayName: row.display_name,
    email: row.email, role: row.role, avatarUrl: row.avatar_url, isActive: row.is_active,
    isHq: row.is_hq, createdAt: row.created_at,
  };
}

function toAdminList(row: {
  id: string; user_id: string; username: string; name: string; description: string | null;
  list_type: AdminListResponse["listType"]; is_public: boolean; item_count: string;
  created_at: string; updated_at: string; featured_position: number | null;
}): AdminListResponse {
  return {
    id: safeId(row.id, "List ID"), userId: safeId(row.user_id, "User ID"), username: row.username,
    name: row.name, description: row.description, listType: row.list_type, isPublic: row.is_public,
    itemCount: Number(row.item_count), createdAt: row.created_at, updatedAt: row.updated_at,
    featuredPosition: row.featured_position,
  };
}

function toAdminMovie(row: {
  id: string; tmdb_id: string | null; title: string; release_date: string | null;
  rating: string | number | null; photo_url: string | null; is_published: boolean;
}): AdminMovieResponse {
  return {
    id: safeId(row.id, "Movie ID"), tmdbId: row.tmdb_id === null ? null : safeId(row.tmdb_id, "TMDB ID"),
    title: row.title, releaseDate: row.release_date,
    rating: row.rating === null ? null : Number(row.rating), photoUrl: row.photo_url, published: row.is_published,
  };
}

function toAdminMovieCatalog(row: {
  id: string; tmdb_id: string | null; title: string; release_date: string | null;
  rating: string | number | null; photo_url: string | null; duration_minutes: number | null;
  age_rating: string | null; review_count: string | number; is_published: boolean;
}): AdminMovieCatalogResponse {
  return {
    ...toAdminMovie(row), durationMinutes: row.duration_minutes, ageRating: row.age_rating,
    reviewCount: parseSafeCount(String(row.review_count)), published: row.is_published,
  };
}

function toAdminAuditLog(row: {
  id: string; admin_id: string; action: string; target_type: string; target_id: string | null;
  metadata: string | null; created_at: string;
}): AdminAuditLogResponse {
  return {
    id: safeId(row.id, "Audit ID"), adminId: safeId(row.admin_id, "User ID"), action: row.action,
    targetType: row.target_type, targetId: row.target_id === null ? null : safeId(row.target_id, "Target ID"),
    metadata: row.metadata, createdAt: row.created_at,
  };
}

async function loadListTags(connection: PgConnection, listIds: number[]): Promise<Map<number, string[]>> {
  const result = new Map<number, string[]>();
  if (listIds.length === 0) return result;
  const tags = await connection.queryObject<{ list_id: string; name: string }>({
    text: `SELECT lt.list_id::text AS list_id, t.name FROM rewind.list_tags lt
           JOIN rewind.tags t ON t.id = lt.tag_id WHERE lt.list_id = ANY($1::bigint[])
           ORDER BY lt.list_id, t.name`,
    args: [listIds],
  });
  for (const row of tags.rows) {
    const id = safeId(row.list_id, "List ID");
    const list = result.get(id) ?? [];
    list.push(row.name);
    result.set(id, list);
  }
  return result;
}

async function replaceListTags(connection: PgConnection, listId: number, values: string[]): Promise<string[]> {
  const normalized = new Map<string, string>();
  const resolvedNames: string[] = [];
  for (const value of values) {
    const name = value.trim().replace(/\s+/g, " ");
    if (!name) continue;
    const slug = name.normalize("NFKD").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "");
    if (!slug || slug.length > 60) throw new RewindApiError(400, "Invalid tag");
    if (!normalized.has(slug)) normalized.set(slug, name);
  }
  await connection.queryObject({ text: "DELETE FROM rewind.list_tags WHERE list_id = $1", args: [listId] });
  for (const [slug, name] of normalized) {
    await connection.queryObject({
      text: "INSERT INTO rewind.tags (name, slug) VALUES ($1, $2) ON CONFLICT (slug) DO NOTHING",
      args: [name, slug],
    });
    const tag = await connection.queryObject<{ id: string; name: string }>({
      text: "SELECT id::text AS id, name FROM rewind.tags WHERE slug = $1", args: [slug],
    });
    if (!tag.rows[0]) throw new Error("The list tag could not be resolved.");
    resolvedNames.push(tag.rows[0].name);
    await connection.queryObject({
      text: "INSERT INTO rewind.list_tags (list_id, tag_id) VALUES ($1, $2) ON CONFLICT (list_id, tag_id) DO NOTHING",
      args: [listId, safeId(tag.rows[0].id, "Tag ID")],
    });
  }
  return resolvedNames;
}

async function fetchMyListRows(connection: PgConnection, userId: number, limit?: number, offset = 0): Promise<MyListResponse[]> {
  const paged = limit !== undefined;
  const rows = await connection.queryObject<{
    id: string; name: string; description: string | null; list_type: MyListResponse["listType"]; is_public: boolean;
  }>({
    text: `SELECT id::text AS id, name, description, list_type, is_public FROM rewind.lists
           WHERE user_id = $1 ORDER BY updated_at DESC, id DESC${paged ? " LIMIT $2 OFFSET $3" : ""}`,
    args: paged ? [userId, limit, offset] : [userId],
  });
  const ids = rows.rows.map((row) => safeId(row.id, "List ID"));
  const tags = await loadListTags(connection, ids);
  return rows.rows.map((row) => {
    const id = safeId(row.id, "List ID");
    return { id, name: row.name, description: row.description, listType: row.list_type,
      isPublic: row.is_public, tags: tags.get(id) ?? [] };
  });
}

async function readUsersPage(where: string, args: unknown[], page: number, size: number, orderBy: string) {
  const connection = await pool.connect();
  try {
    await connection.queryObject("SET ROLE rewind_edge_app");
    const count = await connection.queryObject<{ total: string }>({
      text: `SELECT COUNT(*)::text AS total FROM rewind.users u WHERE u.is_active AND ${where}`, args,
    });
    const rows = await connection.queryObject<{ id: string; username: string; display_name: string | null; avatar_url: string | null }>({
      text: `SELECT u.id::text AS id, u.username, u.display_name, u.avatar_url FROM rewind.users u
             WHERE u.is_active AND ${where} ORDER BY ${orderBy} LIMIT $${args.length + 1} OFFSET $${args.length + 2}`,
      args: [...args, size, page * size],
    });
    return pageResult(rows.rows.map(toPublicUser), count.rows[0]?.total ?? "0", page, size);
  } finally { connection.release(); }
}

async function readFollowPage(userId: number, page: number, size: number, outgoing: boolean) {
  const connection = await pool.connect();
  try {
    await connection.queryObject("SET ROLE rewind_edge_app");
    const active = await connection.queryObject({ text: "SELECT 1 FROM rewind.users WHERE id = $1 AND is_active", args: [userId] });
    if (!active.rows.length) return null;
    const ownerColumn = outgoing ? "f.follower_id" : "f.following_id";
    const targetColumn = outgoing ? "f.following_id" : "f.follower_id";
    const [count, rows] = await Promise.all([
      connection.queryObject<{ total: string }>({
        text: `SELECT COUNT(*)::text AS total FROM rewind.follows f JOIN rewind.users u ON u.id = ${targetColumn} AND u.is_active WHERE ${ownerColumn} = $1`, args: [userId],
      }),
      connection.queryObject<{ id: string; username: string; display_name: string | null; avatar_url: string | null }>({
        text: `SELECT u.id::text AS id, u.username, u.display_name, u.avatar_url FROM rewind.follows f
               JOIN rewind.users u ON u.id = ${targetColumn} AND u.is_active
               WHERE ${ownerColumn} = $1 ORDER BY f.created_at DESC, f.id DESC LIMIT $2 OFFSET $3`, args: [userId, size, page * size],
      }),
    ]);
    return pageResult(rows.rows.map(toPublicUser), count.rows[0]?.total ?? "0", page, size);
  } finally { connection.release(); }
}

async function queryActivityPage(connection: PgConnection, predicate: string, predicateArgs: unknown[], page: number, size: number) {
  const [count, rows] = await Promise.all([
    connection.queryObject<{ total: string }>({
      text: `SELECT COUNT(*)::text AS total FROM rewind.user_activities a
             JOIN rewind.users actor ON actor.id = a.user_id AND actor.is_active
             LEFT JOIN rewind.lists l ON l.id = a.list_id AND (l.list_type <> 'CUSTOM' OR l.is_public)
             WHERE ${predicate} AND (a.list_id IS NULL OR l.id IS NOT NULL)`, args: predicateArgs,
    }),
    connection.queryObject<{
      id: string; activity_type: ActivityResponse["type"]; created_at: string;
      actor_id: string | null; actor_username: string | null; actor_display_name: string | null; actor_avatar_url: string | null;
      movie_id: string | null; movie_title: string | null;
      related_user_id: string | null; related_username: string | null; related_display_name: string | null;
      list_id: string | null; list_name: string | null;
    }>({
      text: `SELECT a.id::text AS id, a.activity_type, a.created_at::text AS created_at,
                    actor.id::text AS actor_id, actor.username AS actor_username, actor.display_name AS actor_display_name, actor.avatar_url AS actor_avatar_url,
                    m.id::text AS movie_id, m.title AS movie_title,
                    related.id::text AS related_user_id, related.username AS related_username, related.display_name AS related_display_name,
                    l.id::text AS list_id, l.name AS list_name
             FROM rewind.user_activities a JOIN rewind.users actor ON actor.id = a.user_id AND actor.is_active
             LEFT JOIN rewind.movies m ON m.id = a.movie_id
             LEFT JOIN rewind.users related ON related.id = a.related_user_id AND related.is_active
             LEFT JOIN rewind.lists l ON l.id = a.list_id AND (l.list_type <> 'CUSTOM' OR l.is_public)
             WHERE ${predicate} AND (a.list_id IS NULL OR l.id IS NOT NULL)
             ORDER BY a.created_at DESC, a.id DESC LIMIT $${predicateArgs.length + 1} OFFSET $${predicateArgs.length + 2}`,
      args: [...predicateArgs, size, page * size],
    }),
  ]);
  return pageResult(rows.rows.map(toActivity), count.rows[0]?.total ?? "0", page, size);
}

async function readActivityPage(userId: number, page: number, size: number) {
  const connection = await pool.connect();
  try {
    await connection.queryObject("SET ROLE rewind_edge_app");
    const active = await connection.queryObject({ text: "SELECT 1 FROM rewind.users WHERE id = $1 AND is_active", args: [userId] });
    if (!active.rows.length) return null;
    return await queryActivityPage(connection, "a.user_id = $1", [userId], page, size);
  } finally { connection.release(); }
}

async function findVisibleConversation(connection: PgConnection, userId: number, conversationId: number): Promise<boolean> {
  const result = await connection.queryObject({
    text: `SELECT 1 FROM rewind.conversations c JOIN rewind.users other
           ON other.id = CASE WHEN c.user_one_id = $2 THEN c.user_two_id ELSE c.user_one_id END AND other.is_active
           WHERE c.id = $1 AND $2 IN (c.user_one_id, c.user_two_id)`, args: [conversationId, userId],
  });
  if (!result.rows.length) return false;
  const blocked = await connection.queryObject({
    text: `SELECT 1 FROM rewind.user_blocks b JOIN rewind.conversations c ON c.id = $1
           WHERE (b.blocker_id = c.user_one_id AND b.blocked_id = c.user_two_id)
              OR (b.blocker_id = c.user_two_id AND b.blocked_id = c.user_one_id) LIMIT 1`, args: [conversationId],
  });
  if (blocked.rows.length) throw new RewindApiError(403, "User interaction is blocked");
  return true;
}

async function fetchConversation(connection: PgConnection, userId: number, conversationId: number): Promise<ConversationResponse | null> {
  const result = await connection.queryObject<{
    id: string; updated_at: string; other_id: string; other_username: string; other_display_name: string | null; other_avatar_url: string | null;
    last_id: string | null; last_sender_id: string | null; last_body: string | null; last_created_at: string | null; last_read_at: string | null;
  }>({
    text: `SELECT c.id::text AS id, c.updated_at::text AS updated_at, other.id::text AS other_id,
                  other.username AS other_username, other.display_name AS other_display_name, other.avatar_url AS other_avatar_url,
                  last.id::text AS last_id, last.sender_id::text AS last_sender_id, last.body AS last_body,
                  last.created_at::text AS last_created_at, last.read_at::text AS last_read_at
           FROM rewind.conversations c
           JOIN rewind.users other ON other.id = CASE WHEN c.user_one_id = $2 THEN c.user_two_id ELSE c.user_one_id END AND other.is_active
           LEFT JOIN LATERAL (SELECT m.id, m.sender_id, m.body, m.created_at, m.read_at
             FROM rewind.messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC, m.id DESC LIMIT 1) last ON TRUE
           WHERE c.id = $1 AND $2 IN (c.user_one_id, c.user_two_id)`, args: [conversationId, userId],
  });
  return result.rows[0] ? toConversation(result.rows[0]) : null;
}

const handler = createRewindApiHandler({
  async getAdminJournalArticles(authUser, page, size) {
    const { connection } = await beginAdminTransaction(authUser);
    try {
      const [count, rows] = await Promise.all([
        connection.queryObject<{ total: string }>({ text: "SELECT COUNT(*)::text AS total FROM rewind.journal_articles", args: [] }),
        connection.queryObject<{
          id: string; slug: string; language: string; category: string; title: string; excerpt: string | null;
          content: string; cover_url: string | null; audio_url: string | null; published_at: string | null;
        }>({
          text: `SELECT id::text AS id, slug, language, category, title, excerpt, content, cover_url, audio_url, published_at::text AS published_at
                 FROM rewind.journal_articles ORDER BY updated_at DESC, id DESC LIMIT $1 OFFSET $2`, args: [size, page * size],
        }),
      ]);
      await connection.queryObject("COMMIT");
      return pageResult(rows.rows.map(toJournalArticle), count.rows[0]?.total ?? "0", page, size);
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },
  async queueAdminNewsletter(authUser, articleId) {
    const { connection, userId } = await beginAdminTransaction(authUser);
    try {
      const article = await connection.queryObject<{ is_published: boolean; category: string }>({
        text: "SELECT is_published, category FROM rewind.journal_articles WHERE id=$1", args: [articleId],
      });
      if (!article.rows[0]) throw new RewindApiError(404, "Article not found");
      if (!article.rows[0].is_published || !["newsletter", "бюлетень"].includes(article.rows[0].category.trim().toLowerCase())) {
        throw new RewindApiError(400, "Only published Newsletter articles can be sent");
      }
      const queued = await connection.queryObject({
        text: `INSERT INTO rewind.newsletter_deliveries (article_id, user_id)
               SELECT $1, ns.user_id FROM rewind.newsletter_subscriptions ns
               JOIN rewind.users u ON u.id=ns.user_id
               WHERE ns.is_subscribed=TRUE AND u.is_active=TRUE
               ON CONFLICT (article_id, user_id) DO NOTHING RETURNING id`, args: [articleId],
      });
      const recipients = queued.rows.length;
      await recordAdminAudit(connection, userId, "JOURNAL_NEWSLETTER_QUEUED", "JOURNAL_ARTICLE", articleId, `queued=${recipients}`);
      await connection.queryObject("COMMIT");
      return { articleId: safeId(String(articleId), "Article ID"), recipients } satisfies NewsletterQueueResponse;
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },
  async getAdminNewsletterStatus(authUser, articleId) {
    const { connection } = await beginAdminTransaction(authUser);
    try {
      const article = await connection.queryObject({ text: "SELECT id FROM rewind.journal_articles WHERE id=$1", args: [articleId] });
      if (!article.rows.length) { await connection.queryObject("COMMIT"); return null; }
      const result = await connection.queryObject<{
        pending: string; sending: string; sent: string; failed: string; cancelled: string;
      }>({
        text: `SELECT COUNT(*) FILTER (WHERE status='PENDING')::text AS pending,
                      COUNT(*) FILTER (WHERE status='SENDING')::text AS sending,
                      COUNT(*) FILTER (WHERE status='SENT')::text AS sent,
                      COUNT(*) FILTER (WHERE status='FAILED')::text AS failed,
                      COUNT(*) FILTER (WHERE status='CANCELLED')::text AS cancelled
               FROM rewind.newsletter_deliveries WHERE article_id=$1`, args: [articleId],
      });
      await connection.queryObject("COMMIT");
      const row = result.rows[0]!;
      return {
        articleId: safeId(String(articleId), "Article ID"), pending: Number(row.pending), sending: Number(row.sending),
        sent: Number(row.sent), failed: Number(row.failed), cancelled: Number(row.cancelled),
      } satisfies NewsletterDeliveryStatusResponse;
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },
  async createAdminJournalArticle(authUser, body: AdminJournalArticleRequest) {
    const { connection, userId } = await beginAdminTransaction(authUser);
    try {
      const result = await connection.queryObject<{
        id: string; slug: string; language: string; category: string; title: string; excerpt: string | null;
        content: string; cover_url: string | null; audio_url: string | null; published_at: string | null;
      }>({
        text: `INSERT INTO rewind.journal_articles
                 (slug, language, category, title, excerpt, content, cover_url, audio_url, is_published, published_at, author_id)
               VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,CASE WHEN $9 THEN CURRENT_TIMESTAMP ELSE NULL END,$10)
               RETURNING id::text AS id, slug, language, category, title, excerpt, content, cover_url, audio_url, published_at::text AS published_at`,
        args: [body.slug, body.language, body.category, body.title, body.excerpt, body.content, body.coverUrl, body.audioUrl, body.published, userId],
      });
      const article = result.rows[0];
      if (!article) throw new Error("Journal article was not created.");
      await connection.queryObject({
        text: "INSERT INTO rewind.admin_audit_logs (admin_id, action, target_type, target_id, metadata) VALUES ($1, $2, $3, $4, $5)",
        args: [userId, "JOURNAL_ARTICLE_CREATED", "JOURNAL_ARTICLE", safeId(article.id, "Journal article ID"), article.language],
      });
      await connection.queryObject("COMMIT");
      return toJournalArticle(article);
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },
  async updateAdminJournalArticle(authUser, id, body: AdminJournalArticleRequest) {
    const { connection, userId } = await beginAdminTransaction(authUser);
    try {
      const result = await connection.queryObject<{
        id: string; slug: string; language: string; category: string; title: string; excerpt: string | null;
        content: string; cover_url: string | null; audio_url: string | null; published_at: string | null;
      }>({
        text: `UPDATE rewind.journal_articles SET slug=$2, language=$3, category=$4, title=$5, excerpt=$6, content=$7,
                 cover_url=$8, audio_url=$9, is_published=$10,
                 published_at=CASE WHEN $10 THEN COALESCE(published_at,CURRENT_TIMESTAMP) ELSE NULL END
               WHERE id=$1
               RETURNING id::text AS id, slug, language, category, title, excerpt, content, cover_url, audio_url, published_at::text AS published_at`,
        args: [id, body.slug, body.language, body.category, body.title, body.excerpt, body.content, body.coverUrl, body.audioUrl, body.published],
      });
      const article = result.rows[0];
      if (!article) { await connection.queryObject("COMMIT"); return null; }
      await connection.queryObject({
        text: "INSERT INTO rewind.admin_audit_logs (admin_id, action, target_type, target_id, metadata) VALUES ($1, $2, $3, $4, $5)",
        args: [userId, "JOURNAL_ARTICLE_UPDATED", "JOURNAL_ARTICLE", id, article.language],
      });
      await connection.queryObject("COMMIT");
      return toJournalArticle(article);
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },
  async getAdminConversations(authUser, page, size) {
    const { connection } = await beginAdminTransaction(authUser);
    try {
      const [count, rows] = await Promise.all([
        connection.queryObject<{ total: string }>({ text: "SELECT COUNT(*)::text AS total FROM rewind.conversations", args: [] }),
        connection.queryObject<{
          id: string; user_one_id: string; user_two_id: string; message_count: string;
          created_at: string; updated_at: string; last_message_at: string | null;
        }>({
          text: `SELECT c.id::text AS id, c.user_one_id::text AS user_one_id, c.user_two_id::text AS user_two_id,
                       COUNT(m.id)::text AS message_count, c.created_at::text AS created_at,
                       c.updated_at::text AS updated_at, MAX(m.created_at)::text AS last_message_at
                FROM rewind.conversations c LEFT JOIN rewind.messages m ON m.conversation_id=c.id
                GROUP BY c.id ORDER BY c.updated_at DESC, c.id DESC LIMIT $1 OFFSET $2`,
          args: [size, page * size],
        }),
      ]);
      await connection.queryObject("COMMIT");
      return pageResult(rows.rows.map(toAdminConversation), count.rows[0]?.total ?? "0", page, size);
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },
  async deleteAdminConversation(authUser, id) {
    const { connection, userId } = await beginAdminTransaction(authUser);
    try {
      const deleted = await connection.queryObject<{ id: string }>({ text: "DELETE FROM rewind.conversations WHERE id=$1 RETURNING id", args: [id] });
      if (deleted.rows.length) await recordAdminAudit(connection, userId, "CONVERSATION_DELETED", "CONVERSATION", id, null);
      await connection.queryObject("COMMIT");
      return deleted.rows.length > 0;
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },
  async getAdminUsers(authUser, query, page, size) {
    const { connection } = await beginAdminTransaction(authUser);
    try {
      const search = query?.trim() || null;
      const where = search === null ? "" : `WHERE POSITION(LOWER($1::text) IN LOWER(u.username)) > 0
        OR POSITION(LOWER($1::text) IN LOWER(u.email)) > 0
        OR POSITION(LOWER($1::text) IN LOWER(COALESCE(u.display_name,''))) > 0`;
      const args = search === null ? [] : [search];
      const [count, rows] = await Promise.all([
        connection.queryObject<{ total: string }>({ text: `SELECT COUNT(*)::text AS total FROM rewind.users u ${where}`, args }),
        connection.queryObject<{
          id: string; username: string; display_name: string | null; email: string; role: string;
          avatar_url: string | null; is_active: boolean; is_hq: boolean; created_at: string | null;
        }>({
          text: `SELECT u.id::text AS id, u.username, u.display_name, u.email, u.role, u.avatar_url,
                        u.is_active, u.is_hq, u.created_at::text AS created_at
                 FROM rewind.users u ${where} ORDER BY u.id DESC LIMIT $${args.length + 1} OFFSET $${args.length + 2}`,
          args: [...args, size, page * size],
        }),
      ]);
      await connection.queryObject("COMMIT");
      return pageResult(rows.rows.map(toAdminUser), count.rows[0]?.total ?? "0", page, size);
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },
  async getAdminUser(authUser, id) {
    const { connection } = await beginAdminTransaction(authUser);
    try {
      const result = await connection.queryObject<{
        id: string; username: string; display_name: string | null; email: string; role: string;
        avatar_url: string | null; is_active: boolean; is_hq: boolean; created_at: string | null;
      }>({
        text: `SELECT id::text AS id, username, display_name, email, role, avatar_url, is_active, is_hq, created_at::text AS created_at
               FROM rewind.users WHERE id=$1`, args: [id],
      });
      await connection.queryObject("COMMIT");
      return result.rows[0] ? toAdminUser(result.rows[0]) : null;
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },
  async getAdminUserOverview(authUser, id) {
    const { connection } = await beginAdminTransaction(authUser);
    try {
      const user = await connection.queryObject({ text: "SELECT id FROM rewind.users WHERE id=$1", args: [id] });
      if (!user.rows.length) { await connection.queryObject("COMMIT"); return null; }
      const [stats, history] = await Promise.all([
        connection.queryObject<{
          watched: string; reviews: string; ratings: string; watchlist: string; favorites: string;
          comments: string; likes_received: string; followers: string; custom_lists: string;
        }>({
          text: `SELECT
            (SELECT COUNT(*)::text FROM rewind.list_items li JOIN rewind.lists l ON l.id=li.list_id WHERE l.user_id=$1 AND l.list_type='WATCHED') AS watched,
            (SELECT COUNT(*)::text FROM rewind.reviews r WHERE r.user_id=$1 AND r.is_hidden=FALSE) AS reviews,
            (SELECT COUNT(*)::text FROM rewind.ratings r WHERE r.user_id=$1) AS ratings,
            (SELECT COUNT(*)::text FROM rewind.list_items li JOIN rewind.lists l ON l.id=li.list_id WHERE l.user_id=$1 AND l.list_type='WATCHLIST') AS watchlist,
            (SELECT COUNT(*)::text FROM rewind.list_items li JOIN rewind.lists l ON l.id=li.list_id WHERE l.user_id=$1 AND l.list_type='FAVORITES') AS favorites,
            (SELECT COUNT(*)::text FROM rewind.comments c WHERE c.user_id=$1) AS comments,
            (SELECT COUNT(*)::text FROM rewind.review_likes rl JOIN rewind.reviews r ON r.id=rl.review_id
               JOIN rewind.users liker ON liker.id=rl.user_id AND liker.is_active
             WHERE r.user_id=$1 AND r.is_hidden=FALSE) AS likes_received,
            (SELECT COUNT(*)::text FROM rewind.follows f JOIN rewind.users follower ON follower.id=f.follower_id AND follower.is_active
             WHERE f.following_id=$1) AS followers,
            (SELECT COUNT(*)::text FROM rewind.lists l WHERE l.user_id=$1 AND l.list_type='CUSTOM') AS custom_lists`,
          args: [id],
        }),
        connection.queryObject<{
          id: string; admin_id: string; action: string; target_type: string; target_id: string | null;
          metadata: string | null; created_at: string;
        }>({
          text: `SELECT id::text AS id, admin_id::text AS admin_id, action, target_type, target_id::text AS target_id,
                        metadata, created_at::text AS created_at
                 FROM rewind.admin_audit_logs WHERE target_type='USER' AND target_id=$1
                 ORDER BY created_at DESC, id DESC LIMIT 12`, args: [id],
        }),
      ]);
      await connection.queryObject("COMMIT");
      const row = stats.rows[0];
      return {
        stats: {
          watched: Number(row?.watched ?? 0), reviews: Number(row?.reviews ?? 0), ratings: Number(row?.ratings ?? 0),
          watchlist: Number(row?.watchlist ?? 0), favorites: Number(row?.favorites ?? 0), comments: Number(row?.comments ?? 0),
          likesReceived: Number(row?.likes_received ?? 0), followers: Number(row?.followers ?? 0),
          customLists: Number(row?.custom_lists ?? 0),
        },
        adminHistory: history.rows.map((item) => ({
          id: safeId(item.id, "Audit ID"), adminId: safeId(item.admin_id, "User ID"), action: item.action,
          targetType: item.target_type, targetId: item.target_id === null ? null : safeId(item.target_id, "Target ID"),
          metadata: item.metadata, createdAt: item.created_at,
        })),
      };
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },
  async updateAdminUser(authUser, id, update: AdminUserUpdateRequest) {
    const { connection, userId } = await beginAdminTransaction(authUser);
    try {
      await connection.queryObject("SELECT id FROM rewind.users WHERE role='ADMIN' AND is_active ORDER BY id FOR UPDATE");
      const target = await connection.queryObject<{ id: string; role: string; is_active: boolean }>({
        text: "SELECT id::text AS id, role, is_active FROM rewind.users WHERE id=$1 FOR UPDATE", args: [id],
      });
      if (!target.rows[0]) { await connection.queryObject("COMMIT"); return null; }
      const current = target.rows[0];
      const removesAdminAccess = current.role === "ADMIN" && current.is_active
        && (update.isActive === false || update.role === "USER");
      if (removesAdminAccess && id === userId) throw new RewindApiError(400, "Administrators cannot deactivate or demote their own account");
      if (removesAdminAccess) {
        const admins = await connection.queryObject<{ total: string }>({
          text: "SELECT COUNT(*)::text AS total FROM rewind.users WHERE role='ADMIN' AND is_active", args: [],
        });
        if (Number(admins.rows[0]?.total ?? 0) <= 1) throw new RewindApiError(400, "At least one active administrator is required");
      }
      const fields: string[] = [];
      const args: unknown[] = [id];
      const add = (column: string, value: unknown) => { args.push(value); fields.push(`${column}=$${args.length}`); };
      if (update.username !== undefined) add("username", update.username.trim());
      if (update.displayName !== undefined) add("display_name", update.displayName.trim() || null);
      if (update.avatarUrl !== undefined) add("avatar_url", update.avatarUrl.trim() || null);
      if (update.role !== undefined) add("role", update.role);
      if (update.isActive !== undefined) add("is_active", update.isActive);
      let row: {
        id: string; username: string; display_name: string | null; email: string; role: string;
        avatar_url: string | null; is_active: boolean; is_hq: boolean; created_at: string | null;
      };
      if (fields.length) {
        const result = await connection.queryObject<typeof row>({
          text: `UPDATE rewind.users SET ${fields.join(", ")} WHERE id=$1
                 RETURNING id::text AS id, username, display_name, email, role, avatar_url, is_active, is_hq, created_at::text AS created_at`,
          args,
        });
        row = result.rows[0]!;
      } else {
        const result = await connection.queryObject<typeof row>({
          text: `SELECT id::text AS id, username, display_name, email, role, avatar_url, is_active, is_hq, created_at::text AS created_at
                 FROM rewind.users WHERE id=$1`, args: [id],
        });
        row = result.rows[0]!;
      }
      await recordAdminAudit(connection, userId, "USER_UPDATED", "USER", id, null);
      await connection.queryObject("COMMIT");
      return toAdminUser(row);
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },
  async setAdminUserActive(authUser, id, active) {
    const { connection, userId } = await beginAdminTransaction(authUser);
    try {
      await connection.queryObject("SELECT id FROM rewind.users WHERE role='ADMIN' AND is_active ORDER BY id FOR UPDATE");
      const target = await connection.queryObject<{ role: string; is_active: boolean }>({
        text: "SELECT role, is_active FROM rewind.users WHERE id=$1 FOR UPDATE", args: [id],
      });
      if (!target.rows[0]) { await connection.queryObject("COMMIT"); return false; }
      if (!active && target.rows[0].role === "ADMIN" && target.rows[0].is_active) {
        if (id === userId) throw new RewindApiError(400, "Administrators cannot deactivate or demote their own account");
        const admins = await connection.queryObject<{ total: string }>({
          text: "SELECT COUNT(*)::text AS total FROM rewind.users WHERE role='ADMIN' AND is_active", args: [],
        });
        if (Number(admins.rows[0]?.total ?? 0) <= 1) throw new RewindApiError(400, "At least one active administrator is required");
      }
      await connection.queryObject({ text: "UPDATE rewind.users SET is_active=$2 WHERE id=$1", args: [id, active] });
      await recordAdminAudit(connection, userId, active ? "USER_ACTIVATED" : "USER_DEACTIVATED", "USER", id, null);
      await connection.queryObject("COMMIT");
      return true;
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },
  async setAdminUserHq(authUser, id, hq) {
    const { connection, userId } = await beginAdminTransaction(authUser);
    try {
      const result = await connection.queryObject<{
        id: string; username: string; display_name: string | null; email: string; role: string;
        avatar_url: string | null; is_active: boolean; is_hq: boolean; created_at: string | null;
      }>({
        text: `UPDATE rewind.users SET is_hq=$2 WHERE id=$1
               RETURNING id::text AS id, username, display_name, email, role, avatar_url, is_active, is_hq, created_at::text AS created_at`,
        args: [id, hq],
      });
      if (!result.rows[0]) { await connection.queryObject("COMMIT"); return null; }
      await recordAdminAudit(connection, userId, hq ? "HQ_GRANTED" : "HQ_REVOKED", "USER", id, null);
      await connection.queryObject("COMMIT");
      return toAdminUser(result.rows[0]);
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },
  async getAdminLists(authUser, page, size) {
    const { connection } = await beginAdminTransaction(authUser);
    try {
      const [count, rows] = await Promise.all([
        connection.queryObject<{ total: string }>({ text: "SELECT COUNT(*)::text AS total FROM rewind.lists" }),
        connection.queryObject<{
          id: string; user_id: string; username: string; name: string; description: string | null;
          list_type: AdminListResponse["listType"]; is_public: boolean; item_count: string;
          created_at: string; updated_at: string; featured_position: number | null;
        }>({
          text: `SELECT l.id::text AS id, l.user_id::text AS user_id, u.username, l.name, l.description,
                        l.list_type, l.is_public, COUNT(li.id)::text AS item_count,
                        l.created_at::text AS created_at, l.updated_at::text AS updated_at, l.featured_position
                 FROM rewind.lists l JOIN rewind.users u ON u.id=l.user_id
                 LEFT JOIN rewind.list_items li ON li.list_id=l.id
                 GROUP BY l.id, u.username ORDER BY l.updated_at DESC LIMIT $1 OFFSET $2`,
          args: [size, page * size],
        }),
      ]);
      await connection.queryObject("COMMIT");
      return pageResult(rows.rows.map(toAdminList), count.rows[0]?.total ?? "0", page, size);
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },
  async setAdminListVisibility(authUser, id, visible) {
    const { connection, userId } = await beginAdminTransaction(authUser);
    try {
      await connection.queryObject("SELECT pg_advisory_xact_lock(1480, 1)");
      const updated = await connection.queryObject({
        text: "UPDATE rewind.lists SET is_public=$2, featured_position=CASE WHEN $2 THEN featured_position ELSE NULL END, updated_at=CURRENT_TIMESTAMP WHERE id=$1 AND list_type='CUSTOM' RETURNING id",
        args: [id, visible],
      });
      if (!updated.rows.length) { await connection.queryObject("COMMIT"); return null; }
      const row = await connection.queryObject<{
        id: string; user_id: string; username: string; name: string; description: string | null;
        list_type: AdminListResponse["listType"]; is_public: boolean; item_count: string;
        created_at: string; updated_at: string; featured_position: number | null;
      }>({
        text: `SELECT l.id::text AS id, l.user_id::text AS user_id, u.username, l.name, l.description,
                      l.list_type, l.is_public, COUNT(li.id)::text AS item_count,
                      l.created_at::text AS created_at, l.updated_at::text AS updated_at, l.featured_position
               FROM rewind.lists l JOIN rewind.users u ON u.id=l.user_id
               LEFT JOIN rewind.list_items li ON li.list_id=l.id WHERE l.id=$1
               GROUP BY l.id, u.username`, args: [id],
      });
      await recordAdminAudit(connection, userId, visible ? "LIST_PUBLISHED" : "LIST_HIDDEN", "LIST", id, null);
      await connection.queryObject("COMMIT");
      return row.rows[0] ? toAdminList(row.rows[0]) : null;
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },
  async setAdminListFeatured(authUser, id, featured) {
    const { connection, userId } = await beginAdminTransaction(authUser);
    try {
      await connection.queryObject("SELECT pg_advisory_xact_lock(1480, 1)");
      const current = await connection.queryObject<{ id: string; featured_position: number | null; list_type: string; is_public: boolean; is_active: boolean }>({
        text: `SELECT l.id::text AS id, l.featured_position, l.list_type, l.is_public, u.is_active
               FROM rewind.lists l JOIN rewind.users u ON u.id=l.user_id WHERE l.id=$1 FOR UPDATE OF l`, args: [id],
      });
      const row = current.rows[0];
      if (!row) { await connection.queryObject("COMMIT"); return null; }
      if (featured && (row.list_type !== "CUSTOM" || !row.is_public || !row.is_active)) {
        await connection.queryObject("COMMIT");
        return "NOT_ELIGIBLE" as const;
      }
      if ((row.featured_position !== null) === featured) {
        // Return the unchanged row through the same serializer below.
      } else if (featured) {
        const next = await connection.queryObject<{ next_position: number }>({
          text: "SELECT COALESCE(MAX(featured_position) + 1, 0)::integer AS next_position FROM rewind.lists",
        });
        await connection.queryObject({ text: "UPDATE rewind.lists SET featured_position=$2 WHERE id=$1", args: [id, next.rows[0].next_position] });
        await recordAdminAudit(connection, userId, "LIST_FEATURED", "LIST", id, `position=${next.rows[0].next_position}`);
      } else {
        await connection.queryObject({ text: "UPDATE rewind.lists SET featured_position=NULL WHERE id=$1", args: [id] });
        await recordAdminAudit(connection, userId, "LIST_UNFEATURED", "LIST", id, null);
      }
      const updated = await connection.queryObject<{
        id: string; user_id: string; username: string; name: string; description: string | null;
        list_type: AdminListResponse["listType"]; is_public: boolean; item_count: string;
        created_at: string; updated_at: string; featured_position: number | null;
      }>({
        text: `SELECT l.id::text AS id, l.user_id::text AS user_id, u.username, l.name, l.description,
                      l.list_type, l.is_public, COUNT(li.id)::text AS item_count,
                      l.created_at::text AS created_at, l.updated_at::text AS updated_at, l.featured_position
               FROM rewind.lists l JOIN rewind.users u ON u.id=l.user_id LEFT JOIN rewind.list_items li ON li.list_id=l.id
               WHERE l.id=$1 GROUP BY l.id, u.username`, args: [id],
      });
      await connection.queryObject("COMMIT");
      return updated.rows[0] ? toAdminList(updated.rows[0]) : null;
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },
  async moveAdminListFeatured(authUser, id, direction) {
    const { connection, userId } = await beginAdminTransaction(authUser);
    try {
      // Serialize all curation order changes with feature/unfeature operations.
      await connection.queryObject("SELECT pg_advisory_xact_lock(1480, 1)");
      const current = await connection.queryObject<{ id: string; list_type: string; is_public: boolean; is_active: boolean; featured_position: number | null }>({
        text: `SELECT l.id::text AS id, l.list_type, l.is_public, u.is_active, l.featured_position
               FROM rewind.lists l JOIN rewind.users u ON u.id=l.user_id WHERE l.id=$1 FOR UPDATE OF l`, args: [id],
      });
      const row = current.rows[0];
      if (!row) { await connection.queryObject("COMMIT"); return "NOT_FOUND" as const; }
      if (row.list_type !== "CUSTOM" || !row.is_public || !row.is_active || row.featured_position === null) {
        await connection.queryObject("COMMIT");
        return "NOT_ELIGIBLE" as const;
      }
      const featured = await connection.queryObject<{ id: string; featured_position: number }>(
        `SELECT l.id::text AS id, l.featured_position
         FROM rewind.lists l JOIN rewind.users u ON u.id=l.user_id
         WHERE l.featured_position IS NOT NULL AND l.list_type='CUSTOM' AND l.is_public=true AND u.is_active=true
         ORDER BY l.featured_position ASC FOR UPDATE OF l`,
      );
      const index = featured.rows.findIndex(item => Number(item.id) === id);
      const neighborIndex = index + (direction === "up" ? -1 : 1);
      const neighbor = featured.rows[neighborIndex];
      if (index < 0) {
        await connection.queryObject("COMMIT");
        return "NOT_ELIGIBLE" as const;
      }
      if (!neighbor) {
        await connection.queryObject("COMMIT");
        return "BOUNDARY" as const;
      }
      const oldPosition = row.featured_position;
      const newPosition = neighbor.featured_position;
      await connection.queryObject({ text: "UPDATE rewind.lists SET featured_position=NULL WHERE id=$1", args: [id] });
      await connection.queryObject({ text: "UPDATE rewind.lists SET featured_position=$2 WHERE id=$1", args: [Number(neighbor.id), oldPosition] });
      await connection.queryObject({ text: "UPDATE rewind.lists SET featured_position=$2 WHERE id=$1", args: [id, newPosition] });
      await recordAdminAudit(connection, userId, "LIST_FEATURED_REORDERED", "LIST", id, `position=${oldPosition}->${newPosition};neighbor=${neighbor.id}`);
      await connection.queryObject("COMMIT");
      return "OK" as const;
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },
  async deleteAdminList(authUser, id) {
    const { connection, userId } = await beginAdminTransaction(authUser);
    try {
      await connection.queryObject("SELECT pg_advisory_xact_lock(1480, 1)");
      const existing = await connection.queryObject<{ list_type: string }>({
        text: "SELECT list_type FROM rewind.lists WHERE id=$1 FOR UPDATE", args: [id],
      });
      if (!existing.rows[0]) { await connection.queryObject("COMMIT"); return "NOT_FOUND" as const; }
      if (existing.rows[0].list_type !== "CUSTOM") { await connection.queryObject("COMMIT"); return "SYSTEM_LIST" as const; }
      await connection.queryObject({ text: "DELETE FROM rewind.lists WHERE id=$1", args: [id] });
      await recordAdminAudit(connection, userId, "LIST_DELETED", "LIST", id, null);
      await connection.queryObject("COMMIT");
      return "OK" as const;
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },
  async getAdminDashboard(authUser) {
    const { connection } = await beginAdminTransaction(authUser);
    try {
      const result = await connection.queryObject<{
        users: string; active_users: string; hq_users: string; movies: string; reviews: string; hidden_reviews: string;
      }>({
        text: `SELECT (SELECT COUNT(*)::text FROM rewind.users) AS users,
                      (SELECT COUNT(*)::text FROM rewind.users WHERE is_active) AS active_users,
                      (SELECT COUNT(*)::text FROM rewind.users WHERE is_hq) AS hq_users,
                      (SELECT COUNT(*)::text FROM rewind.movies) AS movies,
                      (SELECT COUNT(*)::text FROM rewind.reviews) AS reviews,
                      (SELECT COUNT(*)::text FROM rewind.reviews WHERE is_hidden) AS hidden_reviews`,
      });
      await connection.queryObject("COMMIT");
      const row = result.rows[0]!;
      return {
        users: Number(row.users), activeUsers: Number(row.active_users), hqUsers: Number(row.hq_users),
        movies: Number(row.movies), reviews: Number(row.reviews), hiddenReviews: Number(row.hidden_reviews),
      } satisfies AdminDashboardResponse;
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },
  async getAdminAuditLogs(authUser, page, size) {
    const { connection } = await beginAdminTransaction(authUser);
    try {
      const [count, rows] = await Promise.all([
        connection.queryObject<{ total: string }>({ text: "SELECT COUNT(*)::text AS total FROM rewind.admin_audit_logs" }),
        connection.queryObject<{
          id: string; admin_id: string; action: string; target_type: string; target_id: string | null;
          metadata: string | null; created_at: string;
        }>({
          text: `SELECT id::text AS id, admin_id::text AS admin_id, action, target_type, target_id::text AS target_id,
                        metadata, created_at::text AS created_at FROM rewind.admin_audit_logs
                 ORDER BY created_at DESC, id DESC LIMIT $1 OFFSET $2`, args: [size, page * size],
        }),
      ]);
      await connection.queryObject("COMMIT");
      return pageResult(rows.rows.map(toAdminAuditLog), count.rows[0]?.total ?? "0", page, size);
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },
  async getAdminSettings(authUser) {
    const { connection } = await beginAdminTransaction(authUser);
    try {
      const result = await connection.queryObject<{
        setting_key: string; setting_value: string; updated_by: string | null; updated_at: string;
      }>({
        text: `SELECT setting_key, setting_value, updated_by::text AS updated_by, updated_at::text AS updated_at
               FROM rewind.site_settings WHERE setting_key = ANY($1::text[]) ORDER BY setting_key`,
        args: [["default_locale", "journal_enabled", "maintenance_mode", "site_name"]],
      });
      await connection.queryObject("COMMIT");
      return result.rows.map((row): AdminSettingResponse => ({
        key: row.setting_key, value: row.setting_value,
        updatedBy: row.updated_by === null ? null : safeId(row.updated_by, "User ID"), updatedAt: row.updated_at,
      }));
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },
  async updateAdminSetting(authUser, key, value) {
    const { connection, userId } = await beginAdminTransaction(authUser);
    try {
      const updated = await connection.queryObject<{
        setting_key: string; setting_value: string; updated_by: string | null; updated_at: string;
      }>({
        text: `UPDATE rewind.site_settings SET setting_value=$2, updated_by=$3, updated_at=CURRENT_TIMESTAMP
               WHERE setting_key=$1 RETURNING setting_key, setting_value, updated_by::text AS updated_by, updated_at::text AS updated_at`,
        args: [key, value, userId],
      });
      if (!updated.rows[0]) { await connection.queryObject("COMMIT"); return null; }
      await recordAdminAudit(connection, userId, "SITE_SETTING_UPDATED", "SITE_SETTING", null, key);
      await connection.queryObject("COMMIT");
      const row = updated.rows[0];
      return {
        key: row.setting_key, value: row.setting_value,
        updatedBy: row.updated_by === null ? null : safeId(row.updated_by, "User ID"), updatedAt: row.updated_at,
      };
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },
  async getAdminTmdbQuality(authUser) {
    const { connection } = await beginAdminTransaction(authUser);
    try {
      const result = await connection.queryObject<{
        total_movies: string; tmdb_linked_movies: string; complete_tmdb_movies: string;
        missing_poster: string; missing_backdrop: string; missing_plot: string; missing_runtime: string;
        missing_trailer: string; missing_tmdb_rating: string; missing_original_language: string;
      }>({
        text: `SELECT COUNT(*)::text AS total_movies,
          COUNT(*) FILTER (WHERE m.tmdb_id IS NOT NULL)::text AS tmdb_linked_movies,
          COUNT(*) FILTER (WHERE m.tmdb_id IS NOT NULL
            AND NULLIF(TRIM(m.photo_url),'') IS NOT NULL AND NULLIF(TRIM(m.backdrop_url),'') IS NOT NULL
            AND NULLIF(TRIM(m.short_plot),'') IS NOT NULL AND m.duration_minutes IS NOT NULL
            AND LENGTH(TRIM(m.original_language)) = 2
            AND NULLIF(TRIM(m.trailer_url),'') IS NOT NULL
            AND EXISTS (SELECT 1 FROM rewind.external_ratings er WHERE er.movie_id=m.id AND er.source='TMDB'))::text AS complete_tmdb_movies,
          COUNT(*) FILTER (WHERE m.tmdb_id IS NOT NULL AND NULLIF(TRIM(m.photo_url),'') IS NULL)::text AS missing_poster,
          COUNT(*) FILTER (WHERE m.tmdb_id IS NOT NULL AND NULLIF(TRIM(m.backdrop_url),'') IS NULL)::text AS missing_backdrop,
          COUNT(*) FILTER (WHERE m.tmdb_id IS NOT NULL AND NULLIF(TRIM(m.short_plot),'') IS NULL)::text AS missing_plot,
          COUNT(*) FILTER (WHERE m.tmdb_id IS NOT NULL AND m.duration_minutes IS NULL)::text AS missing_runtime,
          COUNT(*) FILTER (WHERE m.tmdb_id IS NOT NULL AND NULLIF(TRIM(m.trailer_url),'') IS NULL)::text AS missing_trailer,
          COUNT(*) FILTER (WHERE m.tmdb_id IS NOT NULL
            AND NOT EXISTS (SELECT 1 FROM rewind.external_ratings er WHERE er.movie_id=m.id AND er.source='TMDB'))::text AS missing_tmdb_rating,
          COUNT(*) FILTER (WHERE m.tmdb_id IS NOT NULL
            AND (NULLIF(TRIM(m.original_language),'') IS NULL OR LENGTH(TRIM(m.original_language)) <> 2))::text AS missing_original_language
          FROM rewind.movies m`,
      });
      await connection.queryObject("COMMIT");
      const row = result.rows[0]!;
      const totalMovies = Number(row.total_movies);
      const tmdbLinkedMovies = Number(row.tmdb_linked_movies);
      const completeTmdbMovies = Number(row.complete_tmdb_movies);
      const percent = (value: number, total: number) => total === 0 ? 0 : Math.round(value * 1000 / total) / 10;
      return {
        totalMovies, tmdbLinkedMovies, completeTmdbMovies, missingPoster: Number(row.missing_poster),
        missingBackdrop: Number(row.missing_backdrop), missingPlot: Number(row.missing_plot),
        missingRuntime: Number(row.missing_runtime), missingTrailer: Number(row.missing_trailer),
        missingTmdbRating: Number(row.missing_tmdb_rating), missingOriginalLanguage: Number(row.missing_original_language),
        linkedCoveragePercent: percent(tmdbLinkedMovies, totalMovies),
        metadataCompletenessPercent: percent(completeTmdbMovies, tmdbLinkedMovies),
      } satisfies AdminTmdbQualityReport;
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },
  async syncAdminTmdbMovie(authUser, input) {
    return await syncOneTmdb(authUser, input.movieId, input.tmdbId, input.syncSimilar);
  },
  async searchAdminMovieTmdbCandidates(authUser, movieId) {
    const { connection } = await beginAdminTransaction(authUser);
    let movie: { title: string; release_date: string | null; imdb_id: string | null } | undefined;
    try {
      const result = await connection.queryObject<{ title: string; release_date: string | null; imdb_id: string | null }>({
        text: "SELECT title, release_date::text AS release_date, imdb_id FROM rewind.movies WHERE id=$1",
        args: [movieId],
      });
      movie = result.rows[0];
      await connection.queryObject("COMMIT");
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
    if (!movie) throw new RewindApiError(404, "Movie not found");
    const yearMatch = movie.release_date?.match(/^(\d{4})/);
    try {
      return await searchTmdbMovieCandidates({ imdbId: movie.imdb_id, title: movie.title, year: yearMatch ? Number(yearMatch[1]) : null }, tmdbApiKey, fetch, tmdbApiBaseUrl) as AdminTmdbMovieCandidate[];
    } catch (error) { return tmdbApiFailure(error); }
  },
  async syncAdminTmdbBatch(authUser, inputs, syncSimilar) {
    const items: AdminTmdbBatchResponse["items"] = [];
    for (const input of inputs) {
      try {
        const result = await syncOneTmdb(authUser, input.movieId, input.tmdbId, syncSimilar);
        items.push({ movieId: result.movieId, tmdbId: result.tmdbId, status: "SYNCED", title: result.title, message: "Movie metadata synchronized" });
      } catch (error) {
        items.push({ movieId: input.movieId, tmdbId: input.tmdbId, status: "FAILED", title: null, message: error instanceof Error ? error.message : "TMDB sync failed" });
      }
    }
    return batchResult(items);
  },
  async importAdminTmdb(authUser, tmdbIds, syncSimilar) {
    return await importTmdbIds(authUser, tmdbIds, syncSimilar);
  },
  async discoverAndImportAdminTmdb(authUser, input) {
    await assertTmdbAdmin(authUser);
    let discovered;
    try { discovered = await discoverTmdbMovies(input, tmdbApiKey, fetch, tmdbApiBaseUrl); } catch (error) { tmdbApiFailure(error); }
    const imports = await importTmdbIds(authUser, discovered.tmdbIds, input.syncSimilar);
    return { page: discovered.page, totalPages: discovered.totalPages, totalResults: discovered.totalResults,
      discovered: discovered.tmdbIds.length, imports } satisfies AdminTmdbDiscoveryResponse;
  },
  async getAdminMovies(authUser, query, page, size) {
    const { connection } = await beginAdminTransaction(authUser);
    try {
      const search = query?.trim() || null;
      const where = search === null ? "" : "WHERE POSITION(LOWER($1::text) IN LOWER(m.title)) > 0";
      const args = search === null ? [] : [search];
      const [count, rows] = await Promise.all([
        connection.queryObject<{ total: string }>({ text: `SELECT COUNT(*)::text AS total FROM rewind.movies m ${where}`, args }),
        connection.queryObject<{
          id: string; tmdb_id: string | null; title: string; release_date: string | null;
          rating: string | number | null; photo_url: string | null; duration_minutes: number | null;
          age_rating: string | null; review_count: string; is_published: boolean;
        }>({
          text: `SELECT m.id::text AS id, m.tmdb_id::text AS tmdb_id, m.title, m.release_date::text AS release_date,
                        m.rating::text AS rating, m.photo_url, m.duration_minutes, m.age_rating, m.is_published,
                        (SELECT COUNT(*)::text FROM rewind.reviews r
                         JOIN rewind.users author ON author.id = r.user_id AND author.is_active = TRUE
                         WHERE r.movie_id = m.id AND r.is_hidden = FALSE) AS review_count
                 FROM rewind.movies m ${where}
                 ORDER BY m.id DESC LIMIT $${args.length + 1} OFFSET $${args.length + 2}`,
          args: [...args, size, page * size],
        }),
      ]);
      await connection.queryObject("COMMIT");
      return pageResult(rows.rows.map(toAdminMovieCatalog), count.rows[0]?.total ?? "0", page, size);
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },
  async createAdminMovie(authUser, body: AdminMovieWriteRequest) {
    const { connection, userId } = await beginAdminTransaction(authUser);
    try {
      const result = await connection.queryObject<{
        id: string; tmdb_id: string | null; title: string; release_date: string | null;
        rating: string | number | null; photo_url: string | null; is_published: boolean;
      }>({
        text: `INSERT INTO rewind.movies (imdb_id,original_language,title,duration_minutes,release_date,age_rating,rating,short_plot,photo_url,backdrop_url,trailer_url)
               VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
               RETURNING id::text AS id, tmdb_id::text AS tmdb_id, title, release_date::text AS release_date, rating::text AS rating, photo_url, is_published`,
        args: [body.imdbId ?? null, body.originalLanguage ?? null, body.title, body.durationMinutes ?? null, body.releaseDate ?? null, body.ageRating ?? null,
          body.rating ?? null, body.shortPlot ?? null, body.photoUrl ?? null, body.backdropUrl ?? null, body.trailerUrl ?? null],
      });
      const movieId = parseSafeCount(result.rows[0]!.id);
      if (body.genreIds !== undefined) await replaceAdminMovieGenres(connection, movieId, body.genreIds);
      if (body.actorCredits !== undefined || body.directorIds !== undefined || body.producerIds !== undefined) {
        await replaceAdminMovieCredits(connection, movieId, body);
      }
      await recordAdminAudit(connection, userId, "MOVIE_CREATED", "MOVIE", movieId, buildAdminMovieAuditMetadata(body));
      await connection.queryObject("COMMIT");
      return toAdminMovie(result.rows[0]!);
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },
  async updateAdminMovie(authUser, id, body: AdminMovieWriteRequest) {
    const { connection, userId } = await beginAdminTransaction(authUser);
    try {
      const updateQuery = buildAdminMovieUpdateQuery(id, body);
      let result;
      if (updateQuery) {
        result = await connection.queryObject<{
          id: string; tmdb_id: string | null; title: string; release_date: string | null;
          rating: string | number | null; photo_url: string | null; is_published: boolean;
        }>({
          text: updateQuery.text,
          args: updateQuery.args,
        });
      } else {
        result = await connection.queryObject<{
          id: string; tmdb_id: string | null; title: string; release_date: string | null;
          rating: string | number | null; photo_url: string | null; is_published: boolean;
        }>({
          text: `SELECT id::text AS id, tmdb_id::text AS tmdb_id, title, release_date::text AS release_date,
                        rating::text AS rating, photo_url, is_published FROM rewind.movies WHERE id=$1`, args: [id],
        });
      }
      if (result.rows[0] && body.genreIds !== undefined) await replaceAdminMovieGenres(connection, id, body.genreIds);
      if (result.rows[0] && (body.actorCredits !== undefined || body.directorIds !== undefined || body.producerIds !== undefined)) {
        await replaceAdminMovieCredits(connection, id, body);
      }
      if (result.rows[0]) {
        const metadata = buildAdminMovieAuditMetadata(body);
        if (metadata) await recordAdminAudit(connection, userId, "MOVIE_UPDATED", "MOVIE", id, metadata);
      }
      await connection.queryObject("COMMIT");
      return result.rows[0] ? toAdminMovie(result.rows[0]) : null;
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },
  async deleteAdminMovie(authUser, id) {
    const { connection, userId } = await beginAdminTransaction(authUser);
    try {
      const result = await connection.queryObject({ text: "DELETE FROM rewind.movies WHERE id=$1 RETURNING id", args: [id] });
      if (result.rows.length > 0) await recordAdminAudit(connection, userId, "MOVIE_DELETED", "MOVIE", id, null);
      await connection.queryObject("COMMIT");
      return result.rows.length > 0;
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },
  async getAdminNotifications(authUser, filters, page, size) {
    const { connection } = await beginAdminTransaction(authUser);
    try {
      const predicates: string[] = [];
      const args: unknown[] = [];
      if (filters.type !== null) { args.push(filters.type); predicates.push(`n.notification_type=$${args.length}`); }
      if (filters.read !== null) predicates.push(`n.read_at IS ${filters.read ? "NOT " : ""}NULL`);
      if (filters.recipientId !== null) { args.push(filters.recipientId); predicates.push(`n.recipient_id=$${args.length}`); }
      const where = predicates.length ? ` WHERE ${predicates.join(" AND ")}` : "";
      const [count, rows] = await Promise.all([
        connection.queryObject<{ total: string }>({ text: `SELECT COUNT(*)::text AS total FROM rewind.notifications n${where}`, args }),
        connection.queryObject<{
          id: string; recipient_id: string; actor_id: string | null; type: AdminNotificationResponse["type"];
          review_id: string | null; created_at: string; read_at: string | null;
        }>({
          text: `SELECT n.id::text AS id, n.recipient_id::text AS recipient_id, n.actor_id::text AS actor_id,
                       n.notification_type AS type, n.review_id::text AS review_id,
                       n.created_at::text AS created_at, n.read_at::text AS read_at
                FROM rewind.notifications n${where} ORDER BY n.created_at DESC, n.id DESC
                LIMIT $${args.length + 1} OFFSET $${args.length + 2}`,
          args: [...args, size, page * size],
        }),
      ]);
      await connection.queryObject("COMMIT");
      return pageResult(rows.rows.map(toAdminNotification), count.rows[0]?.total ?? "0", page, size);
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },
  async createAdminNotification(authUser, body: AdminCreateNotificationRequest) {
    const { connection, userId } = await beginAdminTransaction(authUser);
    try {
      const userIds = [body.recipientId, body.actorId, body.relatedUserId].filter((value): value is number => value !== null && value !== undefined);
      const userResult = await connection.queryObject<{ id: string }>({
        text: "SELECT id::text AS id FROM rewind.users WHERE id=ANY($1::bigint[])", args: [userIds],
      });
      if (new Set(userResult.rows.map((row) => safeId(row.id, "User ID"))).size !== new Set(userIds).size) {
        throw new RewindApiError(400, "Notification user not found");
      }
      if (body.type === "REVIEW_LIKED") {
        const review = await connection.queryObject<{ user_id: string }>({
          text: "SELECT user_id::text AS user_id FROM rewind.reviews WHERE id=$1", args: [body.reviewId],
        });
        if (!review.rows[0] || safeId(review.rows[0].user_id, "User ID") !== body.recipientId) {
          throw new RewindApiError(400, "Review-like recipient must own the review");
        }
      }
      const result = await connection.queryObject<{
        id: string; recipient_id: string; actor_id: string | null; type: AdminNotificationResponse["type"];
        review_id: string | null; created_at: string; read_at: string | null;
      }>({
        text: `INSERT INTO rewind.notifications (recipient_id, actor_id, related_user_id, review_id, notification_type)
               VALUES ($1,$2,$3,$4,$5)
               RETURNING id::text AS id, recipient_id::text AS recipient_id, actor_id::text AS actor_id,
                 notification_type AS type, review_id::text AS review_id, created_at::text AS created_at, read_at::text AS read_at`,
        args: [body.recipientId, body.actorId, body.relatedUserId ?? null, body.reviewId ?? null, body.type],
      });
      const notification = result.rows[0];
      if (!notification) throw new Error("Admin notification was not created.");
      const response = toAdminNotification(notification);
      await recordAdminAudit(connection, userId, "NOTIFICATION_CREATED", "NOTIFICATION", response.id, null);
      await connection.queryObject("COMMIT");
      return response;
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },
  async setAdminNotificationRead(authUser, id, read) {
    const { connection, userId } = await beginAdminTransaction(authUser);
    try {
      const result = await connection.queryObject<{
        id: string; recipient_id: string; actor_id: string | null; type: AdminNotificationResponse["type"];
        review_id: string | null; created_at: string; read_at: string | null;
      }>({
        text: `UPDATE rewind.notifications SET read_at=CASE WHEN $2 THEN COALESCE(read_at,CURRENT_TIMESTAMP) ELSE NULL END
               WHERE id=$1 RETURNING id::text AS id, recipient_id::text AS recipient_id, actor_id::text AS actor_id,
                 notification_type AS type, review_id::text AS review_id, created_at::text AS created_at, read_at::text AS read_at`,
        args: [id, read],
      });
      if (!result.rows[0]) { await connection.queryObject("COMMIT"); return null; }
      const notification = toAdminNotification(result.rows[0]);
      await recordAdminAudit(connection, userId, read ? "NOTIFICATION_MARKED_READ" : "NOTIFICATION_MARKED_UNREAD", "NOTIFICATION", id, null);
      await connection.queryObject("COMMIT");
      return notification;
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },
  async markAdminNotificationsRead(authUser, type, recipientId) {
    const { connection, userId } = await beginAdminTransaction(authUser);
    try {
      const result = await connection.queryObject<{ id: string }>({
        text: `UPDATE rewind.notifications SET read_at=CURRENT_TIMESTAMP WHERE read_at IS NULL
                 AND ($1::text IS NULL OR notification_type=$1) AND ($2::bigint IS NULL OR recipient_id=$2) RETURNING id::text AS id`,
        args: [type, recipientId],
      });
      const updated = result.rows.length;
      await recordAdminAudit(connection, userId, "NOTIFICATIONS_MARKED_READ", "NOTIFICATION", null,
        `count=${updated};type=${type};recipientId=${recipientId}`);
      await connection.queryObject("COMMIT");
      return updated;
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },
  async deleteAdminNotification(authUser, id) {
    const { connection, userId } = await beginAdminTransaction(authUser);
    try {
      const result = await connection.queryObject<{ id: string }>({ text: "DELETE FROM rewind.notifications WHERE id=$1 RETURNING id::text AS id", args: [id] });
      if (!result.rows.length) { await connection.queryObject("COMMIT"); return false; }
      await recordAdminAudit(connection, userId, "NOTIFICATION_DELETED", "NOTIFICATION", id, null);
      await connection.queryObject("COMMIT");
      return true;
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },
  async deleteAdminNotifications(authUser, filters) {
    const { connection, userId } = await beginAdminTransaction(authUser);
    try {
      const result = await connection.queryObject<{ id: string }>({
        text: `DELETE FROM rewind.notifications WHERE ($1::text IS NULL OR notification_type=$1)
                 AND ($2::boolean IS NULL OR ($2 AND read_at IS NOT NULL) OR (NOT $2 AND read_at IS NULL))
                 AND ($3::bigint IS NULL OR recipient_id=$3) RETURNING id::text AS id`,
        args: [filters.type, filters.read, filters.recipientId],
      });
      const deleted = result.rows.length;
      await recordAdminAudit(connection, userId, "NOTIFICATIONS_BULK_DELETED", "NOTIFICATION", null,
        `count=${deleted};type=${filters.type};read=${filters.read};recipientId=${filters.recipientId}`);
      await connection.queryObject("COMMIT");
      return deleted;
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },
  async getAdminReviews(authUser, filters, page, size) {
    const { connection } = await beginAdminTransaction(authUser);
    try {
      const predicates: string[] = [];
      const args: unknown[] = [];
      // Preserve the Spring service's established filter semantics: movie/user
      // filters apply only together with hidden, while hidden alone is global.
      const { movieId, userId, hidden } = filters;
      if (movieId !== null && userId !== null && hidden !== null) {
        args.push(movieId, userId, hidden);
        predicates.push(`r.movie_id=$1 AND r.user_id=$2 AND r.is_hidden=$3`);
      } else if (movieId !== null && hidden !== null) {
        args.push(movieId, hidden);
        predicates.push(`r.movie_id=$1 AND r.is_hidden=$2`);
      } else if (userId !== null && hidden !== null) {
        args.push(userId, hidden);
        predicates.push(`r.user_id=$1 AND r.is_hidden=$2`);
      } else if (hidden !== null) {
        args.push(hidden);
        predicates.push(`r.is_hidden=$1`);
      }
      const where = predicates.length ? ` WHERE ${predicates.join(" AND ")}` : "";
      const [count, rows] = await Promise.all([
        connection.queryObject<{ total: string }>({ text: `SELECT COUNT(*)::text AS total FROM rewind.reviews r${where}`, args }),
        connection.queryObject<Parameters<typeof toAdminReview>[0]>({
          text: `SELECT r.id::text AS id, r.movie_id::text AS movie_id, m.title AS movie_title,
                       r.user_id::text AS user_id, u.username, r.content, r.rating::int AS rating, r.is_hidden,
                       r.moderated_reason, r.moderated_at::text AS moderated_at, r.created_at::text AS created_at
                FROM rewind.reviews r JOIN rewind.movies m ON m.id=r.movie_id JOIN rewind.users u ON u.id=r.user_id${where}
                ORDER BY r.id DESC LIMIT $${args.length + 1} OFFSET $${args.length + 2}`,
          args: [...args, size, page * size],
        }),
      ]);
      await connection.queryObject("COMMIT");
      return pageResult(rows.rows.map(toAdminReview), count.rows[0]?.total ?? "0", page, size);
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },
  async getAdminReportedReviews(authUser, page, size): Promise<{ content: AdminReportedReviewResponse[]; totalPages: number; totalElements: number; number: number }> {
    const { connection } = await beginAdminTransaction(authUser);
    try {
      const [count, rows] = await Promise.all([
        connection.queryObject<{ total: string }>({ text: "SELECT COUNT(*)::text AS total FROM rewind.review_reports WHERE status='OPEN'" }),
        connection.queryObject<{
          report_id: string; report_reason: string; report_created_at: string;
          id: string; movie_id: string; movie_title: string; user_id: string; username: string; content: string;
          rating: number | null; is_hidden: boolean; moderated_reason: string | null; moderated_at: string | null; created_at: string;
          likes_count: string; comments_count: string;
        }>({
          text: `SELECT rr.id::text AS report_id, rr.reason AS report_reason, rr.created_at::text AS report_created_at,
                       r.id::text AS id, r.movie_id::text AS movie_id, m.title AS movie_title,
                       r.user_id::text AS user_id, u.username, r.content, r.rating::int AS rating, r.is_hidden,
                       r.moderated_reason, r.moderated_at::text AS moderated_at, r.created_at::text AS created_at,
                       (SELECT COUNT(*)::text FROM rewind.review_likes rl WHERE rl.review_id=r.id) AS likes_count,
                       (SELECT COUNT(*)::text FROM rewind.comments c WHERE c.review_id=r.id AND c.is_hidden=FALSE) AS comments_count
                FROM rewind.review_reports rr
                JOIN rewind.reviews r ON r.id=rr.review_id
                JOIN rewind.movies m ON m.id=r.movie_id
                JOIN rewind.users u ON u.id=r.user_id
                WHERE rr.status='OPEN'
                ORDER BY rr.created_at DESC, rr.id DESC
                LIMIT $1 OFFSET $2`, args: [size, page * size],
        }),
      ]);
      const content = rows.rows.map(row => ({
        ...toAdminReview(row), reportId: safeId(row.report_id, "Report ID"),
        reportReason: row.report_reason as ReviewReportReason, reportCreatedAt: row.report_created_at,
        likesCount: Number(row.likes_count), commentsCount: Number(row.comments_count),
      }));
      await connection.queryObject("COMMIT");
      return pageResult(content, count.rows[0]?.total ?? "0", page, size);
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },
  async dismissAdminReviewReport(authUser, reportId): Promise<boolean> {
    const { connection, userId } = await beginAdminTransaction(authUser);
    try {
      const updated = await connection.queryObject<{ id: string }>({
        text: `UPDATE rewind.review_reports
               SET status='DISMISSED', reviewed_at=CURRENT_TIMESTAMP, reviewed_by=$2
               WHERE id=$1 AND status='OPEN'
               RETURNING id::text AS id`, args: [reportId, userId],
      });
      if (updated.rows.length) {
        await recordAdminAudit(connection, userId, "REVIEW_REPORT_DISMISSED", "REVIEW_REPORT", reportId, null);
      }
      await connection.queryObject("COMMIT");
      return updated.rows.length > 0;
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },
  async setAdminReviewHidden(authUser, id, hidden, reason) {
    const { connection, userId } = await beginAdminTransaction(authUser);
    try {
      await setReviewModeration(connection, userId, id, hidden, reason);
      const result = await connection.queryObject<Parameters<typeof toAdminReview>[0]>({
        text: `SELECT r.id::text AS id, r.movie_id::text AS movie_id, m.title AS movie_title,
                     r.user_id::text AS user_id, u.username, r.content, r.rating::int AS rating, r.is_hidden,
                     r.moderated_reason, r.moderated_at::text AS moderated_at, r.created_at::text AS created_at
              FROM rewind.reviews r JOIN rewind.movies m ON m.id=r.movie_id JOIN rewind.users u ON u.id=r.user_id
              WHERE r.id=$1`, args: [id],
      });
      await connection.queryObject("COMMIT");
      return result.rows[0] ? toAdminReview(result.rows[0]) : null;
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },
  async deleteAdminReview(authUser, id) {
    const { connection, userId } = await beginAdminTransaction(authUser);
    try {
      const result = await connection.queryObject<{ id: string }>({ text: "DELETE FROM rewind.reviews WHERE id=$1 RETURNING id", args: [id] });
      if (result.rows.length > 0) await recordAdminAudit(connection, userId, "REVIEW_DELETED", "REVIEW", id, null);
      await connection.queryObject("COMMIT");
      return result.rows.length > 0;
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },
  async getAdminComments(authUser, hidden, page, size) {
    const { connection } = await beginAdminTransaction(authUser);
    try {
      const where = hidden === null ? "" : " WHERE c.is_hidden=$1";
      const args = hidden === null ? [] : [hidden];
      const [count, rows] = await Promise.all([
        connection.queryObject<{ total: string }>({ text: `SELECT COUNT(*)::text AS total FROM rewind.comments c${where}`, args }),
        connection.queryObject<Parameters<typeof toAdminComment>[0]>({
          text: `SELECT c.id::text AS id, c.review_id::text AS review_id, c.user_id::text AS user_id,
                       u.username, c.content, c.is_hidden, c.moderated_reason,
                       c.moderated_at::text AS moderated_at, c.created_at::text AS created_at
                FROM rewind.comments c JOIN rewind.users u ON u.id=c.user_id${where}
                ORDER BY c.id DESC LIMIT $${args.length + 1} OFFSET $${args.length + 2}`,
          args: [...args, size, page * size],
        }),
      ]);
      await connection.queryObject("COMMIT");
      return pageResult(rows.rows.map(toAdminComment), count.rows[0]?.total ?? "0", page, size);
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },
  async setAdminCommentHidden(authUser, id, hidden, reason) {
    const { connection, userId } = await beginAdminTransaction(authUser);
    try {
      await setCommentModeration(connection, userId, id, hidden, reason);
      const result = await connection.queryObject<Parameters<typeof toAdminComment>[0]>({
        text: `SELECT c.id::text AS id, c.review_id::text AS review_id, c.user_id::text AS user_id,
                     u.username, c.content, c.is_hidden, c.moderated_reason,
                     c.moderated_at::text AS moderated_at, c.created_at::text AS created_at
              FROM rewind.comments c JOIN rewind.users u ON u.id=c.user_id WHERE c.id=$1`, args: [id],
      });
      await connection.queryObject("COMMIT");
      return result.rows[0] ? toAdminComment(result.rows[0]) : null;
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },
  async deleteAdminComment(authUser, id) {
    const { connection, userId } = await beginAdminTransaction(authUser);
    try {
      const result = await connection.queryObject<{ id: string }>({ text: "DELETE FROM rewind.comments WHERE id=$1 RETURNING id", args: [id] });
      if (result.rows.length > 0) await recordAdminAudit(connection, userId, "COMMENT_DELETED", "COMMENT", id, null);
      await connection.queryObject("COMMIT");
      return result.rows.length > 0;
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },
  async getAdminModerationQueue(authUser, type, query, page, size) {
    const { connection } = await beginAdminTransaction(authUser);
    try {
      const search = query?.trim() || null;
      const candidates = `
        SELECT 'REVIEW'::text AS type, r.id, NULL::bigint AS parent_id, r.movie_id,
               m.title AS subject, r.user_id, u.username, r.content, r.created_at
        FROM rewind.reviews r JOIN rewind.users u ON u.id=r.user_id JOIN rewind.movies m ON m.id=r.movie_id
        WHERE r.moderated_at IS NULL
        UNION ALL
        SELECT 'COMMENT'::text AS type, c.id, c.review_id AS parent_id, NULL::bigint AS movie_id,
               ('Review #' || c.review_id)::text AS subject, c.user_id, u.username, c.content, c.created_at
        FROM rewind.comments c JOIN rewind.users u ON u.id=c.user_id
        WHERE c.moderated_at IS NULL`;
      const predicates = ["($1::text IS NULL OR queued.type=$1)",
        "($2::text IS NULL OR lower(queued.content) LIKE '%' || lower($2) || '%' OR lower(queued.username) LIKE '%' || lower($2) || '%')"];
      const [count, rows] = await Promise.all([
        connection.queryObject<{ total: string }>({ text: `SELECT COUNT(*)::text AS total FROM (${candidates}) queued WHERE ${predicates.join(" AND ")}`, args: [type, search] }),
        connection.queryObject<{
          type: "REVIEW" | "COMMENT"; id: string; parent_id: string | null; movie_id: string | null;
          subject: string; user_id: string; username: string; content: string; created_at: string;
        }>({
          text: `SELECT queued.type, queued.id::text AS id, queued.parent_id::text AS parent_id,
                        queued.movie_id::text AS movie_id, queued.subject, queued.user_id::text AS user_id,
                        queued.username, queued.content, queued.created_at::text AS created_at
                 FROM (${candidates}) queued WHERE ${predicates.join(" AND ")}
                 ORDER BY queued.created_at, queued.type, queued.id LIMIT $3 OFFSET $4`,
          args: [type, search, size, page * size],
        }),
      ]);
      await connection.queryObject("COMMIT");
      return pageResult(rows.rows.map(toAdminModerationQueueItem), count.rows[0]?.total ?? "0", page, size);
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },
  async hideAdminModerationItem(authUser, type, id, reason) {
    const { connection, userId } = await beginAdminTransaction(authUser);
    try {
      if (type === "REVIEW") await setReviewModeration(connection, userId, id, true, reason);
      else await setCommentModeration(connection, userId, id, true, reason);
      await connection.queryObject("COMMIT");
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },
  async bulkHideAdminModeration(authUser, items: AdminModerationTarget[], reason) {
    const { connection, userId } = await beginAdminTransaction(authUser);
    try {
      for (const item of items) {
        const type = item.type.trim().toUpperCase();
        if (type === "REVIEW") await setReviewModeration(connection, userId, item.id, true, reason);
        else if (type === "COMMENT") await setCommentModeration(connection, userId, item.id, true, reason);
        else throw new RewindApiError(400, "Unsupported moderation item type");
      }
      await connection.queryObject("COMMIT");
      return items.length;
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },
  async getJournal(language, category, year, month, page, size) {
    const connection = await pool.connect();
    try {
      await connection.queryObject("SET ROLE rewind_edge_app");
      const fallback = language === "en" ? "uk" : "en";
      const predicates = [`a.is_published = TRUE`, `(a.language = $1 OR (a.language = $2 AND NOT EXISTS (
        SELECT 1 FROM rewind.journal_articles preferred WHERE preferred.slug = a.slug
          AND preferred.language = $1 AND preferred.is_published = TRUE)) )`];
      const args: unknown[] = [language, fallback];
      if (category !== null) { args.push(category); predicates.push(`a.category = $${args.length}`); }
      if (year !== null && month !== null) {
        const from = new Date(Date.UTC(year, month - 1, 1)).toISOString();
        const to = new Date(Date.UTC(year, month, 1)).toISOString();
        args.push(from, to);
        predicates.push(`a.published_at >= $${args.length - 1}::timestamptz AND a.published_at < $${args.length}::timestamptz`);
      }
      const where = predicates.join(" AND ");
      const [count, rows] = await Promise.all([
        connection.queryObject<{ total: string }>({ text: `SELECT COUNT(*)::text AS total FROM rewind.journal_articles a WHERE ${where}`, args }),
        connection.queryObject<{
          id: string; slug: string; language: string; category: string; title: string; excerpt: string | null;
          content: string; cover_url: string | null; audio_url: string | null; published_at: string | null;
        }>({
          text: `SELECT a.id::text AS id, a.slug, a.language, a.category, a.title, a.excerpt, a.content,
                       a.cover_url, a.audio_url, a.published_at::text AS published_at
                FROM rewind.journal_articles a WHERE ${where}
                ORDER BY a.published_at DESC, a.id DESC LIMIT $${args.length + 1} OFFSET $${args.length + 2}`,
          args: [...args, size, page * size],
        }),
      ]);
      return pageResult(rows.rows.map(toJournalArticle), count.rows[0]?.total ?? "0", page, size);
    } finally { connection.release(); }
  },
  async getJournalArchive(language): Promise<JournalArchiveEntry[]> {
    const connection = await pool.connect();
    try {
      await connection.queryObject("SET ROLE rewind_edge_app");
      const fallback = language === "en" ? "uk" : "en";
      const result = await connection.queryObject<{ year: number; month: number; article_count: string }>({
        text: `SELECT EXTRACT(YEAR FROM a.published_at AT TIME ZONE 'UTC')::int AS year,
                      EXTRACT(MONTH FROM a.published_at AT TIME ZONE 'UTC')::int AS month,
                      COUNT(*)::text AS article_count
               FROM rewind.journal_articles a
               WHERE a.is_published = TRUE AND a.published_at IS NOT NULL
                 AND (a.language = $1 OR (a.language = $2 AND NOT EXISTS (
                   SELECT 1 FROM rewind.journal_articles preferred WHERE preferred.slug = a.slug
                     AND preferred.language = $1 AND preferred.is_published = TRUE)))
               GROUP BY 1, 2 ORDER BY 1 DESC, 2 DESC`, args: [language, fallback],
      });
      return result.rows.map((row) => ({ year: row.year, month: row.month, articleCount: Number(row.article_count) }));
    } finally { connection.release(); }
  },
  async getJournalArticle(language, slug) {
    const connection = await pool.connect();
    try {
      await connection.queryObject("SET ROLE rewind_edge_app");
      const fallback = language === "en" ? "uk" : "en";
      const result = await connection.queryObject<{
        id: string; slug: string; language: string; category: string; title: string; excerpt: string | null;
        content: string; cover_url: string | null; audio_url: string | null; published_at: string | null;
      }>({
        text: `SELECT id::text AS id, slug, language, category, title, excerpt, content, cover_url, audio_url, published_at::text AS published_at
               FROM rewind.journal_articles WHERE slug = $1 AND is_published = TRUE AND language IN ($2, $3)
               ORDER BY CASE WHEN language = $2 THEN 0 ELSE 1 END LIMIT 1`, args: [slug, language, fallback],
      });
      return result.rows[0] ? toJournalArticle(result.rows[0]) : null;
    } finally { connection.release(); }
  },
  async getNewsletterSubscription(authUser) {
    const { connection, userId } = await beginUserTransaction(authUser);
    try {
      const result = await connection.queryObject<{ is_subscribed: boolean }>({
        text: "SELECT is_subscribed FROM rewind.newsletter_subscriptions WHERE user_id = $1", args: [userId],
      });
      await connection.queryObject("COMMIT");
      return { subscribed: result.rows[0]?.is_subscribed ?? false };
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },
  async updateNewsletterSubscription(authUser, subscribed) {
    const { connection, userId } = await beginUserTransaction(authUser);
    try {
      await connection.queryObject({
        text: `INSERT INTO rewind.newsletter_subscriptions (user_id, is_subscribed, subscribed_at)
               VALUES ($1, $2, CASE WHEN $2 THEN CURRENT_TIMESTAMP ELSE NULL END)
               ON CONFLICT (user_id) DO UPDATE SET is_subscribed = EXCLUDED.is_subscribed,
                 subscribed_at = EXCLUDED.subscribed_at`, args: [userId, subscribed],
      });
      await connection.queryObject("COMMIT");
      return { subscribed };
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },
  async listGenres(): Promise<GenreResponse[]> {
    const connection = await pool.connect();
    try {
      await connection.queryObject("SET ROLE rewind_edge_reader");
      const result = await connection.queryObject<{ id: string; name: string }>`
        SELECT id::text AS id, name
        FROM rewind.genres
        ORDER BY name ASC
      `;
      return result.rows.map(({ id, name }) => {
        const numericId = Number(id);
        if (!Number.isSafeInteger(numericId)) {
          throw new Error("Genre ID is outside the safe JSON integer range");
        }
        return { id: numericId, name };
      });
    } finally {
      connection.release();
    }
  },
  async getPopularTags(size): Promise<PopularTagResponse[]> {
    const connection = await pool.connect();
    try {
      await connection.queryObject("SET ROLE rewind_edge_app");
      const result = await connection.queryObject<{ id: string; name: string; slug: string }>({
        text: `SELECT t.id::text AS id, t.name, t.slug
               FROM rewind.tags t JOIN rewind.list_tags lt ON lt.tag_id = t.id
               JOIN rewind.lists l ON l.id = lt.list_id
               WHERE l.is_public = TRUE AND l.list_type = 'CUSTOM'
               GROUP BY t.id, t.name, t.slug
               ORDER BY COUNT(l.id) DESC, t.name ASC, t.id ASC
               LIMIT $1`,
        args: [size],
      });
      return result.rows.map((row) => {
        const id = Number(row.id);
        if (!Number.isSafeInteger(id) || id <= 0) throw new Error("Tag ID is outside the safe JSON integer range.");
        return { id, name: row.name, slug: row.slug };
      });
    } finally { connection.release(); }
  },
  async getPublicProfile(userId): Promise<PublicProfileResponse | null> {
    const connection = await pool.connect();
    try {
      await connection.queryObject("SET ROLE rewind_edge_app");
      const userResult = await connection.queryObject<{
        id: string; username: string; display_name: string | null; avatar_url: string | null; bio: string | null; is_hq: boolean;
      }>({
        text: "SELECT id::text AS id, username, display_name, avatar_url, bio, is_hq FROM rewind.users WHERE id = $1 AND is_active",
        args: [userId],
      });
      const user = userResult.rows[0];
      if (!user) return null;
      const [counts, distribution, lists, reviews, socialLinks] = await Promise.all([
        connection.queryObject<{ ratings: string; reviews: string; watched: string; watchlist: string; favorites: string }>({
          text: `SELECT
            (SELECT COUNT(*)::text FROM rewind.ratings WHERE user_id = $1) AS ratings,
            (SELECT COUNT(*)::text FROM rewind.reviews WHERE user_id = $1 AND NOT is_hidden) AS reviews,
            (SELECT COUNT(*)::text FROM rewind.list_items i JOIN rewind.lists l ON l.id = i.list_id WHERE l.user_id = $1 AND l.list_type = 'WATCHED') AS watched,
            (SELECT COUNT(*)::text FROM rewind.list_items i JOIN rewind.lists l ON l.id = i.list_id WHERE l.user_id = $1 AND l.list_type = 'WATCHLIST') AS watchlist,
            (SELECT COUNT(*)::text FROM rewind.list_items i JOIN rewind.lists l ON l.id = i.list_id WHERE l.user_id = $1 AND l.list_type = 'FAVORITES') AS favorites`, args: [userId],
        }),
        connection.queryObject<{ rating: number; count: string }>({
          text: "SELECT rating, COUNT(*)::text AS count FROM rewind.ratings WHERE user_id = $1 GROUP BY rating ORDER BY rating",
          args: [userId],
        }),
        connection.queryObject<{ id: string; name: string; description: string | null }>({
          text: `SELECT id::text AS id, name, description FROM rewind.lists
                 WHERE user_id = $1 AND list_type = 'CUSTOM' AND is_public
                 ORDER BY updated_at DESC, id DESC`, args: [userId],
        }),
        connection.queryObject<{ id: string; movie_id: string; movie_title: string; content: string; rating: number | null; updated_at: string }>({
          text: `SELECT r.id::text AS id, r.movie_id::text AS movie_id, m.title AS movie_title,
                        r.content, r.rating, r.updated_at::text AS updated_at
                 FROM rewind.reviews r JOIN rewind.movies m ON m.id = r.movie_id
                 WHERE r.user_id = $1 AND NOT r.is_hidden
                 ORDER BY r.updated_at DESC, r.id DESC LIMIT 10`, args: [userId],
        }),
        connection.queryObject<{ platform: string; url: string }>({
          text: "SELECT platform, url FROM rewind.user_social_links WHERE user_id = $1 ORDER BY platform", args: [userId],
        }),
      ]);
      const stats = counts.rows[0];
      return {
        id: safeId(user.id, "User ID"), username: user.username,
        displayName: user.display_name?.trim() || user.username, avatarUrl: user.avatar_url, bio: user.bio, hq: user.is_hq,
        stats: {
          ratings: Number(stats?.ratings ?? 0), reviews: Number(stats?.reviews ?? 0),
          watched: Number(stats?.watched ?? 0), watchlist: Number(stats?.watchlist ?? 0), favorites: Number(stats?.favorites ?? 0),
        },
        ratingDistribution: distribution.rows.map((row) => ({ rating: row.rating, count: Number(row.count) })),
        socialLinks: socialLinks.rows,
        lists: lists.rows.map((row) => ({ id: safeId(row.id, "List ID"), name: row.name, description: row.description })),
        recentReviews: reviews.rows.map((row) => ({
          id: safeId(row.id, "Review ID"), movieId: safeId(row.movie_id, "Movie ID"), movieTitle: row.movie_title,
          content: row.content, rating: row.rating, updatedAt: row.updated_at,
        })),
      };
    } finally { connection.release(); }
  },
  async getPublicProfileCollection(userId, collection, page, size) {
    const listType = collection.toUpperCase();
    const connection = await pool.connect();
    try {
      await connection.queryObject("SET ROLE rewind_edge_app");
      const user = await connection.queryObject({ text: "SELECT 1 FROM rewind.users WHERE id = $1 AND is_active", args: [userId] });
      if (!user.rows.length) return null;
      const list = await connection.queryObject<{ id: string }>({
        text: "SELECT id::text AS id FROM rewind.lists WHERE user_id = $1 AND list_type = $2 ORDER BY id LIMIT 1",
        args: [userId, listType],
      });
      if (!list.rows[0]) return { content: [], totalPages: 0, totalElements: 0, number: page };
      const listId = safeId(list.rows[0].id, "List ID");
      const [count, movies] = await Promise.all([
        connection.queryObject<{ total: string }>({ text: "SELECT COUNT(*)::text AS total FROM rewind.list_items WHERE list_id = $1", args: [listId] }),
        connection.queryObject<{ id: string; title: string; release_date: string | null; rating: string | null; photo_url: string | null }>({
          text: `SELECT m.id::text AS id, m.title, m.release_date::text AS release_date, m.rating::text AS rating, m.photo_url
                 FROM rewind.list_items i JOIN rewind.movies m ON m.id = i.movie_id
                 WHERE i.list_id = $1 ORDER BY i.added_at DESC, i.id DESC LIMIT $2 OFFSET $3`,
          args: [listId, size, page * size],
        }),
      ]);
      return pageResult(movies.rows.map((movie) => ({
        id: safeId(movie.id, "Movie ID"), title: movie.title, releaseDate: movie.release_date,
        rating: movie.rating === null ? null : Number(movie.rating), photoUrl: movie.photo_url,
      })), count.rows[0]?.total ?? "0", page, size);
    } finally { connection.release(); }
  },
  async getPublicProfileLists(userId, page, size) {
    const connection = await pool.connect();
    try {
      await connection.queryObject("SET ROLE rewind_edge_app");
      const active = await connection.queryObject({ text: "SELECT 1 FROM rewind.users WHERE id = $1 AND is_active", args: [userId] });
      if (!active.rows.length) return null;
      const count = await connection.queryObject<{ total: string }>({
        text: "SELECT COUNT(*)::text AS total FROM rewind.lists WHERE user_id = $1 AND list_type = 'CUSTOM' AND is_public", args: [userId],
      });
      const rows = await connection.queryObject<{
        id: string; name: string; description: string | null; owner_username: string; owner_avatar_url: string | null;
      }>({
        text: `SELECT l.id::text AS id, l.name, l.description, u.username AS owner_username, u.avatar_url AS owner_avatar_url
               FROM rewind.lists l JOIN rewind.users u ON u.id = l.user_id
               WHERE l.user_id = $1 AND l.list_type = 'CUSTOM' AND l.is_public AND u.is_active
               ORDER BY l.updated_at DESC, l.id DESC LIMIT $2 OFFSET $3`, args: [userId, size, page * size],
      });
      const ids = rows.rows.map((row) => safeId(row.id, "List ID"));
      const [tags, counts, previews, likes] = await Promise.all([
        loadListTags(connection, ids),
        ids.length ? connection.queryObject<{ list_id: string; total: string }>({
          text: "SELECT list_id::text AS list_id, COUNT(*)::text AS total FROM rewind.list_items WHERE list_id = ANY($1::bigint[]) GROUP BY list_id", args: [ids],
        }) : Promise.resolve({ rows: [] as { list_id: string; total: string }[] }),
        ids.length ? connection.queryObject<{ list_id: string; id: string; title: string; release_date: string | null; rating: string | null; photo_url: string | null }>({
          text: `SELECT list_id::text AS list_id, id::text AS id, title, release_date::text AS release_date,
                        rating::text AS rating, photo_url FROM (
                   SELECT i.list_id, m.id, m.title, m.release_date, m.rating, m.photo_url,
                          ROW_NUMBER() OVER (PARTITION BY i.list_id ORDER BY i.position NULLS LAST, i.id) AS rn
                   FROM rewind.list_items i JOIN rewind.movies m ON m.id = i.movie_id
                   WHERE i.list_id = ANY($1::bigint[])
                 ) ranked WHERE rn <= 3 ORDER BY list_id, rn`, args: [ids],
        }) : Promise.resolve({ rows: [] as { list_id: string; id: string; title: string; release_date: string | null; rating: string | null; photo_url: string | null }[] }),
        ids.length ? connection.queryObject<{ list_id: string; total: string }>({
          text: `SELECT list_id::text AS list_id, COUNT(*)::text AS total FROM rewind.list_likes ll
                 JOIN rewind.users liker ON liker.id = ll.user_id AND liker.is_active
                 WHERE list_id = ANY($1::bigint[]) GROUP BY list_id`, args: [ids],
        }) : Promise.resolve({ rows: [] as { list_id: string; total: string }[] }),
      ]);
      const itemCounts = new Map(counts.rows.map((row) => [safeId(row.list_id, "List ID"), Number(row.total)]));
      const likeCounts = new Map(likes.rows.map((row) => [safeId(row.list_id, "List ID"), Number(row.total)]));
      const previewMap = new Map<number, MovieCardResponse[]>();
      for (const movie of previews.rows) {
        const id = safeId(movie.list_id, "List ID");
        const list = previewMap.get(id) ?? [];
        list.push({ id: safeId(movie.id, "Movie ID"), title: movie.title, releaseDate: movie.release_date,
          rating: movie.rating === null ? null : Number(movie.rating), photoUrl: movie.photo_url });
        previewMap.set(id, list);
      }
      const content: PublicListCardResponse[] = rows.rows.map((row) => {
        const id = safeId(row.id, "List ID");
        return { id, name: row.name, description: row.description, isPublic: true, ownerId: userId,
          ownerUsername: row.owner_username, ownerAvatarUrl: row.owner_avatar_url, tags: tags.get(id) ?? [],
          likeCount: likeCounts.get(id) ?? 0, itemCount: itemCounts.get(id) ?? 0, previewMovies: previewMap.get(id) ?? [] };
      });
      return pageResult(content, count.rows[0]?.total ?? "0", page, size);
    } finally { connection.release(); }
  },
  async getPublicProfileLikedReviews(userId, page, size) {
    const connection = await pool.connect();
    try {
      await connection.queryObject("SET ROLE rewind_edge_app");
      const active = await connection.queryObject({ text: "SELECT 1 FROM rewind.users WHERE id = $1 AND is_active", args: [userId] });
      if (!active.rows.length) return null;
      const [count, rows] = await Promise.all([
        connection.queryObject<{ total: string }>({
          text: `SELECT COUNT(*)::text AS total FROM rewind.review_likes rl
                 JOIN rewind.reviews r ON r.id = rl.review_id AND NOT r.is_hidden
                 JOIN rewind.users author ON author.id = r.user_id AND author.is_active
                 WHERE rl.user_id = $1`, args: [userId],
        }),
        connection.queryObject<{ id: string; movie_id: string; movie_title: string; content: string; rating: number | null; updated_at: string }>({
          text: `SELECT r.id::text AS id, r.movie_id::text AS movie_id, m.title AS movie_title,
                        r.content, r.rating, r.updated_at::text AS updated_at
                 FROM rewind.review_likes rl JOIN rewind.reviews r ON r.id = rl.review_id AND NOT r.is_hidden
                 JOIN rewind.users author ON author.id = r.user_id AND author.is_active
                 JOIN rewind.movies m ON m.id = r.movie_id
                 WHERE rl.user_id = $1 ORDER BY rl.created_at DESC, rl.id DESC LIMIT $2 OFFSET $3`, args: [userId, size, page * size],
        }),
      ]);
      return pageResult(rows.rows.map((row) => ({ id: safeId(row.id, "Review ID"), movieId: safeId(row.movie_id, "Movie ID"),
        movieTitle: row.movie_title, content: row.content, rating: row.rating, updatedAt: row.updated_at })), count.rows[0]?.total ?? "0", page, size);
    } finally { connection.release(); }
  },
  async getFollowers(userId, page, size) { return readFollowPage(userId, page, size, false); },
  async getFollowing(userId, page, size) { return readFollowPage(userId, page, size, true); },
  async getUserActivity(userId, page, size) { return readActivityPage(userId, page, size); },
  async getFollowingActivity(authUser, page, size) {
    const { connection, userId } = await beginUserTransaction(authUser);
    try {
      const result = await queryActivityPage(connection, "a.user_id = ANY($1::bigint[])", [
        (await connection.queryObject<{ id: string }>({
          text: "SELECT following_id::text AS id FROM rewind.follows WHERE follower_id = $1 ORDER BY following_id", args: [userId],
        })).rows.map((row) => safeId(row.id, "User ID")),
      ], page, size);
      await connection.queryObject("COMMIT");
      return result;
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },
  async getRecentWatched(size) {
    const connection = await pool.connect();
    try {
      await connection.queryObject("SET ROLE rewind_edge_app");
      const [count, rows] = await Promise.all([
        connection.queryObject<{ total: string }>({
          text: `SELECT COUNT(*)::text AS total FROM rewind.user_activities a
                 JOIN rewind.users u ON u.id = a.user_id AND u.is_active WHERE a.activity_type = 'WATCHED'`,
        }),
        connection.queryObject<{ id: string; created_at: string; actor_id: string | null; username: string | null; display_name: string | null; movie_id: string | null; title: string | null }>({
          text: `SELECT a.id::text AS id, a.created_at::text AS created_at, u.id::text AS actor_id,
                        u.username, u.display_name, m.id::text AS movie_id, m.title
                 FROM rewind.user_activities a JOIN rewind.users u ON u.id = a.user_id AND u.is_active
                 LEFT JOIN rewind.movies m ON m.id = a.movie_id
                 WHERE a.activity_type = 'WATCHED'
                 ORDER BY a.created_at DESC, a.id DESC LIMIT $1`, args: [size],
        }),
      ]);
      const totalElements = Number(count.rows[0]?.total ?? "0");
      return { content: rows.rows.map((row) => ({ id: safeId(row.id, "Activity ID"), createdAt: row.created_at,
        actor: row.actor_id && row.username ? { id: safeId(row.actor_id, "User ID"), username: row.username,
          displayName: row.display_name?.trim() || row.username } : null,
        movie: row.movie_id && row.title ? { id: safeId(row.movie_id, "Movie ID"), title: row.title } : null })),
        totalPages: Math.ceil(totalElements / size), totalElements, number: 0 };
    } finally { connection.release(); }
  },
  async getPopularReviewers(size): Promise<PopularReviewerResponse[]> {
    const connection = await pool.connect();
    try {
      await connection.queryObject("SET ROLE rewind_edge_app");
      const rows = await connection.queryObject<{
        id: string; username: string; display_name: string | null; avatar_url: string | null; likes: string;
        review_count: string; watched_count: string; list_count: string;
      }>({
        text: `SELECT u.id::text AS id, u.username, u.display_name, u.avatar_url, COUNT(rl.id)::text AS likes,
                      (SELECT COUNT(*) FROM rewind.reviews r WHERE r.user_id = u.id AND NOT r.is_hidden)::text AS review_count,
                      (SELECT COUNT(*) FROM rewind.list_items i JOIN rewind.lists l ON l.id = i.list_id WHERE l.user_id = u.id AND l.list_type = 'WATCHED')::text AS watched_count,
                      (SELECT COUNT(*) FROM rewind.lists l WHERE l.user_id = u.id AND l.list_type = 'CUSTOM')::text AS list_count
               FROM rewind.review_likes rl JOIN rewind.reviews r ON r.id = rl.review_id AND NOT r.is_hidden
               JOIN rewind.users u ON u.id = r.user_id AND u.is_active
               JOIN rewind.users liker ON liker.id = rl.user_id AND liker.is_active
               GROUP BY u.id, u.username, u.display_name, u.avatar_url
               ORDER BY COUNT(rl.id) DESC, u.id DESC LIMIT $1`, args: [size],
      });
      return rows.rows.map((row) => ({ ...toPublicUser(row), likes: Number(row.likes), reviewCount: Number(row.review_count),
        watchedCount: Number(row.watched_count), listCount: Number(row.list_count) }));
    } finally { connection.release(); }
  },
  async getHqUsers(page, size) { return readUsersPage("u.is_hq = TRUE", [], page, size, "u.created_at DESC, u.id DESC"); },
  async getDirectoryUsers(query, page, size) {
    const term = query?.toLowerCase() || null;
    return readUsersPage("($1::text IS NULL OR POSITION($1 IN LOWER(u.username)) > 0 OR POSITION($1 IN LOWER(COALESCE(u.display_name, ''))) > 0)", [term], page, size, "u.username ASC, u.id ASC");
  },
  async getPublicUser(userId) {
    const connection = await pool.connect();
    try {
      await connection.queryObject("SET ROLE rewind_edge_app");
      const result = await connection.queryObject<{ id: string; username: string; display_name: string | null; avatar_url: string | null }>({
        text: "SELECT id::text AS id, username, display_name, avatar_url FROM rewind.users WHERE id = $1 AND is_active", args: [userId],
      });
      return result.rows[0] ? toPublicUser(result.rows[0]) : null;
    } finally { connection.release(); }
  },
  async getFollowStatus(authUser, targetId): Promise<FollowStatusResponse | null> {
    const { connection, userId } = await beginUserTransaction(authUser);
    try {
      const target = await connection.queryObject({ text: "SELECT 1 FROM rewind.users WHERE id = $1 AND is_active", args: [targetId] });
      if (!target.rows.length) { await connection.queryObject("COMMIT"); return null; }
      const result = await connection.queryObject<{ following: boolean; followers: string; following_count: string }>({
        text: `SELECT EXISTS(SELECT 1 FROM rewind.follows WHERE follower_id = $1 AND following_id = $2) AS following,
                      (SELECT COUNT(*)::text FROM rewind.follows f JOIN rewind.users u ON u.id = f.follower_id AND u.is_active WHERE f.following_id = $2) AS followers,
                      (SELECT COUNT(*)::text FROM rewind.follows f JOIN rewind.users u ON u.id = f.following_id AND u.is_active WHERE f.follower_id = $1) AS following_count`,
        args: [userId, targetId],
      });
      await connection.queryObject("COMMIT");
      return { following: result.rows[0]?.following ?? false, followers: Number(result.rows[0]?.followers ?? 0), followingCount: Number(result.rows[0]?.following_count ?? 0) };
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },
  async setFollow(authUser, targetId, following) {
    const { connection, userId } = await beginUserTransaction(authUser);
    try {
      const target = await connection.queryObject({ text: "SELECT 1 FROM rewind.users WHERE id = $1 AND is_active", args: [targetId] });
      if (!target.rows.length) { await connection.queryObject("COMMIT"); return false; }
      if (userId === targetId) throw new RewindApiError(400, "You cannot follow yourself");
      if (!following) {
        await connection.queryObject({ text: "DELETE FROM rewind.follows WHERE follower_id = $1 AND following_id = $2", args: [userId, targetId] });
        await connection.queryObject("COMMIT");
        return true;
      }
      const block = await connection.queryObject({
        text: `SELECT 1 FROM rewind.user_blocks WHERE (blocker_id = $1 AND blocked_id = $2) OR (blocker_id = $2 AND blocked_id = $1) LIMIT 1`,
        args: [userId, targetId],
      });
      if (block.rows.length) throw new RewindApiError(403, "User interaction is blocked");
      const inserted = await connection.queryObject({
        text: "INSERT INTO rewind.follows (follower_id, following_id) VALUES ($1, $2) ON CONFLICT (follower_id, following_id) DO NOTHING RETURNING id",
        args: [userId, targetId],
      });
      if (inserted.rows.length) {
        await connection.queryObject({ text: "INSERT INTO rewind.user_activities (user_id, activity_type, related_user_id) VALUES ($1, 'FOLLOW', $2)", args: [userId, targetId] });
        const preference = await connection.queryObject<{ follows_enabled: boolean }>({
          text: "SELECT follows_enabled FROM rewind.notification_preferences WHERE user_id = $1", args: [targetId],
        });
        if (preference.rows[0]?.follows_enabled ?? true) {
          await connection.queryObject({
            text: "INSERT INTO rewind.notifications (recipient_id, actor_id, related_user_id, notification_type) VALUES ($1, $2, $2, 'FOLLOW')",
            args: [targetId, userId],
          });
        }
      }
      await connection.queryObject("COMMIT");
      return true;
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },
  async getBlockStatus(authUser, targetId) {
    const { connection, userId } = await beginUserTransaction(authUser);
    try {
      const target = await connection.queryObject({ text: "SELECT 1 FROM rewind.users WHERE id = $1 AND is_active", args: [targetId] });
      if (!target.rows.length) { await connection.queryObject("COMMIT"); return null; }
      const result = await connection.queryObject<{ blocked: boolean }>({
        text: `SELECT EXISTS(SELECT 1 FROM rewind.user_blocks WHERE
               (blocker_id = $1 AND blocked_id = $2) OR (blocker_id = $2 AND blocked_id = $1)) AS blocked`,
        args: [userId, targetId],
      });
      await connection.queryObject("COMMIT");
      return { blocked: result.rows[0]?.blocked ?? false };
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },
  async setBlock(authUser, targetId, blocked): Promise<boolean | null> {
    const { connection, userId } = await beginUserTransaction(authUser);
    try {
      const target = await connection.queryObject({ text: "SELECT 1 FROM rewind.users WHERE id = $1 AND is_active", args: [targetId] });
      if (!target.rows.length) { await connection.queryObject("COMMIT"); return null; }
      if (userId === targetId) throw new RewindApiError(400, "You cannot block yourself");
      if (blocked) {
        await connection.queryObject({
          text: "INSERT INTO rewind.user_blocks (blocker_id, blocked_id) VALUES ($1, $2) ON CONFLICT (blocker_id, blocked_id) DO NOTHING",
          args: [userId, targetId],
        });
        await connection.queryObject({
          text: `DELETE FROM rewind.follows WHERE (follower_id = $1 AND following_id = $2)
                 OR (follower_id = $2 AND following_id = $1)`, args: [userId, targetId],
        });
      } else {
        await connection.queryObject({ text: "DELETE FROM rewind.user_blocks WHERE blocker_id = $1 AND blocked_id = $2", args: [userId, targetId] });
      }
      await connection.queryObject("COMMIT");
      return true;
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },
  async getMySocialLinks(authUser) {
    const { connection, userId } = await beginUserTransaction(authUser);
    try {
      const result = await connection.queryObject<{ platform: string; url: string }>({
        text: "SELECT platform, url FROM rewind.user_social_links WHERE user_id = $1 ORDER BY platform", args: [userId],
      });
      await connection.queryObject("COMMIT");
      return result.rows;
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },
  async updateMySocialLinks(authUser, links) {
    const { connection, userId } = await beginUserTransaction(authUser);
    try {
      await connection.queryObject({ text: "DELETE FROM rewind.user_social_links WHERE user_id = $1", args: [userId] });
      for (const link of links) {
        await connection.queryObject({
          text: "INSERT INTO rewind.user_social_links (user_id, platform, url) VALUES ($1, $2, $3)",
          args: [userId, link.platform, link.url],
        });
      }
      const result = await connection.queryObject<{ platform: string; url: string }>({
        text: "SELECT platform, url FROM rewind.user_social_links WHERE user_id = $1 ORDER BY platform", args: [userId],
      });
      await connection.queryObject("COMMIT");
      return result.rows;
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },
  async getNotifications(authUser, page, size) {
    const { connection, userId } = await beginUserTransaction(authUser);
    try {
      const [count, rows] = await Promise.all([
        connection.queryObject<{ total: string }>({
          text: "SELECT COUNT(*)::text AS total FROM rewind.notifications WHERE recipient_id = $1", args: [userId],
        }),
        connection.queryObject<{
          id: string; notification_type: NotificationResponse["type"]; created_at: string; read_at: string | null;
          actor_id: string | null; actor_username: string | null; actor_display_name: string | null; actor_avatar_url: string | null;
          related_user_id: string | null; review_id: string | null;
        }>({
          text: `SELECT n.id::text AS id, n.notification_type, n.created_at::text AS created_at, n.read_at::text AS read_at,
                        actor.id::text AS actor_id, actor.username AS actor_username, actor.display_name AS actor_display_name,
                        actor.avatar_url AS actor_avatar_url, n.related_user_id::text AS related_user_id, n.review_id::text AS review_id
                 FROM rewind.notifications n LEFT JOIN rewind.users actor ON actor.id = n.actor_id AND actor.is_active
                 WHERE n.recipient_id = $1 ORDER BY n.created_at DESC, n.id DESC LIMIT $2 OFFSET $3`, args: [userId, size, page * size],
        }),
      ]);
      await connection.queryObject("COMMIT");
      return pageResult(rows.rows.map(toNotification), count.rows[0]?.total ?? "0", page, size);
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },
  async getUnreadNotificationCount(authUser) {
    const { connection, userId } = await beginUserTransaction(authUser);
    try {
      const result = await connection.queryObject<{ total: string }>({
        text: "SELECT COUNT(*)::text AS total FROM rewind.notifications WHERE recipient_id = $1 AND read_at IS NULL", args: [userId],
      });
      await connection.queryObject("COMMIT");
      return Number(result.rows[0]?.total ?? "0");
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },
  async markNotificationRead(authUser, notificationId) {
    const { connection, userId } = await beginUserTransaction(authUser);
    try {
      const result = await connection.queryObject({
        text: `UPDATE rewind.notifications SET read_at = COALESCE(read_at, CURRENT_TIMESTAMP)
               WHERE id = $1 AND recipient_id = $2 RETURNING id`, args: [notificationId, userId],
      });
      await connection.queryObject("COMMIT");
      return result.rows.length > 0;
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },
  async markAllNotificationsRead(authUser) {
    const { connection, userId } = await beginUserTransaction(authUser);
    try {
      await connection.queryObject({
        text: "UPDATE rewind.notifications SET read_at = CURRENT_TIMESTAMP WHERE recipient_id = $1 AND read_at IS NULL", args: [userId],
      });
      await connection.queryObject("COMMIT");
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },
  async getNotificationPreferences(authUser): Promise<NotificationPreferencesResponse> {
    const { connection, userId } = await beginUserTransaction(authUser);
    try {
      await connection.queryObject({
        text: "INSERT INTO rewind.notification_preferences (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING", args: [userId],
      });
      const result = await connection.queryObject<{ follows_enabled: boolean; review_likes_enabled: boolean }>({
        text: "SELECT follows_enabled, review_likes_enabled FROM rewind.notification_preferences WHERE user_id = $1", args: [userId],
      });
      await connection.queryObject("COMMIT");
      return { followsEnabled: result.rows[0]?.follows_enabled ?? true, reviewLikesEnabled: result.rows[0]?.review_likes_enabled ?? true };
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },
  async updateNotificationPreferences(authUser, preferences) {
    const { connection, userId } = await beginUserTransaction(authUser);
    try {
      await connection.queryObject({
        text: `INSERT INTO rewind.notification_preferences (user_id, follows_enabled, review_likes_enabled) VALUES ($1, $2, $3)
               ON CONFLICT (user_id) DO UPDATE SET follows_enabled = EXCLUDED.follows_enabled,
                 review_likes_enabled = EXCLUDED.review_likes_enabled`,
        args: [userId, preferences.followsEnabled, preferences.reviewLikesEnabled],
      });
      await connection.queryObject("COMMIT");
      return preferences;
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },
  async getConversations(authUser, page, size) {
    const { connection, userId } = await beginUserTransaction(authUser);
    try {
      const [count, rows] = await Promise.all([
        connection.queryObject<{ total: string }>({
          text: `SELECT COUNT(*)::text AS total FROM rewind.conversations c
                 JOIN rewind.users other ON other.id = CASE WHEN c.user_one_id = $1 THEN c.user_two_id ELSE c.user_one_id END AND other.is_active
                 WHERE $1 IN (c.user_one_id, c.user_two_id)`, args: [userId],
        }),
        connection.queryObject<{
          id: string; updated_at: string; other_id: string; other_username: string; other_display_name: string | null; other_avatar_url: string | null;
          last_id: string | null; last_sender_id: string | null; last_body: string | null; last_created_at: string | null; last_read_at: string | null;
        }>({
          text: `SELECT c.id::text AS id, c.updated_at::text AS updated_at, other.id::text AS other_id,
                        other.username AS other_username, other.display_name AS other_display_name, other.avatar_url AS other_avatar_url,
                        last.id::text AS last_id, last.sender_id::text AS last_sender_id, last.body AS last_body,
                        last.created_at::text AS last_created_at, last.read_at::text AS last_read_at
                 FROM rewind.conversations c
                 JOIN rewind.users other ON other.id = CASE WHEN c.user_one_id = $1 THEN c.user_two_id ELSE c.user_one_id END AND other.is_active
                 LEFT JOIN LATERAL (SELECT m.id, m.sender_id, m.body, m.created_at, m.read_at FROM rewind.messages m
                   WHERE m.conversation_id = c.id ORDER BY m.created_at DESC, m.id DESC LIMIT 1) last ON TRUE
                 WHERE $1 IN (c.user_one_id, c.user_two_id) ORDER BY c.updated_at DESC, c.id DESC LIMIT $2 OFFSET $3`,
          args: [userId, size, page * size],
        }),
      ]);
      await connection.queryObject("COMMIT");
      return pageResult(rows.rows.map(toConversation), count.rows[0]?.total ?? "0", page, size);
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },
  async getUnreadMessageCount(authUser) {
    const { connection, userId } = await beginUserTransaction(authUser);
    try {
      const result = await connection.queryObject<{ total: string }>({
        text: `SELECT COUNT(*)::text AS total FROM rewind.messages m JOIN rewind.conversations c ON c.id = m.conversation_id
               WHERE $1 IN (c.user_one_id, c.user_two_id) AND m.sender_id <> $1 AND m.read_at IS NULL`, args: [userId],
      });
      await connection.queryObject("COMMIT");
      return Number(result.rows[0]?.total ?? "0");
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },
  async startConversation(authUser, targetId) {
    const { connection, userId } = await beginUserTransaction(authUser);
    try {
      const target = await connection.queryObject({ text: "SELECT 1 FROM rewind.users WHERE id = $1 AND is_active", args: [targetId] });
      if (!target.rows.length) { await connection.queryObject("COMMIT"); return null; }
      if (userId === targetId) throw new RewindApiError(400, "You cannot message yourself");
      const blocked = await connection.queryObject({
        text: `SELECT 1 FROM rewind.user_blocks WHERE (blocker_id = $1 AND blocked_id = $2) OR (blocker_id = $2 AND blocked_id = $1) LIMIT 1`, args: [userId, targetId],
      });
      if (blocked.rows.length) throw new RewindApiError(403, "User interaction is blocked");
      const one = Math.min(userId, targetId);
      const two = Math.max(userId, targetId);
      await connection.queryObject({
        text: "INSERT INTO rewind.conversations (user_one_id, user_two_id) VALUES ($1, $2) ON CONFLICT (user_one_id, user_two_id) DO NOTHING",
        args: [one, two],
      });
      const result = await connection.queryObject<{ id: string }>({
        text: "SELECT id::text AS id FROM rewind.conversations WHERE user_one_id = $1 AND user_two_id = $2", args: [one, two],
      });
      if (!result.rows[0]) throw new Error("Conversation could not be created.");
      const response = await fetchConversation(connection, userId, safeId(result.rows[0].id, "Conversation ID"));
      await connection.queryObject("COMMIT");
      return response;
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },
  async getConversationMessages(authUser, conversationId, page, size) {
    const { connection, userId } = await beginUserTransaction(authUser);
    try {
      if (!await findVisibleConversation(connection, userId, conversationId)) { await connection.queryObject("COMMIT"); return null; }
      const [count, rows] = await Promise.all([
        connection.queryObject<{ total: string }>({ text: "SELECT COUNT(*)::text AS total FROM rewind.messages WHERE conversation_id = $1", args: [conversationId] }),
        connection.queryObject<{ id: string; conversation_id: string; sender_id: string; body: string; created_at: string; read_at: string | null }>({
          text: `SELECT id::text AS id, conversation_id::text AS conversation_id, sender_id::text AS sender_id,
                        body, created_at::text AS created_at, read_at::text AS read_at
                 FROM rewind.messages WHERE conversation_id = $1
                 ORDER BY created_at DESC, id DESC LIMIT $2 OFFSET $3`, args: [conversationId, size, page * size],
        }),
      ]);
      await connection.queryObject("COMMIT");
      return pageResult(rows.rows.map(toMessage), count.rows[0]?.total ?? "0", page, size);
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },
  async sendConversationMessage(authUser, conversationId, body) {
    const { connection, userId } = await beginUserTransaction(authUser);
    try {
      if (!body.trim() || body.trim().length > 2000) throw new RewindApiError(400, "Message body cannot be blank or exceed 2000 characters");
      if (!await findVisibleConversation(connection, userId, conversationId)) { await connection.queryObject("COMMIT"); return null; }
      const inserted = await connection.queryObject<{ id: string; conversation_id: string; sender_id: string; body: string; created_at: string; read_at: string | null }>({
        text: `INSERT INTO rewind.messages (conversation_id, sender_id, body) VALUES ($1, $2, $3)
               RETURNING id::text AS id, conversation_id::text AS conversation_id, sender_id::text AS sender_id,
                 body, created_at::text AS created_at, read_at::text AS read_at`, args: [conversationId, userId, body.trim()],
      });
      await connection.queryObject({ text: "UPDATE rewind.conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = $1", args: [conversationId] });
      await connection.queryObject("COMMIT");
      return inserted.rows[0] ? toMessage(inserted.rows[0]) : null;
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },
  async markConversationRead(authUser, conversationId) {
    const { connection, userId } = await beginUserTransaction(authUser);
    try {
      if (!await findVisibleConversation(connection, userId, conversationId)) { await connection.queryObject("COMMIT"); return false; }
      await connection.queryObject({
        text: `UPDATE rewind.messages SET read_at = CURRENT_TIMESTAMP
               WHERE conversation_id = $1 AND sender_id <> $2 AND read_at IS NULL`, args: [conversationId, userId],
      });
      await connection.queryObject("COMMIT");
      return true;
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },
  async getMyLists(authUser): Promise<MyListResponse[]> {
    const { connection, userId } = await beginUserTransaction(authUser);
    try {
      const lists = await fetchMyListRows(connection, userId);
      await connection.queryObject("COMMIT");
      return lists;
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },
  async getMyListsPage(authUser, page, size): Promise<MyListPageResponse> {
    const { connection, userId } = await beginUserTransaction(authUser);
    try {
      const count = await connection.queryObject<{ total: string }>({
        text: "SELECT COUNT(*)::text AS total FROM rewind.lists WHERE user_id = $1", args: [userId],
      });
      const content = await fetchMyListRows(connection, userId, size, page * size);
      await connection.queryObject("COMMIT");
      const totalElements = Number(count.rows[0]?.total ?? "0");
      return { content, totalPages: Math.ceil(totalElements / size), totalElements, number: page };
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },
  async createMyList(authUser, body: CreateMyListRequest): Promise<MyListResponse> {
    const { connection, userId } = await beginUserTransaction(authUser);
    try {
      const movieIds = [...new Set(body.movieIds)];
      const movies = await connection.queryObject<{ id: string }>({
        text: "SELECT id::text AS id FROM rewind.movies WHERE id = ANY($1::bigint[])", args: [movieIds],
      });
      if (movies.rows.length !== movieIds.length) throw new RewindApiError(400, "One or more movies were not found");
      const inserted = await connection.queryObject<{ id: string }>({
        text: `INSERT INTO rewind.lists (user_id, name, description, list_type, is_public)
               VALUES ($1, $2, $3, 'CUSTOM', $4) RETURNING id::text AS id`,
        args: [userId, body.name, body.description, body.isPublic],
      });
      const listId = safeId(inserted.rows[0].id, "List ID");
      for (let index = 0; index < movieIds.length; index++) {
        await connection.queryObject({
          text: `INSERT INTO rewind.list_items (list_id, movie_id, position)
                 VALUES ($1, $2, $3) ON CONFLICT (list_id, movie_id) DO NOTHING`,
          args: [listId, movieIds[index], index + 1],
        });
      }
      const tags = await replaceListTags(connection, listId, body.tags);
      if (body.isPublic) {
        await connection.queryObject({
          text: `INSERT INTO rewind.user_activities (user_id, activity_type, list_id)
                 VALUES ($1, 'LIST', $2)`,
          args: [userId, listId],
        });
      }
      await connection.queryObject("COMMIT");
      return { id: listId, name: body.name, description: body.description,
        listType: "CUSTOM", isPublic: body.isPublic, tags };
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },
  async updateMyList(authUser, listId, body: UpdateMyListRequest): Promise<MyListResponse | null> {
    const { connection, userId } = await beginUserTransaction(authUser);
    try {
      const selected = await connection.queryObject<{
        name: string; description: string | null; list_type: MyListResponse["listType"]; is_public: boolean;
      }>({
        text: `SELECT name, description, list_type, is_public FROM rewind.lists
               WHERE id = $1 AND user_id = $2`, args: [listId, userId],
      });
      const current = selected.rows[0];
      if (!current) { await connection.queryObject("COMMIT"); return null; }
      if (current.list_type !== "CUSTOM") throw new RewindApiError(400, "System list cannot be edited");
      const updateDescription = body.description !== undefined && body.description !== null;
      await connection.queryObject({
        text: `UPDATE rewind.lists SET
                 name = CASE WHEN $3 THEN $4 ELSE name END,
                 description = CASE WHEN $5 THEN $6 ELSE description END,
                 is_public = CASE WHEN $7 THEN $8 ELSE is_public END
               WHERE id = $1 AND user_id = $2`,
        args: [listId, userId, body.name !== undefined, body.name ?? null,
          updateDescription, body.description ?? null, body.isPublic !== undefined, body.isPublic ?? false],
      });
      const tags = body.tags === undefined
        ? (await loadListTags(connection, [listId])).get(listId) ?? []
        : await replaceListTags(connection, listId, body.tags);
      await connection.queryObject("COMMIT");
      return { id: listId, name: body.name ?? current.name,
        description: updateDescription ? body.description! : current.description,
        listType: "CUSTOM", isPublic: body.isPublic ?? current.is_public, tags };
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },
  async deleteMyList(authUser, listId): Promise<boolean> {
    const { connection, userId } = await beginUserTransaction(authUser);
    try {
      const list = await connection.queryObject<{ list_type: string }>({
        text: "SELECT list_type FROM rewind.lists WHERE id = $1 AND user_id = $2", args: [listId, userId],
      });
      if (!list.rows[0]) { await connection.queryObject("COMMIT"); return false; }
      if (list.rows[0].list_type !== "CUSTOM") throw new RewindApiError(400, "System list cannot be deleted");
      await connection.queryObject({ text: "DELETE FROM rewind.lists WHERE id = $1 AND user_id = $2", args: [listId, userId] });
      await connection.queryObject("COMMIT");
      return true;
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },
  async getMyListItems(authUser, listId): Promise<MyListItemResponse[] | null> {
    const { connection, userId } = await beginUserTransaction(authUser);
    try {
      const list = await connection.queryObject({
        text: "SELECT 1 FROM rewind.lists WHERE id = $1 AND user_id = $2", args: [listId, userId],
      });
      if (!list.rows.length) { await connection.queryObject("COMMIT"); return null; }
      const rows = await connection.queryObject<{
        id: string; position: number | null; movie_id: string; title: string;
        release_date: string | null; rating: string | null; photo_url: string | null;
      }>({
        text: `SELECT li.id::text AS id, li.position, m.id::text AS movie_id, m.title,
                      m.release_date::text AS release_date, m.rating::text AS rating, m.photo_url
               FROM rewind.list_items li JOIN rewind.movies m ON m.id = li.movie_id
               WHERE li.list_id = $1 ORDER BY li.position ASC NULLS LAST, li.id ASC`, args: [listId],
      });
      await connection.queryObject("COMMIT");
      return rows.rows.map((row) => ({
        id: safeId(row.id, "List item ID"), position: row.position,
        movie: { id: safeId(row.movie_id, "Movie ID"), title: row.title, releaseDate: row.release_date,
          rating: row.rating === null ? null : Number(row.rating), photoUrl: row.photo_url },
      }));
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },
  async addMovieToMyList(authUser, listId, movieId, position): Promise<"OK" | "LIST_NOT_FOUND" | "MOVIE_NOT_FOUND"> {
    const { connection, userId } = await beginUserTransaction(authUser);
    try {
      const list = await connection.queryObject({
        text: "SELECT 1 FROM rewind.lists WHERE id = $1 AND user_id = $2", args: [listId, userId],
      });
      if (!list.rows.length) { await connection.queryObject("COMMIT"); return "LIST_NOT_FOUND"; }
      const movie = await connection.queryObject({ text: "SELECT 1 FROM rewind.movies WHERE id = $1", args: [movieId] });
      if (!movie.rows.length) { await connection.queryObject("COMMIT"); return "MOVIE_NOT_FOUND"; }
      let resolvedPosition = position;
      if (resolvedPosition === null) {
        const max = await connection.queryObject<{ position: number }>({
          text: "SELECT COALESCE(MAX(position), 0) + 1 AS position FROM rewind.list_items WHERE list_id = $1",
          args: [listId],
        });
        resolvedPosition = Number(max.rows[0]?.position ?? 1);
      }
      await connection.queryObject({
        text: `INSERT INTO rewind.list_items (list_id, movie_id, position) VALUES ($1, $2, $3)
               ON CONFLICT (list_id, movie_id) DO NOTHING`, args: [listId, movieId, resolvedPosition],
      });
      await connection.queryObject("COMMIT");
      return "OK";
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },
  async removeMovieFromMyList(authUser, listId, movieId): Promise<"OK" | "LIST_NOT_FOUND" | "LAST_MOVIE"> {
    const { connection, userId } = await beginUserTransaction(authUser);
    try {
      const list = await connection.queryObject<{ list_type: string }>({
        text: "SELECT list_type FROM rewind.lists WHERE id = $1 AND user_id = $2", args: [listId, userId],
      });
      if (!list.rows[0]) { await connection.queryObject("COMMIT"); return "LIST_NOT_FOUND"; }
      if (list.rows[0].list_type === "CUSTOM") {
        const count = await connection.queryObject<{ total: string }>({
          text: "SELECT COUNT(*)::text AS total FROM rewind.list_items WHERE list_id = $1", args: [listId],
        });
        if (Number(count.rows[0]?.total ?? "0") <= 1) {
          await connection.queryObject("COMMIT");
          return "LAST_MOVIE";
        }
      }
      await connection.queryObject({
        text: "DELETE FROM rewind.list_items WHERE list_id = $1 AND movie_id = $2", args: [listId, movieId],
      });
      await connection.queryObject("COMMIT");
      return "OK";
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },
  async reorderMyListItems(authUser, listId, orderedItemIds): Promise<"OK" | "LIST_NOT_FOUND" | "INVALID_ORDER"> {
    const { connection, userId } = await beginUserTransaction(authUser);
    try {
      const list = await connection.queryObject<{ list_type: string }>({
        text: "SELECT list_type FROM rewind.lists WHERE id = $1 AND user_id = $2", args: [listId, userId],
      });
      if (!list.rows[0]) { await connection.queryObject("COMMIT"); return "LIST_NOT_FOUND"; }
      if (list.rows[0].list_type !== "CUSTOM") throw new RewindApiError(400, "System list cannot be reordered");
      const rows = await connection.queryObject<{ id: string }>({
        text: "SELECT id::text AS id FROM rewind.list_items WHERE list_id = $1", args: [listId],
      });
      const currentIds = rows.rows.map((row) => safeId(row.id, "List item ID"));
      if (orderedItemIds.length !== currentIds.length || new Set(orderedItemIds).size !== orderedItemIds.length
        || orderedItemIds.some((id) => !currentIds.includes(id))) {
        await connection.queryObject("COMMIT");
        return "INVALID_ORDER";
      }
      for (let index = 0; index < orderedItemIds.length; index++) {
        await connection.queryObject({
          text: "UPDATE rewind.list_items SET position = $3 WHERE id = $1 AND list_id = $2",
          args: [orderedItemIds[index], listId, index + 1],
        });
      }
      await connection.queryObject("COMMIT");
      return "OK";
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },
  async searchMovies(params: MovieSearchParams): Promise<MovieSearchResult> {
    const filters = ["NULLIF(BTRIM(m.title), '') IS NOT NULL"];
    const args: unknown[] = [];
    const bind = (value: unknown): string => {
      args.push(value);
      return `$${args.length}`;
    };
    if (params.q) filters.push(`LOWER(m.title) LIKE '%' || LOWER(${bind(params.q)}) || '%'`);
    if (params.genreId !== null) {
      filters.push(`EXISTS (SELECT 1 FROM rewind.movie_genres mg WHERE mg.movie_id = m.id AND mg.genre_id = ${bind(params.genreId)})`);
    }
    if (params.year !== null) filters.push(`EXTRACT(YEAR FROM m.release_date) = ${bind(params.year)}`);
    if (params.minRating !== null) filters.push(`m.rating >= ${bind(params.minRating)}`);

    const orderBy: Record<string, string> = {
      newest: "m.release_date DESC NULLS LAST",
      oldest: "m.release_date ASC NULLS LAST",
      rating_desc: "m.rating DESC NULLS LAST",
      rating_asc: "m.rating ASC NULLS LAST",
      title_asc: "m.title ASC",
    };
    const ordering = orderBy[params.sort] ?? orderBy.newest;
    const where = filters.join(" AND ");
    const countArgs = [...args];
    const pageArgs = [...args, params.size, params.page * params.size];
    const pageSizeArg = pageArgs.length - 1;
    const offsetArg = pageArgs.length;
    const connection = await pool.connect();
    try {
      await connection.queryObject("SET ROLE rewind_edge_reader");
      const [countResult, rowsResult] = await Promise.all([
        connection.queryObject<{ total: string }>({
          text: `SELECT COUNT(*)::text AS total FROM rewind.movies m WHERE ${where}`,
          args: countArgs,
        }),
        connection.queryObject<{
          id: string;
          title: string;
          release_date: string | null;
          rating: string | null;
          photo_url: string | null;
        }>({
          text: `SELECT m.id::text AS id, m.title, m.release_date::text AS release_date,
                        m.rating::text AS rating, m.photo_url
                 FROM rewind.movies m WHERE ${where}
                 ORDER BY ${ordering}, m.id DESC
                 LIMIT $${pageSizeArg} OFFSET $${offsetArg}`,
          args: pageArgs,
        }),
      ]);
      const totalElements = Number(countResult.rows[0]?.total ?? "0");
      const content = rowsResult.rows.map((row) => {
        const id = Number(row.id);
        if (!Number.isSafeInteger(id)) throw new Error("Movie ID is outside the safe JSON integer range");
        return {
          id,
          title: row.title,
          releaseDate: row.release_date,
          rating: row.rating === null ? null : Number(row.rating),
          photoUrl: row.photo_url,
        };
      });
      return {
        content,
        totalElements,
        totalPages: Math.ceil(totalElements / params.size),
        number: params.page,
      };
    } finally {
      connection.release();
    }
  },
  async searchGlobal(query, language, size): Promise<GlobalSearchResponse> {
    const connection = await pool.connect();
    try {
      await connection.queryObject("SET ROLE rewind_edge_app");
      const normalizedQuery = query.toLowerCase();
      const fallbackLanguage = language === "en" ? "uk" : "en";
      const [filmCount, films, userCount, users, listCount, lists, tags, people, reviewCount, reviews, articleCount, articles] = await Promise.all([
        connection.queryObject<{ total: string }>({ text: `SELECT COUNT(*)::text AS total FROM rewind.movies m
          WHERE NULLIF(BTRIM(m.title), '') IS NOT NULL AND POSITION($1 IN LOWER(m.title)) > 0`, args: [normalizedQuery] }),
        connection.queryObject<{ id: string; title: string; release_date: string | null; rating: string | null; photo_url: string | null }>({
          text: `SELECT m.id::text AS id, m.title, m.release_date::text AS release_date, m.rating::text AS rating, m.photo_url
                 FROM rewind.movies m WHERE NULLIF(BTRIM(m.title), '') IS NOT NULL
                   AND POSITION($1 IN LOWER(m.title)) > 0
                 ORDER BY m.title ASC, m.id DESC LIMIT $2`, args: [normalizedQuery, size],
        }),
        connection.queryObject<{ total: string }>({ text: `SELECT COUNT(*)::text AS total FROM rewind.users u
          WHERE u.is_active = TRUE AND (POSITION($1 IN LOWER(u.username)) > 0
            OR POSITION($1 IN LOWER(COALESCE(u.display_name, ''))) > 0)`, args: [normalizedQuery] }),
        connection.queryObject<{ id: string; username: string; display_name: string | null; avatar_url: string | null }>({
          text: `SELECT u.id::text AS id, u.username, u.display_name, u.avatar_url FROM rewind.users u
                 WHERE u.is_active = TRUE AND (POSITION($1 IN LOWER(u.username)) > 0
                   OR POSITION($1 IN LOWER(COALESCE(u.display_name, ''))) > 0)
                 ORDER BY u.username ASC, u.id ASC LIMIT $2`, args: [normalizedQuery, size],
        }),
        connection.queryObject<{ total: string }>({ text: `SELECT COUNT(*)::text AS total FROM rewind.lists l
          JOIN rewind.users owner ON owner.id = l.user_id AND owner.is_active = TRUE
          WHERE l.is_public = TRUE AND l.list_type = 'CUSTOM'
            AND (POSITION($1 IN LOWER(l.name)) > 0 OR POSITION($1 IN LOWER(COALESCE(l.description, ''))) > 0
              OR POSITION($1 IN LOWER(owner.username)) > 0)`, args: [normalizedQuery] }),
        connection.queryObject<{ id: string; name: string; description: string | null; owner_id: string; owner_username: string;
          owner_avatar_url: string | null; like_count: string; item_count: string }>({
          text: `SELECT l.id::text AS id, l.name, l.description, owner.id::text AS owner_id,
                        owner.username AS owner_username, owner.avatar_url AS owner_avatar_url,
                        (SELECT COUNT(*)::text FROM rewind.list_likes ll JOIN rewind.users liker
                          ON liker.id = ll.user_id AND liker.is_active = TRUE WHERE ll.list_id = l.id) AS like_count,
                        (SELECT COUNT(*)::text FROM rewind.list_items li WHERE li.list_id = l.id) AS item_count
                 FROM rewind.lists l JOIN rewind.users owner ON owner.id = l.user_id AND owner.is_active = TRUE
                 WHERE l.is_public = TRUE AND l.list_type = 'CUSTOM'
                   AND (POSITION($1 IN LOWER(l.name)) > 0 OR POSITION($1 IN LOWER(COALESCE(l.description, ''))) > 0
                     OR POSITION($1 IN LOWER(owner.username)) > 0)
                 ORDER BY l.updated_at DESC, l.id DESC LIMIT $2`, args: [normalizedQuery, size],
        }),
        query.length === 0 ? Promise.resolve({ rows: [] as { id: string; name: string; slug: string }[] })
          : connection.queryObject<{ id: string; name: string; slug: string }>({
            text: `SELECT t.id::text AS id, t.name, t.slug FROM rewind.tags t
                   WHERE POSITION($1 IN LOWER(t.name)) > 0 AND EXISTS (
                     SELECT 1 FROM rewind.list_tags lt JOIN rewind.lists l ON l.id = lt.list_id
                     JOIN rewind.users owner ON owner.id = l.user_id
                     WHERE lt.tag_id = t.id AND l.is_public = TRUE AND l.list_type = 'CUSTOM' AND owner.is_active = TRUE)
                   ORDER BY t.name ASC, t.id ASC LIMIT $2`, args: [normalizedQuery, size],
          }),
        query.length === 0 ? Promise.resolve({ rows: [] as { id: string; name: string; photo_url: string | null; type: "ACTOR" | "DIRECTOR" | "PRODUCER" }[] })
          : connection.queryObject<{ id: string; name: string; photo_url: string | null; type: "ACTOR" | "DIRECTOR" | "PRODUCER" }>({
            text: `SELECT id::text AS id, name, photo_url, type FROM (
                     SELECT a.id, a.name, a.photo_url, 'ACTOR'::text AS type FROM rewind.actors a WHERE POSITION($1 IN LOWER(a.name)) > 0
                     UNION ALL
                     SELECT d.id, d.name, d.photo_url, 'DIRECTOR'::text FROM rewind.directors d WHERE POSITION($1 IN LOWER(d.name)) > 0
                     UNION ALL
                     SELECT p.id, p.name, p.photo_url, 'PRODUCER'::text FROM rewind.producers p WHERE POSITION($1 IN LOWER(p.name)) > 0
                   ) matched ORDER BY name ASC, type ASC, id ASC LIMIT $2`, args: [normalizedQuery, size],
          }),
        connection.queryObject<{ total: string }>({ text: `SELECT COUNT(*)::text AS total FROM rewind.reviews r
          JOIN rewind.movies m ON m.id = r.movie_id JOIN rewind.users author ON author.id = r.user_id
          WHERE r.is_hidden = FALSE AND author.is_active = TRUE AND (POSITION($1 IN LOWER(r.content)) > 0
            OR POSITION($1 IN LOWER(m.title)) > 0 OR POSITION($1 IN LOWER(author.username)) > 0)`, args: [normalizedQuery] }),
        connection.queryObject<{ id: string; movie_id: string; movie_title: string; user_id: string; username: string; content: string;
          rating: string | null; created_at: string; movie_photo_url: string | null; user_avatar_url: string | null }>({
          text: `SELECT r.id::text AS id, r.movie_id::text AS movie_id, m.title AS movie_title,
                        author.id::text AS user_id, author.username, r.content, r.rating::text AS rating,
                        r.created_at::text AS created_at, m.photo_url AS movie_photo_url, author.avatar_url AS user_avatar_url
                 FROM rewind.reviews r JOIN rewind.movies m ON m.id = r.movie_id
                 JOIN rewind.users author ON author.id = r.user_id
                 WHERE r.is_hidden = FALSE AND author.is_active = TRUE AND (POSITION($1 IN LOWER(r.content)) > 0
                   OR POSITION($1 IN LOWER(m.title)) > 0 OR POSITION($1 IN LOWER(author.username)) > 0)
                 ORDER BY r.updated_at DESC, r.id DESC LIMIT $2`, args: [normalizedQuery, size],
        }),
        connection.queryObject<{ total: string }>({ text: `SELECT COUNT(*)::text AS total FROM rewind.journal_articles a
          WHERE a.is_published = TRUE AND (a.language = $1 OR (a.language = $2 AND NOT EXISTS (
            SELECT 1 FROM rewind.journal_articles preferred WHERE preferred.slug = a.slug
              AND preferred.language = $1 AND preferred.is_published = TRUE)))
            AND (POSITION($3 IN LOWER(a.title)) > 0 OR POSITION($3 IN LOWER(COALESCE(a.excerpt, ''))) > 0
              OR POSITION($3 IN LOWER(a.category)) > 0)`, args: [language, fallbackLanguage, normalizedQuery] }),
        connection.queryObject<{ id: string; slug: string; category: string; title: string; excerpt: string | null;
          cover_url: string | null; published_at: string | null }>({
          text: `SELECT a.id::text AS id, a.slug, a.category, a.title, a.excerpt, a.cover_url, a.published_at::text AS published_at
                 FROM rewind.journal_articles a
                 WHERE a.is_published = TRUE AND (a.language = $1 OR (a.language = $2 AND NOT EXISTS (
                   SELECT 1 FROM rewind.journal_articles preferred WHERE preferred.slug = a.slug
                     AND preferred.language = $1 AND preferred.is_published = TRUE)))
                   AND (POSITION($3 IN LOWER(a.title)) > 0 OR POSITION($3 IN LOWER(COALESCE(a.excerpt, ''))) > 0
                     OR POSITION($3 IN LOWER(a.category)) > 0)
                 ORDER BY a.published_at DESC NULLS LAST, a.id DESC LIMIT $4`,
          args: [language, fallbackLanguage, normalizedQuery, size],
        }),
      ]);
      const listIds = lists.rows.map((row) => safeId(row.id, "List ID"));
      const [listTags, listPreviews] = listIds.length === 0 ? [{ rows: [] as { list_id: string; name: string }[] },
        { rows: [] as { list_id: string; movie_id: string; title: string; release_date: string | null; rating: string | null; photo_url: string | null }[] }]
        : await Promise.all([
          connection.queryObject<{ list_id: string; name: string }>({
            text: `SELECT lt.list_id::text AS list_id, t.name FROM rewind.list_tags lt JOIN rewind.tags t ON t.id = lt.tag_id
                   WHERE lt.list_id = ANY($1::bigint[]) ORDER BY lt.list_id, t.name`, args: [listIds],
          }),
          connection.queryObject<{ list_id: string; movie_id: string; title: string; release_date: string | null; rating: string | null; photo_url: string | null }>({
            text: `SELECT list_id::text AS list_id, movie_id::text AS movie_id, title, release_date, rating, photo_url FROM (
                     SELECT li.list_id, m.id AS movie_id, m.title, m.release_date::text AS release_date,
                            m.rating::text AS rating, m.photo_url,
                            ROW_NUMBER() OVER (PARTITION BY li.list_id ORDER BY li.position ASC NULLS LAST, li.id ASC) AS rn
                     FROM rewind.list_items li JOIN rewind.movies m ON m.id = li.movie_id WHERE li.list_id = ANY($1::bigint[])
                   ) ranked WHERE rn <= 3 ORDER BY list_id, rn`, args: [listIds],
          }),
        ]);
      const tagMap = new Map<number, string[]>();
      for (const row of listTags.rows) {
        const id = safeId(row.list_id, "List ID");
        tagMap.set(id, [...(tagMap.get(id) ?? []), row.name]);
      }
      const previewMap = new Map<number, MovieCardResponse[]>();
      for (const row of listPreviews.rows) {
        const id = safeId(row.list_id, "List ID");
        previewMap.set(id, [...(previewMap.get(id) ?? []), {
          id: safeId(row.movie_id, "Movie ID"), title: row.title, releaseDate: row.release_date,
          rating: row.rating === null ? null : Number(row.rating), photoUrl: row.photo_url,
        }]);
      }
      const toPage = <T>(content: T[], total: string) => pageResult(content, total, 0, size);
      const articleContent: GlobalSearchArticleResponse[] = articles.rows.map((row) => ({
        id: safeId(row.id, "Journal article ID"), slug: row.slug, category: row.category,
        title: row.title, excerpt: row.excerpt, coverUrl: row.cover_url, publishedAt: row.published_at,
      }));
      return {
        films: toPage(films.rows.map((row) => ({
          id: safeId(row.id, "Movie ID"), title: row.title, releaseDate: row.release_date,
          rating: row.rating === null ? null : Number(row.rating), photoUrl: row.photo_url,
        })), filmCount.rows[0]?.total ?? "0"),
        users: toPage(users.rows.map((row) => ({
          id: safeId(row.id, "User ID"), username: row.username, displayName: row.display_name, avatarUrl: row.avatar_url,
        })), userCount.rows[0]?.total ?? "0"),
        lists: toPage(lists.rows.map((row) => {
          const id = safeId(row.id, "List ID");
          return { id, name: row.name, description: row.description, isPublic: true,
            ownerId: safeId(row.owner_id, "User ID"), ownerUsername: row.owner_username, ownerAvatarUrl: row.owner_avatar_url,
            tags: tagMap.get(id) ?? [], likeCount: Number(row.like_count), itemCount: Number(row.item_count),
            previewMovies: previewMap.get(id) ?? [] };
        }), listCount.rows[0]?.total ?? "0"),
        tags: tags.rows.map((row) => ({ id: safeId(row.id, "Tag ID"), name: row.name, slug: row.slug })),
        people: people.rows.map((row) => ({ id: safeId(row.id, "Person ID"), name: row.name, photoUrl: row.photo_url, type: row.type })),
        reviews: toPage(reviews.rows.map((row) => ({
          id: safeId(row.id, "Review ID"), movieId: safeId(row.movie_id, "Movie ID"), movieTitle: row.movie_title,
          userId: safeId(row.user_id, "User ID"), username: row.username, content: row.content,
          rating: row.rating === null ? null : Number(row.rating), createdAt: row.created_at,
          moviePhotoUrl: row.movie_photo_url, userAvatarUrl: row.user_avatar_url,
        })), reviewCount.rows[0]?.total ?? "0"),
        journal: toPage(articleContent, articleCount.rows[0]?.total ?? "0"),
      };
    } finally {
      connection.release();
    }
  },
  async getMovieDetails(id: number): Promise<MovieDetailsResponse | null> {
    const connection = await pool.connect();
    try {
      await connection.queryObject("SET ROLE rewind_edge_reader");
      const [movieResult, genreResult, directorResult, producerResult, actorResult, ratingResult, similarResult] = await Promise.all([
        connection.queryObject<{
          id: string;
          imdb_id: string | null;
          original_language: string | null;
          tmdb_id: string | null;
          title: string;
          duration_minutes: string | null;
          release_date: string | null;
          age_rating: string | null;
          rating: string | null;
          short_plot: string | null;
          photo_url: string | null;
          backdrop_url: string | null;
          trailer_url: string | null;
        }>({
          text: `SELECT id::text AS id, imdb_id, original_language, tmdb_id::text AS tmdb_id, title,
                        duration_minutes::text AS duration_minutes, release_date::text AS release_date,
                        age_rating, rating::text AS rating, short_plot, photo_url, backdrop_url, trailer_url
                 FROM rewind.movies WHERE id = $1`,
          args: [id],
        }),
        connection.queryObject<{ id: string; name: string }>({
          text: `SELECT g.id::text AS id, g.name
                 FROM rewind.movie_genres mg JOIN rewind.genres g ON g.id = mg.genre_id
                 WHERE mg.movie_id = $1 ORDER BY g.name ASC`,
          args: [id],
        }),
        connection.queryObject<{ id: string; name: string; photo_url: string | null }>({
          text: `SELECT d.id::text AS id, d.name, d.photo_url
                 FROM rewind.movie_directors md JOIN rewind.directors d ON d.id = md.director_id
                 WHERE md.movie_id = $1 ORDER BY d.name ASC`,
          args: [id],
        }),
        connection.queryObject<{ id: string; name: string; photo_url: string | null }>({
          text: `SELECT p.id::text AS id, p.name, p.photo_url
                 FROM rewind.movie_producers mp JOIN rewind.producers p ON p.id = mp.producer_id
                 WHERE mp.movie_id = $1 ORDER BY p.name ASC, p.id ASC`,
          args: [id],
        }),
        connection.queryObject<{
          id: string;
          name: string;
          photo_url: string | null;
          character_name: string | null;
          cast_order: string | null;
        }>({
          text: `SELECT a.id::text AS id, a.name, a.photo_url, ma.character_name,
                        ma.cast_order::text AS cast_order
                 FROM rewind.movie_actors ma JOIN rewind.actors a ON a.id = ma.actor_id
                 WHERE ma.movie_id = $1 ORDER BY ma.cast_order NULLS LAST, a.name ASC`,
          args: [id],
        }),
        connection.queryObject<{
          source: string;
          rating: string;
          votes_count: string | null;
          last_updated_at: string;
        }>({
          text: `SELECT source, rating::text AS rating, votes_count::text AS votes_count,
                        to_char(last_updated_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS last_updated_at
                 FROM rewind.external_ratings WHERE movie_id = $1 ORDER BY source ASC`,
          args: [id],
        }),
        connection.queryObject<{
          id: string;
          title: string;
          release_date: string | null;
          rating: string | null;
          photo_url: string | null;
        }>({
          text: `SELECT m.id::text AS id, m.title, m.release_date::text AS release_date,
                        m.rating::text AS rating, m.photo_url
                 FROM rewind.similar_movies sm JOIN rewind.movies m ON m.id = sm.similar_movie_id
                 WHERE sm.movie_id = $1
                 ORDER BY m.release_date DESC NULLS LAST, m.id DESC`,
          args: [id],
        }),
      ]);
      const first = movieResult.rows[0];
      if (!first) return null;
      const safeId = (value: string, field: string): number => {
        const numericId = Number(value);
        if (!Number.isSafeInteger(numericId)) throw new Error(`${field} is outside the safe JSON integer range`);
        return numericId;
      };
      const nullableNumber = (value: string | null): number | null => value === null ? null : Number(value);
      const content = (row: { id: string; title: string; release_date: string | null; rating: string | null; photo_url: string | null }) => ({
        id: safeId(row.id, "Movie ID"),
        title: row.title,
        releaseDate: row.release_date,
        rating: nullableNumber(row.rating),
        photoUrl: row.photo_url,
      });
      return {
        id: safeId(first.id, "Movie ID"),
        imdbId: first.imdb_id,
        originalLanguage: first.original_language,
        tmdbId: nullableNumber(first.tmdb_id),
        title: first.title,
        durationMinutes: nullableNumber(first.duration_minutes),
        releaseDate: first.release_date,
        ageRating: first.age_rating,
        rating: nullableNumber(first.rating),
        shortPlot: first.short_plot,
        photoUrl: first.photo_url,
        backdropUrl: first.backdrop_url,
        trailerUrl: first.trailer_url,
        genres: genreResult.rows.map(row => ({ id: safeId(row.id, "Genre ID"), name: row.name })),
        directors: directorResult.rows.map(row => ({ id: safeId(row.id, "Director ID"), name: row.name, photoUrl: row.photo_url })),
        producers: producerResult.rows.map(row => ({ id: safeId(row.id, "Producer ID"), name: row.name, photoUrl: row.photo_url })),
        actors: actorResult.rows.map(row => ({
          id: safeId(row.id, "Actor ID"),
          name: row.name,
          photoUrl: row.photo_url,
          characterName: row.character_name,
          castOrder: nullableNumber(row.cast_order),
        })),
        externalRatings: ratingResult.rows.map(row => ({
          source: row.source,
          rating: Number(row.rating),
          votesCount: nullableNumber(row.votes_count),
          lastUpdatedAt: row.last_updated_at,
        })),
        similarMovies: similarResult.rows.map(content),
        myFlags: null,
      };
    } finally {
      connection.release();
    }
  },
  async searchPeople(params: PersonSearchParams): Promise<PersonSearchResult> {
    const peopleTable = params.type === "ACTOR" ? "actors" : params.type === "DIRECTOR" ? "directors" : "producers";
    const relationTable = params.type === "ACTOR" ? "movie_actors" : params.type === "DIRECTOR" ? "movie_directors" : "movie_producers";
    const relationPersonColumn = params.type === "ACTOR" ? "actor_id" : params.type === "DIRECTOR" ? "director_id" : "producer_id";
    const personType = params.type;
    const connection = await pool.connect();
    try {
      await connection.queryObject("SET ROLE rewind_edge_reader");
      const filter = params.q === null ? "" : "WHERE LOWER(p.name) LIKE '%' || LOWER($1) || '%'";
      const countArgs = params.q === null ? [] : [params.q];
      const pageArgs = params.q === null
        ? [params.size, params.page * params.size]
        : [params.q, params.size, params.page * params.size];
      const sizeArg = pageArgs.length - 1;
      const offsetArg = pageArgs.length;
      const [countResult, peopleResult] = await Promise.all([
        connection.queryObject<{ total: string }>({
          text: `SELECT COUNT(*)::text AS total FROM rewind.${peopleTable} p ${filter}`,
          args: countArgs,
        }),
        connection.queryObject<{
          id: string;
          name: string;
          photo_url: string | null;
          film_count: string;
        }>({
          text: `SELECT p.id::text AS id, p.name, p.photo_url,
                        COUNT(DISTINCT r.movie_id)::text AS film_count
                 FROM rewind.${peopleTable} p
                 LEFT JOIN rewind.${relationTable} r ON r.${relationPersonColumn} = p.id
                 ${filter}
                 GROUP BY p.id, p.name, p.photo_url
                 ORDER BY LOWER(p.name), p.id
                 LIMIT $${sizeArg} OFFSET $${offsetArg}`,
          args: pageArgs,
        }),
      ]);
      const totalElements = Number(countResult.rows[0]?.total ?? "0");
      const content = peopleResult.rows.map((person) => {
        const id = Number(person.id);
        if (!Number.isSafeInteger(id)) throw new Error("Person ID is outside the safe JSON integer range");
        return {
          id,
          name: person.name,
          photoUrl: person.photo_url,
          type: personType,
          filmCount: Number(person.film_count),
        };
      });
      return {
        content,
        totalElements,
        totalPages: Math.ceil(totalElements / params.size),
        number: params.page,
      };
    } finally {
      connection.release();
    }
  },
  async getPublicReviewFeed(feed, page, size) {
    const connection = await pool.connect();
    try {
      await connection.queryObject("SET ROLE rewind_edge_app");
      const countResult = await connection.queryObject<{ total: string }>({
        text: `SELECT COUNT(*)::text AS total
               FROM rewind.reviews r JOIN rewind.users author ON author.id = r.user_id
               WHERE r.is_hidden = FALSE AND author.is_active = TRUE`,
      });
      const rows = await connection.queryObject<{
        id: string; movie_id: string; movie_title: string; user_id: string; username: string;
        content: string; rating: string | null; created_at: string; movie_photo_url: string | null;
        user_avatar_url: string | null;
      }>({
        text: feed === "recent"
          ? `SELECT r.id::text AS id, r.movie_id::text AS movie_id, m.title AS movie_title,
                    author.id::text AS user_id, author.username, r.content, r.rating::text AS rating,
                    r.created_at::text AS created_at, m.photo_url AS movie_photo_url,
                    author.avatar_url AS user_avatar_url
             FROM rewind.reviews r
             JOIN rewind.users author ON author.id = r.user_id
             JOIN rewind.movies m ON m.id = r.movie_id
             WHERE r.is_hidden = FALSE AND author.is_active = TRUE
             ORDER BY r.created_at DESC, r.id DESC LIMIT $1 OFFSET $2`
          : `SELECT r.id::text AS id, r.movie_id::text AS movie_id, m.title AS movie_title,
                    author.id::text AS user_id, author.username, r.content, r.rating::text AS rating,
                    r.created_at::text AS created_at, m.photo_url AS movie_photo_url,
                    author.avatar_url AS user_avatar_url
             FROM rewind.reviews r
             JOIN rewind.users author ON author.id = r.user_id
             JOIN rewind.movies m ON m.id = r.movie_id
             LEFT JOIN rewind.review_likes rl ON rl.review_id = r.id
             LEFT JOIN rewind.users liker ON liker.id = rl.user_id AND liker.is_active = TRUE
             WHERE r.is_hidden = FALSE AND author.is_active = TRUE
             GROUP BY r.id, m.title, author.id, author.username, r.content, r.rating,
                      r.created_at, m.photo_url, author.avatar_url
             ORDER BY COUNT(liker.id) DESC, r.created_at DESC, r.id DESC LIMIT $1 OFFSET $2`,
        args: [size, page * size],
      });
      const toId = (value: string) => {
        const id = Number(value);
        if (!Number.isSafeInteger(id)) throw new Error("Review feed ID is outside the safe JSON integer range.");
        return id;
      };
      const totalElements = Number(countResult.rows[0]?.total ?? "0");
      const content = rows.rows.map((row) => ({
        id: toId(row.id), movieId: toId(row.movie_id), movieTitle: row.movie_title,
        userId: toId(row.user_id), username: row.username, content: row.content,
        rating: row.rating === null ? null : Number(row.rating), createdAt: row.created_at,
        moviePhotoUrl: row.movie_photo_url, userAvatarUrl: row.user_avatar_url,
      }));
      return { content, totalPages: Math.ceil(totalElements / size), totalElements, number: page };
    } finally {
      connection.release();
    }
  },
  async getMovieReviews(movieId, page, size): Promise<ReviewPageResponse> {
    const connection = await pool.connect();
    try {
      await connection.queryObject("SET ROLE rewind_edge_app");
      const [count, rows] = await Promise.all([
        connection.queryObject<{ total: string }>({
          text: `SELECT COUNT(*)::text AS total FROM rewind.reviews r
                 JOIN rewind.users author ON author.id = r.user_id
                 WHERE r.movie_id = $1 AND r.is_hidden = FALSE AND author.is_active = TRUE`,
          args: [movieId],
        }),
        connection.queryObject<{
          id: string; user_id: string; username: string; user_avatar_url: string | null;
          content: string; rating: number | null; created_at: string;
        }>({
          text: `SELECT r.id::text AS id, author.id::text AS user_id, author.username,
                        author.avatar_url AS user_avatar_url, r.content, r.rating, r.created_at::text AS created_at
                 FROM rewind.reviews r JOIN rewind.users author ON author.id = r.user_id
                 WHERE r.movie_id = $1 AND r.is_hidden = FALSE AND author.is_active = TRUE
                 ORDER BY r.created_at DESC, r.id DESC LIMIT $2 OFFSET $3`,
          args: [movieId, size, page * size],
        }),
      ]);
      const totalElements = Number(count.rows[0]?.total ?? "0");
      return {
        content: rows.rows.map(reviewResponse), totalPages: Math.ceil(totalElements / size), totalElements, number: page,
      };
    } finally { connection.release(); }
  },
  async getMyMovieReview(authUser, movieId): Promise<ReviewResponse | null> {
    const { connection, userId } = await beginUserTransaction(authUser);
    try {
      const result = await connection.queryObject<{
        id: string; user_id: string; username: string; user_avatar_url: string | null;
        content: string; rating: number | null; created_at: string;
      }>({
        text: `SELECT r.id::text AS id, author.id::text AS user_id, author.username,
                      author.avatar_url AS user_avatar_url, r.content, r.rating, r.created_at::text AS created_at
               FROM rewind.reviews r JOIN rewind.users author ON author.id = r.user_id
               WHERE r.user_id = $1 AND r.movie_id = $2`,
        args: [userId, movieId],
      });
      await connection.queryObject("COMMIT");
      return result.rows[0] ? reviewResponse(result.rows[0]) : null;
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },
  async createReview(authUser, movieId, content, rating): Promise<ReviewResponse> {
    const { connection, userId } = await beginUserTransaction(authUser);
    try {
      const movie = await connection.queryObject({ text: "SELECT 1 FROM rewind.movies WHERE id = $1", args: [movieId] });
      if (!movie.rows.length) throw new RewindApiError(400, "Movie not found");
      const inserted = await connection.queryObject<{ id: string }>(
        { text: `INSERT INTO rewind.reviews (user_id, movie_id, content, rating)
                 VALUES ($1, $2, $3, $4) ON CONFLICT (user_id, movie_id) DO NOTHING RETURNING id::text AS id`,
          args: [userId, movieId, content, rating] },
      );
      if (!inserted.rows[0]) throw new RewindApiError(409, "You already reviewed this movie");
      const reviewId = safeId(inserted.rows[0].id, "Review ID");
      await connection.queryObject({
        text: `INSERT INTO rewind.ratings (user_id, movie_id, rating) VALUES ($1, $2, $3)
               ON CONFLICT (user_id, movie_id) DO UPDATE SET rating = EXCLUDED.rating`,
        args: [userId, movieId, rating],
      });
      await connection.queryObject({
        text: "INSERT INTO rewind.user_activities (user_id, activity_type, movie_id, review_id) VALUES ($1, 'REVIEW', $2, $3)",
        args: [userId, movieId, reviewId],
      });
      const saved = await connection.queryObject<{
        id: string; user_id: string; username: string; user_avatar_url: string | null;
        content: string; rating: number | null; created_at: string;
      }>({
        text: `SELECT r.id::text AS id, author.id::text AS user_id, author.username,
                      author.avatar_url AS user_avatar_url, r.content, r.rating, r.created_at::text AS created_at
               FROM rewind.reviews r JOIN rewind.users author ON author.id = r.user_id WHERE r.id = $1`,
        args: [reviewId],
      });
      if (!saved.rows[0]) throw new Error("Review insert was not persisted.");
      await connection.queryObject("COMMIT");
      return reviewResponse(saved.rows[0]);
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },
  async getReviewDetails(reviewId): Promise<ReviewDetailsResponse | null> {
    const connection = await pool.connect();
    try {
      await connection.queryObject("SET ROLE rewind_edge_app");
      const result = await connection.queryObject<{
        id: string; content: string; rating: number | null; created_at: string;
        author_id: string; username: string; display_name: string | null; avatar_url: string | null;
        movie_id: string; title: string; release_date: string | null; duration_minutes: number | null;
        age_rating: string | null; photo_url: string | null; backdrop_url: string | null; trailer_url: string | null;
      }>({
        text: `SELECT r.id::text AS id, r.content, r.rating, r.created_at::text AS created_at,
                      author.id::text AS author_id, author.username, author.display_name, author.avatar_url,
                      m.id::text AS movie_id, m.title, m.release_date::text AS release_date,
                      m.duration_minutes, m.age_rating, m.photo_url, m.backdrop_url, m.trailer_url
               FROM rewind.reviews r JOIN rewind.users author ON author.id = r.user_id
               JOIN rewind.movies m ON m.id = r.movie_id
               WHERE r.id = $1 AND r.is_hidden = FALSE AND author.is_active = TRUE`,
        args: [reviewId],
      });
      const review = result.rows[0];
      if (!review) return null;
      const [likes, likedBy] = await Promise.all([
        connection.queryObject<{ total: string }>({
          text: `SELECT COUNT(*)::text AS total FROM rewind.review_likes rl
                 JOIN rewind.users liker ON liker.id = rl.user_id
                 WHERE rl.review_id = $1 AND liker.is_active = TRUE`, args: [reviewId],
        }),
        connection.queryObject<{
          id: string; username: string; display_name: string | null; avatar_url: string | null;
        }>({
          text: `SELECT liker.id::text AS id, liker.username, liker.display_name, liker.avatar_url
                 FROM rewind.review_likes rl JOIN rewind.users liker ON liker.id = rl.user_id
                 WHERE rl.review_id = $1 AND liker.is_active = TRUE
                 ORDER BY rl.created_at DESC, rl.id DESC LIMIT 12`, args: [reviewId],
        }),
      ]);
      return {
        id: safeId(review.id, "Review ID"), content: review.content, rating: review.rating,
        createdAt: review.created_at,
        author: { id: safeId(review.author_id, "User ID"), username: review.username,
          displayName: review.display_name, avatarUrl: review.avatar_url },
        movie: { id: safeId(review.movie_id, "Movie ID"), title: review.title,
          releaseDate: review.release_date, durationMinutes: review.duration_minutes, ageRating: review.age_rating,
          photoUrl: review.photo_url, backdropUrl: review.backdrop_url, trailerUrl: review.trailer_url },
        likes: Number(likes.rows[0]?.total ?? "0"),
        likedBy: likedBy.rows.map((liker) => ({ id: safeId(liker.id, "User ID"), username: liker.username,
          displayName: liker.display_name, avatarUrl: liker.avatar_url })),
      };
    } finally { connection.release(); }
  },
  async updateMyReview(authUser, reviewId, update: ReviewMutationRequest): Promise<ReviewResponse | null> {
    const { connection, userId } = await beginUserTransaction(authUser);
    try {
      const updated = await connection.queryObject<{ id: string }>(
        { text: `UPDATE rewind.reviews SET
                   content = CASE WHEN $3 THEN $4 ELSE content END,
                   rating = CASE WHEN $5 THEN $6 ELSE rating END,
                   updated_at = CURRENT_TIMESTAMP
                 WHERE id = $1 AND user_id = $2 RETURNING id::text AS id`,
          args: [reviewId, userId, Object.hasOwn(update, "content"), update.content ?? null,
            Object.hasOwn(update, "rating") && update.rating !== null, update.rating ?? null] },
      );
      if (!updated.rows[0]) throw new RewindApiError(400, "Review not found");
      if (update.rating !== undefined && update.rating !== null) {
        const movie = await connection.queryObject<{ movie_id: string }>(
          { text: "SELECT movie_id::text AS movie_id FROM rewind.reviews WHERE id = $1", args: [reviewId] },
        );
        await connection.queryObject({
          text: `INSERT INTO rewind.ratings (user_id, movie_id, rating) VALUES ($1, $2, $3)
                 ON CONFLICT (user_id, movie_id) DO UPDATE SET rating = EXCLUDED.rating`,
          args: [userId, Number(movie.rows[0].movie_id), update.rating],
        });
      }
      const saved = await connection.queryObject<{
        id: string; user_id: string; username: string; user_avatar_url: string | null;
        content: string; rating: number | null; created_at: string;
      }>({
        text: `SELECT r.id::text AS id, author.id::text AS user_id, author.username,
                      author.avatar_url AS user_avatar_url, r.content, r.rating, r.created_at::text AS created_at
               FROM rewind.reviews r JOIN rewind.users author ON author.id = r.user_id WHERE r.id = $1`,
        args: [reviewId],
      });
      await connection.queryObject("COMMIT");
      return saved.rows[0] ? reviewResponse(saved.rows[0]) : null;
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },
  async deleteMyReview(authUser, reviewId): Promise<boolean> {
    const { connection, userId } = await beginUserTransaction(authUser);
    try {
      const result = await connection.queryObject({ text: "DELETE FROM rewind.reviews WHERE id = $1 AND user_id = $2 RETURNING id", args: [reviewId, userId] });
      await connection.queryObject("COMMIT");
      if (result.rows.length === 0) throw new RewindApiError(400, "Review not found");
      return true;
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },
  async getMyReviewReport(authUser, reviewId): Promise<ReviewReportStatusResponse | null> {
    const { connection, userId } = await beginUserTransaction(authUser);
    try {
      const visible = await connection.queryObject<{ id: string; user_id: string }>(
        { text: `SELECT r.id::text AS id, r.user_id::text AS user_id
                 FROM rewind.reviews r JOIN rewind.users author ON author.id=r.user_id
                 WHERE r.id=$1 AND r.is_hidden=FALSE AND author.is_active=TRUE`, args: [reviewId] },
      );
      if (!visible.rows[0]) { await connection.queryObject("COMMIT"); return null; }
      if (safeId(visible.rows[0].user_id, "Review author ID") === userId) {
        await connection.queryObject("COMMIT");
        return { reported: false, report: null };
      }
      const result = await connection.queryObject<{ id: string; reason: ReviewReportReason; created_at: string }>({
        text: `SELECT id::text AS id, reason, created_at::text AS created_at
               FROM rewind.review_reports WHERE review_id=$1 AND reporter_id=$2 AND status='OPEN'`, args: [reviewId, userId],
      });
      await connection.queryObject("COMMIT");
      const row = result.rows[0];
      return row ? { reported: true, report: { id: safeId(row.id, "Report ID"), reason: row.reason, createdAt: row.created_at } }
        : { reported: false, report: null };
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },
  async reportReview(authUser, reviewId, reason): Promise<ReviewReportResponse | null> {
    const { connection, userId } = await beginUserTransaction(authUser);
    try {
      const findExisting = async () => connection.queryObject<{ id: string; reason: ReviewReportReason; created_at: string }>({
        text: `SELECT rr.id::text AS id, rr.reason, rr.created_at::text AS created_at
               FROM rewind.review_reports rr
               JOIN rewind.reviews r ON r.id=rr.review_id
               JOIN rewind.users author ON author.id=r.user_id
               WHERE rr.review_id=$1 AND rr.reporter_id=$2 AND rr.status='OPEN' AND r.is_hidden=FALSE AND author.is_active=TRUE`,
        args: [reviewId, userId],
      });
      const existing = await findExisting();
      if (existing.rows[0]) {
        const row = existing.rows[0];
        await connection.queryObject("COMMIT");
        return { id: safeId(row.id, "Report ID"), reason: row.reason, createdAt: row.created_at };
      }
      const inserted = await connection.queryObject<{ id: string; reason: ReviewReportReason; created_at: string }>({
        text: `INSERT INTO rewind.review_reports (review_id, reporter_id, reason)
               SELECT r.id, $2, $3
               FROM rewind.reviews r JOIN rewind.users author ON author.id=r.user_id
               WHERE r.id=$1 AND r.user_id<>$2 AND r.is_hidden=FALSE AND author.is_active=TRUE
               ON CONFLICT (review_id, reporter_id) WHERE status='OPEN' DO NOTHING
               RETURNING id::text AS id, reason, created_at::text AS created_at`,
        args: [reviewId, userId, reason],
      });
      const row = inserted.rows[0] ?? (await findExisting()).rows[0];
      await connection.queryObject("COMMIT");
      return row ? { id: safeId(row.id, "Report ID"), reason: row.reason, createdAt: row.created_at } : null;
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },
  async getReviewComments(reviewId, page, size): Promise<CommentPageResponse> {
    const connection = await pool.connect();
    try {
      await connection.queryObject("SET ROLE rewind_edge_app");
      const visible = await connection.queryObject({
        text: `SELECT 1 FROM rewind.reviews r JOIN rewind.users author ON author.id = r.user_id
               WHERE r.id = $1 AND r.is_hidden = FALSE AND author.is_active = TRUE`, args: [reviewId],
      });
      if (!visible.rows.length) throw new RewindApiError(404, "Review not found");
      const [count, rows] = await Promise.all([
        connection.queryObject<{ total: string }>({
          text: `SELECT COUNT(*)::text AS total FROM rewind.comments c
                 JOIN rewind.users author ON author.id = c.user_id
                 WHERE c.review_id = $1 AND c.is_hidden = FALSE AND author.is_active = TRUE`, args: [reviewId],
        }),
        connection.queryObject<{
          id: string; review_id: string; user_id: string; username: string; user_avatar_url: string | null;
          content: string; created_at: string; updated_at: string;
        }>({
          text: `SELECT c.id::text AS id, c.review_id::text AS review_id, author.id::text AS user_id,
                        author.username, author.avatar_url AS user_avatar_url, c.content,
                        c.created_at::text AS created_at, c.updated_at::text AS updated_at
                 FROM rewind.comments c JOIN rewind.users author ON author.id = c.user_id
                 WHERE c.review_id = $1 AND c.is_hidden = FALSE AND author.is_active = TRUE
                 ORDER BY c.created_at ASC, c.id ASC LIMIT $2 OFFSET $3`,
          args: [reviewId, size, page * size],
        }),
      ]);
      const totalElements = Number(count.rows[0]?.total ?? "0");
      return { content: rows.rows.map(commentResponse), totalPages: Math.ceil(totalElements / size), totalElements, number: page };
    } finally { connection.release(); }
  },
  async createReviewComment(authUser, reviewId, text): Promise<CommentResponse | null> {
    const { connection, userId } = await beginUserTransaction(authUser);
    try {
      const review = await connection.queryObject({
        text: `SELECT 1 FROM rewind.reviews r JOIN rewind.users author ON author.id = r.user_id
               WHERE r.id = $1 AND r.is_hidden = FALSE AND author.is_active = TRUE`, args: [reviewId],
      });
      if (!review.rows.length) { await connection.queryObject("COMMIT"); return null; }
      const inserted = await connection.queryObject<{ id: string }>({
        text: "INSERT INTO rewind.comments (review_id, user_id, content) VALUES ($1, $2, $3) RETURNING id::text AS id",
        args: [reviewId, userId, text.trim()],
      });
      const commentId = safeId(inserted.rows[0].id, "Comment ID");
      const result = await connection.queryObject<{
        id: string; review_id: string; user_id: string; username: string; user_avatar_url: string | null;
        content: string; created_at: string; updated_at: string;
      }>({
        text: `SELECT c.id::text AS id, c.review_id::text AS review_id, author.id::text AS user_id,
                      author.username, author.avatar_url AS user_avatar_url, c.content,
                      c.created_at::text AS created_at, c.updated_at::text AS updated_at
               FROM rewind.comments c JOIN rewind.users author ON author.id = c.user_id WHERE c.id = $1`,
        args: [commentId],
      });
      await connection.queryObject("COMMIT");
      return result.rows[0] ? commentResponse(result.rows[0]) : null;
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },
  async updateReviewComment(authUser, commentId, text): Promise<CommentResponse | null | "FORBIDDEN"> {
    const { connection, userId } = await beginUserTransaction(authUser);
    try {
      const owner = await connection.queryObject<{ user_id: string }>(
        { text: "SELECT user_id::text AS user_id FROM rewind.comments WHERE id = $1", args: [commentId] },
      );
      if (!owner.rows[0]) { await connection.queryObject("COMMIT"); return null; }
      if (safeId(owner.rows[0].user_id, "User ID") !== userId) { await connection.queryObject("COMMIT"); return "FORBIDDEN"; }
      await connection.queryObject({
        text: "UPDATE rewind.comments SET content = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $1 AND user_id = $2",
        args: [commentId, userId, text.trim()],
      });
      const result = await connection.queryObject<{
        id: string; review_id: string; user_id: string; username: string; user_avatar_url: string | null;
        content: string; created_at: string; updated_at: string;
      }>({
        text: `SELECT c.id::text AS id, c.review_id::text AS review_id, author.id::text AS user_id,
                      author.username, author.avatar_url AS user_avatar_url, c.content,
                      c.created_at::text AS created_at, c.updated_at::text AS updated_at
               FROM rewind.comments c JOIN rewind.users author ON author.id = c.user_id WHERE c.id = $1`,
        args: [commentId],
      });
      await connection.queryObject("COMMIT");
      return result.rows[0] ? commentResponse(result.rows[0]) : null;
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },
  async deleteReviewComment(authUser, commentId): Promise<"OK" | "NOT_FOUND" | "FORBIDDEN"> {
    const { connection, userId } = await beginUserTransaction(authUser);
    try {
      const result = await connection.queryObject<{ user_id: string; role: string }>(
        { text: `SELECT c.user_id::text AS user_id, actor.role FROM rewind.comments c
                 CROSS JOIN rewind.users actor WHERE c.id = $1 AND actor.id = $2`, args: [commentId, userId] },
      );
      const row = result.rows[0];
      if (!row) { await connection.queryObject("COMMIT"); return "NOT_FOUND"; }
      if (safeId(row.user_id, "User ID") !== userId && row.role !== "ADMIN") {
        await connection.queryObject("COMMIT"); return "FORBIDDEN";
      }
      await connection.queryObject({ text: "DELETE FROM rewind.comments WHERE id = $1", args: [commentId] });
      await connection.queryObject("COMMIT");
      return "OK";
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },
  async getReviewLikes(reviewId): Promise<number | null> {
    const connection = await pool.connect();
    try {
      await connection.queryObject("SET ROLE rewind_edge_app");
      const result = await connection.queryObject<{ total: string }>({
        text: `SELECT COUNT(liker.id)::text AS total FROM rewind.reviews r
               JOIN rewind.users author ON author.id = r.user_id
               LEFT JOIN rewind.review_likes rl ON rl.review_id = r.id
               LEFT JOIN rewind.users liker ON liker.id = rl.user_id AND liker.is_active = TRUE
               WHERE r.id = $1 AND r.is_hidden = FALSE AND author.is_active = TRUE
               GROUP BY r.id`, args: [reviewId],
      });
      return result.rows[0] ? Number(result.rows[0].total) : null;
    } finally { connection.release(); }
  },
  async getReviewLikeStatus(authUser, reviewId): Promise<{ liked: boolean; likes: number } | null> {
    const { connection, userId } = await beginUserTransaction(authUser);
    try {
      const result = await connection.queryObject<{ liked: boolean; likes: string }>(
        { text: `SELECT EXISTS (SELECT 1 FROM rewind.review_likes mine
                                  WHERE mine.review_id = r.id AND mine.user_id = $2) AS liked,
                        COUNT(liker.id)::text AS likes
                 FROM rewind.reviews r JOIN rewind.users author ON author.id = r.user_id
                 LEFT JOIN rewind.review_likes rl ON rl.review_id = r.id
                 LEFT JOIN rewind.users liker ON liker.id = rl.user_id AND liker.is_active = TRUE
                 WHERE r.id = $1 AND r.is_hidden = FALSE AND author.is_active = TRUE
                 GROUP BY r.id`, args: [reviewId, userId] },
      );
      await connection.queryObject("COMMIT");
      return result.rows[0] ? { liked: result.rows[0].liked, likes: Number(result.rows[0].likes) } : null;
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },
  async likeReview(authUser, reviewId): Promise<boolean> {
    const { connection, userId } = await beginUserTransaction(authUser);
    try {
      const review = await connection.queryObject<{ user_id: string }>(
        { text: `SELECT r.user_id::text AS user_id FROM rewind.reviews r
                 JOIN rewind.users author ON author.id = r.user_id
                 WHERE r.id = $1 AND r.is_hidden = FALSE AND author.is_active = TRUE`, args: [reviewId] },
      );
      if (!review.rows[0]) { await connection.queryObject("COMMIT"); return false; }
      const inserted = await connection.queryObject({
        text: `INSERT INTO rewind.review_likes (review_id, user_id) VALUES ($1, $2)
               ON CONFLICT (review_id, user_id) DO NOTHING RETURNING id`, args: [reviewId, userId],
      });
      const recipientId = safeId(review.rows[0].user_id, "User ID");
      if (inserted.rows.length > 0 && recipientId !== userId) {
        const preference = await connection.queryObject<{ enabled: boolean }>(
          { text: `SELECT COALESCE((SELECT review_likes_enabled FROM rewind.notification_preferences
                                   WHERE user_id = $1), TRUE) AS enabled`, args: [recipientId] },
        );
        if (preference.rows[0]?.enabled !== false) {
          await connection.queryObject({
            text: `INSERT INTO rewind.notifications (recipient_id, actor_id, notification_type, review_id)
                   VALUES ($1, $2, 'REVIEW_LIKED', $3)`, args: [recipientId, userId, reviewId],
          });
        }
      }
      await connection.queryObject("COMMIT");
      return true;
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },
  async unlikeReview(authUser, reviewId): Promise<boolean> {
    const { connection, userId } = await beginUserTransaction(authUser);
    try {
      const visible = await connection.queryObject({
        text: `SELECT 1 FROM rewind.reviews r JOIN rewind.users author ON author.id = r.user_id
               WHERE r.id = $1 AND r.is_hidden = FALSE AND author.is_active = TRUE`, args: [reviewId],
      });
      if (!visible.rows.length) { await connection.queryObject("COMMIT"); return false; }
      await connection.queryObject({ text: "DELETE FROM rewind.review_likes WHERE review_id = $1 AND user_id = $2", args: [reviewId, userId] });
      await connection.queryObject("COMMIT");
      return true;
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },
  async getPublicLists(feed, tag, page, size) {
    const connection = await pool.connect();
    try {
      await connection.queryObject("SET ROLE rewind_edge_app");
      const tagFilter = feed === "all" && tag !== null;
      const teamFilter = feed === "team" ? " AND owner.is_hq = TRUE" : "";
      const featuredFilter = feed === "featured" ? " AND l.featured_position IS NOT NULL" : "";
      const predicate = tagFilter
        ? `l.is_public = TRUE AND l.list_type = 'CUSTOM' AND owner.is_active = TRUE
           AND EXISTS (SELECT 1 FROM rewind.list_tags lt JOIN rewind.tags t ON t.id = lt.tag_id
                       WHERE lt.list_id = l.id AND t.slug = $1)`
        : `l.is_public = TRUE AND l.list_type = 'CUSTOM' AND owner.is_active = TRUE`;
      const countJoin = feed === "recently-liked"
        ? ` JOIN rewind.list_likes count_like ON count_like.list_id = l.id
            JOIN rewind.users count_liker ON count_liker.id = count_like.user_id AND count_liker.is_active = TRUE`
        : "";
      const filterArgs = tagFilter ? [tag] : [];
      const countResult = await connection.queryObject<{ total: string }>({
        text: `SELECT COUNT(${feed === "recently-liked" ? "DISTINCT l.id" : "*"})::text AS total
               FROM rewind.lists l JOIN rewind.users owner ON owner.id = l.user_id${countJoin}
               WHERE ${predicate}${teamFilter}${featuredFilter}`,
        args: filterArgs,
      });
      const orderBy = feed === "featured"
        ? `l.featured_position ASC, l.id DESC`
        : feed === "popular"
        ? `likes DESC, l.updated_at DESC, l.id DESC`
        : feed === "recently-liked"
        ? `recent_like_at DESC NULLS LAST, l.id DESC`
        : `l.updated_at DESC, l.id DESC`;
      let extraJoin = "";
      let extraSelect = "";
      if (feed === "popular") {
        extraSelect = `, (SELECT COUNT(*)::text FROM rewind.list_likes ll
                         JOIN rewind.users liker ON liker.id = ll.user_id AND liker.is_active = TRUE
                         WHERE ll.list_id = l.id) AS likes`;
      } else if (feed === "recently-liked") {
        extraJoin = ` JOIN (SELECT ll.list_id, MAX(ll.created_at) AS recent_like_at
                            FROM rewind.list_likes ll JOIN rewind.users liker
                              ON liker.id = ll.user_id AND liker.is_active = TRUE
                            GROUP BY ll.list_id) liked ON liked.list_id = l.id`;
        extraSelect = ", liked.recent_like_at::text AS recent_like_at";
      }
      const listArgs = tagFilter ? [tag, size, page * size] : [size, page * size];
      const rows = await connection.queryObject<{
        id: string; name: string; description: string | null; is_public: boolean;
        owner_id: string; owner_username: string; owner_avatar_url: string | null;
        like_count: string; item_count: string;
      }>({
        text: `SELECT l.id::text AS id, l.name, l.description, l.is_public,
                      owner.id::text AS owner_id, owner.username AS owner_username, owner.avatar_url AS owner_avatar_url,
                      (SELECT COUNT(*)::text FROM rewind.list_likes ll JOIN rewind.users liker
                        ON liker.id = ll.user_id AND liker.is_active = TRUE WHERE ll.list_id = l.id) AS like_count,
                      (SELECT COUNT(*)::text FROM rewind.list_items li WHERE li.list_id = l.id) AS item_count
                      ${extraSelect}
               FROM rewind.lists l JOIN rewind.users owner ON owner.id = l.user_id${extraJoin}
               WHERE ${predicate}${teamFilter}${featuredFilter}
               ORDER BY ${orderBy} LIMIT $${tagFilter ? 2 : 1} OFFSET $${tagFilter ? 3 : 2}`,
        args: listArgs,
      });
      const ids = rows.rows.map((row) => Number(row.id));
      const tagsByList = new Map<number, string[]>();
      const previewsByList = new Map<number, { id: number; title: string; releaseDate: string | null; rating: number | null; photoUrl: string | null }[]>();
      if (ids.length > 0) {
        const [tagsResult, previewsResult] = await Promise.all([
          connection.queryObject<{ list_id: string; name: string }>({
            text: `SELECT lt.list_id::text AS list_id, t.name FROM rewind.list_tags lt
                   JOIN rewind.tags t ON t.id = lt.tag_id WHERE lt.list_id = ANY($1::bigint[])
                   ORDER BY lt.list_id, t.name`, args: [ids],
          }),
          connection.queryObject<{
            list_id: string; movie_id: string; title: string; release_date: string | null;
            rating: string | null; photo_url: string | null;
          }>({
            text: `SELECT list_id::text AS list_id, movie_id::text AS movie_id, title, release_date, rating, photo_url
                   FROM (SELECT li.list_id, li.id, li.position, m.id AS movie_id, m.title,
                                m.release_date::text AS release_date, m.rating::text AS rating, m.photo_url,
                                ROW_NUMBER() OVER (PARTITION BY li.list_id ORDER BY li.position ASC NULLS LAST, li.id ASC) AS rn
                         FROM rewind.list_items li JOIN rewind.movies m ON m.id = li.movie_id
                         WHERE li.list_id = ANY($1::bigint[])) ranked WHERE rn <= 3
                   ORDER BY list_id, rn`, args: [ids],
          }),
        ]);
        for (const row of tagsResult.rows) {
          const id = Number(row.list_id);
          const values = tagsByList.get(id) ?? [];
          values.push(row.name);
          tagsByList.set(id, values);
        }
        for (const row of previewsResult.rows) {
          const id = Number(row.list_id);
          const values = previewsByList.get(id) ?? [];
          values.push({ id: Number(row.movie_id), title: row.title,
            releaseDate: row.release_date, rating: row.rating === null ? null : Number(row.rating), photoUrl: row.photo_url });
          previewsByList.set(id, values);
        }
      }
      const toId = (value: string) => {
        const id = Number(value);
        if (!Number.isSafeInteger(id) || id <= 0) throw new Error("List ID is outside the safe JSON integer range.");
        return id;
      };
      const content: PublicListCardResponse[] = rows.rows.map((row) => {
        const id = toId(row.id);
        return {
          id, name: row.name, description: row.description, isPublic: row.is_public,
          ownerId: toId(row.owner_id), ownerUsername: row.owner_username, ownerAvatarUrl: row.owner_avatar_url,
          tags: tagsByList.get(id) ?? [], likeCount: Number(row.like_count), itemCount: Number(row.item_count),
          previewMovies: previewsByList.get(id) ?? [],
        };
      });
      const totalElements = Number(countResult.rows[0]?.total ?? "0");
      return { content, totalPages: Math.ceil(totalElements / size), totalElements, number: page };
    } finally {
      connection.release();
    }
  },
  async getPublicList(listId): Promise<PublicListDetailsResponse | null> {
    const connection = await pool.connect();
    try {
      await connection.queryObject("SET ROLE rewind_edge_app");
      const listResult = await connection.queryObject<{
        id: string; name: string; description: string | null; owner_id: string;
        owner_username: string; owner_avatar_url: string | null;
      }>({
        text: `SELECT l.id::text AS id, l.name, l.description, owner.id::text AS owner_id,
                      owner.username AS owner_username, owner.avatar_url AS owner_avatar_url
               FROM rewind.lists l JOIN rewind.users owner ON owner.id = l.user_id
               WHERE l.id = $1 AND l.list_type = 'CUSTOM' AND l.is_public = TRUE AND owner.is_active = TRUE`,
        args: [listId],
      });
      const list = listResult.rows[0];
      if (!list) return null;
      const [tags, likes, movies] = await Promise.all([
        connection.queryObject<{ name: string }>({
          text: `SELECT t.name FROM rewind.list_tags lt JOIN rewind.tags t ON t.id = lt.tag_id
                 WHERE lt.list_id = $1 ORDER BY t.name`, args: [listId],
        }),
        connection.queryObject<{ total: string }>({
          text: `SELECT COUNT(*)::text AS total FROM rewind.list_likes ll JOIN rewind.users liker
                 ON liker.id = ll.user_id AND liker.is_active = TRUE WHERE ll.list_id = $1`, args: [listId],
        }),
        connection.queryObject<{
          id: string; title: string; release_date: string | null; rating: string | null; photo_url: string | null;
        }>({
          text: `SELECT m.id::text AS id, m.title, m.release_date::text AS release_date,
                        m.rating::text AS rating, m.photo_url
                 FROM rewind.list_items li JOIN rewind.movies m ON m.id = li.movie_id
                 WHERE li.list_id = $1 ORDER BY li.position ASC NULLS LAST, li.id ASC`, args: [listId],
        }),
      ]);
      const toId = (value: string) => {
        const id = Number(value);
        if (!Number.isSafeInteger(id) || id <= 0) throw new Error("List ID is outside the safe JSON integer range.");
        return id;
      };
      return {
        id: toId(list.id), name: list.name, description: list.description,
        ownerId: toId(list.owner_id), ownerUsername: list.owner_username,
        ownerAvatarUrl: list.owner_avatar_url, tags: tags.rows.map((row) => row.name),
        likeCount: Number(likes.rows[0]?.total ?? "0"),
        movies: movies.rows.map((movie) => ({
          id: toId(movie.id), title: movie.title, releaseDate: movie.release_date,
          rating: movie.rating === null ? null : Number(movie.rating), photoUrl: movie.photo_url,
        })),
      };
    } finally {
      connection.release();
    }
  },
  async getPublicListLikeStatus(authUser, listId) {
    const { connection, userId } = await beginUserTransaction(authUser);
    try {
      const visible = await connection.queryObject({
        text: `SELECT 1 FROM rewind.lists l JOIN rewind.users owner ON owner.id = l.user_id
               WHERE l.id = $1 AND l.list_type = 'CUSTOM' AND l.is_public = TRUE AND owner.is_active = TRUE`,
        args: [listId],
      });
      if (!visible.rows.length) { await connection.queryObject("COMMIT"); return null; }
      const result = await connection.queryObject<{ liked: boolean; likes: string }>({
        text: `SELECT EXISTS(SELECT 1 FROM rewind.list_likes WHERE list_id = $1 AND user_id = $2) AS liked,
                      (SELECT COUNT(*)::text FROM rewind.list_likes ll JOIN rewind.users liker
                       ON liker.id = ll.user_id AND liker.is_active = TRUE WHERE ll.list_id = $1) AS likes`,
        args: [listId, userId],
      });
      await connection.queryObject("COMMIT");
      return { liked: result.rows[0]?.liked ?? false, likes: Number(result.rows[0]?.likes ?? "0") };
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },
  async likePublicList(authUser, listId) {
    const { connection, userId } = await beginUserTransaction(authUser);
    try {
      const visible = await connection.queryObject({
        text: `SELECT 1 FROM rewind.lists l JOIN rewind.users owner ON owner.id = l.user_id
               WHERE l.id = $1 AND l.list_type = 'CUSTOM' AND l.is_public = TRUE AND owner.is_active = TRUE`,
        args: [listId],
      });
      if (!visible.rows.length) { await connection.queryObject("COMMIT"); return false; }
      await connection.queryObject({
        text: `INSERT INTO rewind.list_likes (list_id, user_id) VALUES ($1, $2)
               ON CONFLICT (list_id, user_id) DO NOTHING`, args: [listId, userId],
      });
      await connection.queryObject("COMMIT");
      return true;
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },
  async unlikePublicList(authUser, listId) {
    const { connection, userId } = await beginUserTransaction(authUser);
    try {
      const visible = await connection.queryObject({
        text: `SELECT 1 FROM rewind.lists l JOIN rewind.users owner ON owner.id = l.user_id
               WHERE l.id = $1 AND l.list_type = 'CUSTOM' AND l.is_public = TRUE AND owner.is_active = TRUE`,
        args: [listId],
      });
      if (!visible.rows.length) { await connection.queryObject("COMMIT"); return false; }
      await connection.queryObject({ text: "DELETE FROM rewind.list_likes WHERE list_id = $1 AND user_id = $2", args: [listId, userId] });
      await connection.queryObject("COMMIT");
      return true;
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },
  async getPersonFilmography(type, id, genreId, sort): Promise<PersonFilmographyResponse | null> {
    const personTable = type === "ACTOR" ? "actors" : type === "DIRECTOR" ? "directors" : "producers";
    const relation = type === "ACTOR" ? "movie_actors" : type === "DIRECTOR" ? "movie_directors" : "movie_producers";
    const personColumn = type === "ACTOR" ? "actor_id" : type === "DIRECTOR" ? "director_id" : "producer_id";
    const connection = await pool.connect();
    try {
      await connection.queryObject("SET ROLE rewind_edge_reader");
      const personResult = await connection.queryObject<{
        id: string;
        name: string;
        photo_url: string | null;
      }>({
        text: `SELECT id::text AS id, name, photo_url FROM rewind.${personTable} WHERE id = $1`,
        args: [id],
      });
      const person = personResult.rows[0];
      if (!person) return null;

      const sortColumns: Record<string, string> = {
        newest: "m.release_date DESC NULLS LAST",
        oldest: "m.release_date ASC NULLS LAST",
        rating: "m.rating DESC NULLS LAST",
        title: "LOWER(m.title) ASC",
      };
      const ordering = sortColumns[sort] ?? sortColumns.newest;
      const genreFilter = genreId === null
        ? ""
        : "AND EXISTS (SELECT 1 FROM rewind.movie_genres mg WHERE mg.movie_id = m.id AND mg.genre_id = $2)";
      const relationAlias = type === "ACTOR" ? "ma" : type === "DIRECTOR" ? "md" : "mp";
      const characterColumn = type === "ACTOR" ? "ma.character_name" : "NULL::text";
      const args = genreId === null ? [id] : [id, genreId];
      const filmResult = await connection.queryObject<{
        id: string;
        title: string;
        release_date: string | null;
        rating: string | null;
        photo_url: string | null;
        character_name: string | null;
      }>({
        text: `SELECT m.id::text AS id, m.title, m.release_date::text AS release_date,
                      m.rating::text AS rating, m.photo_url,
                      ${characterColumn} AS character_name
               FROM rewind.${relation} ${relationAlias}
               JOIN rewind.movies m ON m.id = ${relationAlias}.movie_id
               WHERE ${relationAlias}.${personColumn} = $1 ${genreFilter}
               ORDER BY ${ordering}, m.id ASC`,
        args,
      });
      const safeId = (value: string, field: string): number => {
        const numericId = Number(value);
        if (!Number.isSafeInteger(numericId)) throw new Error(`${field} is outside the safe JSON integer range`);
        return numericId;
      };
      return {
        id: safeId(person.id, "Person ID"),
        name: person.name,
        photoUrl: person.photo_url,
        type,
        films: filmResult.rows.map((film) => ({
          id: safeId(film.id, "Movie ID"),
          title: film.title,
          releaseDate: film.release_date,
          rating: film.rating === null ? null : Number(film.rating),
          photoUrl: film.photo_url,
          characterName: film.character_name,
        })),
      };
    } finally {
      connection.release();
    }
  },
  async getOrCreateCurrentUser(authUser) {
    const connection = await pool.connect();
    try {
      await connection.queryObject("BEGIN");
      await connection.queryObject("SET LOCAL ROLE rewind_edge_app");
      await connection.queryObject({
        text: "SELECT set_config('rewind.supabase_user_id', $1, TRUE)",
        args: [authUser.id],
      });
      const existing = await connection.queryObject<{
        id: string; username: string; role: string; avatar_url: string | null; is_active: boolean;
      }>({
        text: `SELECT id::text AS id, username, role, avatar_url, is_active
               FROM rewind.users WHERE supabase_user_id = $1`,
        args: [authUser.id],
      });
      if (existing.rows[0]) {
        const row = existing.rows[0];
        if (!row.is_active) throw new RewindApiError(403, "Account is inactive");
        const userId = Number(row.id);
        if (!Number.isSafeInteger(userId) || userId <= 0) throw new Error("The REWIND user ID is invalid.");
        await connection.queryObject({
          text: "SELECT set_config('rewind.user_id', $1, TRUE)",
          args: [String(userId)],
        });
        await ensureSystemLists(connection, userId);
        await connection.queryObject("COMMIT");
        return { id: userId, username: row.username, role: row.role, avatarUrl: row.avatar_url };
      }

      const unusablePassword = `supabase-auth:${crypto.randomUUID()}`;
      const requested = authUser.username ?? `user_${authUser.id.slice(0, 8)}`;
      let row: { id: string; username: string; role: string; avatar_url: string | null } | undefined;
      for (let attempt = 0; attempt < 5; attempt++) {
        const suffix = attempt === 0 ? "" : `_${crypto.randomUUID().slice(0, 6)}`;
        const username = `${requested.slice(0, 50 - suffix.length)}${suffix}`;
        try {
          const inserted = await connection.queryObject<{
            id: string; username: string; role: string; avatar_url: string | null;
          }>({
            text: `INSERT INTO rewind.users (username, email, password_hash, supabase_user_id)
                   VALUES ($1, $2, $3, $4)
                   ON CONFLICT DO NOTHING
                   RETURNING id::text AS id, username, role, avatar_url`,
            args: [username, authUser.email, unusablePassword, authUser.id],
          });
          row = inserted.rows[0];
          if (row) break;

          // A concurrent /users/me request may have linked this UUID while
          // the insert was waiting on the unique constraint.
          const linked = await connection.queryObject<{
            id: string; username: string; role: string; avatar_url: string | null; is_active: boolean;
          }>({
            text: `SELECT id::text AS id, username, role, avatar_url, is_active
                   FROM rewind.users WHERE supabase_user_id = $1`,
            args: [authUser.id],
          });
          if (linked.rows[0]) {
            if (!linked.rows[0].is_active) throw new RewindApiError(403, "Account is inactive");
            row = linked.rows[0];
            break;
          }
        } catch (error) {
          throw error;
        }
      }
      if (!row) throw new Error("Unable to allocate a unique username.");
      const userId = Number(row.id);
      if (!Number.isSafeInteger(userId) || userId <= 0) throw new Error("The REWIND user ID is invalid.");
      await connection.queryObject({
        text: "SELECT set_config('rewind.user_id', $1, TRUE)",
        args: [String(userId)],
      });
      await ensureSystemLists(connection, userId);
      await connection.queryObject("COMMIT");
      return { id: userId, username: row.username, role: row.role, avatarUrl: row.avatar_url };
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally {
      connection.release();
    }
  },
  async getMyProfile(authUser) {
    const { connection, userId } = await beginUserTransaction(authUser);
    try {
      const userResult = await connection.queryObject<{
        id: string; username: string; display_name: string | null; role: string; avatar_url: string | null; bio: string | null;
      }>({
        text: `SELECT id::text AS id, username, display_name, role, avatar_url, bio
               FROM rewind.users WHERE id = $1`,
        args: [userId],
      });
      const user = userResult.rows[0];
      if (!user) throw new Error("The REWIND profile is unavailable.");
      const [statsResult, listsResult, ratingsResult, reviewsResult] = await Promise.all([
        connection.queryObject<{
          ratings: string; reviews: string; watched: string; watchlist: string; favorites: string;
        }>({
          text: `SELECT
            (SELECT COUNT(*)::text FROM rewind.ratings WHERE user_id = $1) AS ratings,
            (SELECT COUNT(*)::text FROM rewind.reviews WHERE user_id = $1 AND is_hidden = FALSE) AS reviews,
            (SELECT COUNT(*)::text FROM rewind.list_items i JOIN rewind.lists l ON l.id = i.list_id WHERE l.user_id = $1 AND l.list_type = 'WATCHED') AS watched,
            (SELECT COUNT(*)::text FROM rewind.list_items i JOIN rewind.lists l ON l.id = i.list_id WHERE l.user_id = $1 AND l.list_type = 'WATCHLIST') AS watchlist,
            (SELECT COUNT(*)::text FROM rewind.list_items i JOIN rewind.lists l ON l.id = i.list_id WHERE l.user_id = $1 AND l.list_type = 'FAVORITES') AS favorites`,
          args: [userId],
        }),
        connection.queryObject<{ id: string; name: string; list_type: string; is_public: boolean }>({
          text: `SELECT id::text AS id, name, list_type, is_public FROM rewind.lists
                 WHERE user_id = $1 ORDER BY updated_at DESC, id DESC`,
          args: [userId],
        }),
        connection.queryObject<{
          movie_id: string; title: string; photo_url: string | null; rating: number; updated_at: string;
        }>({
          text: `SELECT r.movie_id::text AS movie_id, m.title, m.photo_url, r.rating, r.updated_at::text AS updated_at
                 FROM rewind.ratings r JOIN rewind.movies m ON m.id = r.movie_id
                 WHERE r.user_id = $1 ORDER BY r.updated_at DESC, r.id DESC LIMIT 10`,
          args: [userId],
        }),
        connection.queryObject<{
          review_id: string; movie_id: string; title: string; photo_url: string | null; content: string; updated_at: string;
        }>({
          text: `SELECT r.id::text AS review_id, r.movie_id::text AS movie_id, m.title, m.photo_url,
                        r.content, r.updated_at::text AS updated_at
                 FROM rewind.reviews r JOIN rewind.movies m ON m.id = r.movie_id
                 WHERE r.user_id = $1 ORDER BY r.updated_at DESC, r.id DESC LIMIT 10`,
          args: [userId],
        }),
      ]);
      const numericId = Number(user.id);
      if (!Number.isSafeInteger(numericId)) throw new Error("User ID is outside the safe JSON integer range.");
      const toId = (value: string) => {
        const id = Number(value);
        if (!Number.isSafeInteger(id)) throw new Error("Profile item ID is outside the safe JSON integer range.");
        return id;
      };
      const stats = statsResult.rows[0];
      const response = {
        id: numericId,
        username: user.username,
        displayName: user.display_name?.trim() || user.username,
        email: authUser.email,
        role: user.role,
        avatarUrl: user.avatar_url,
        bio: user.bio,
        supabaseLinked: true,
        stats: {
          ratings: Number(stats?.ratings ?? 0),
          reviews: Number(stats?.reviews ?? 0),
          watched: Number(stats?.watched ?? 0),
          watchlist: Number(stats?.watchlist ?? 0),
          favorites: Number(stats?.favorites ?? 0),
        },
        lists: listsResult.rows.map((row) => ({
          id: toId(row.id), name: row.name, listType: row.list_type, isPublic: row.is_public,
        })),
        recentRatings: ratingsResult.rows.map((row) => ({
          movieId: toId(row.movie_id), movieTitle: row.title, moviePhotoUrl: row.photo_url,
          rating: row.rating, updatedAt: row.updated_at,
        })),
        recentReviews: reviewsResult.rows.map((row) => ({
          reviewId: toId(row.review_id), movieId: toId(row.movie_id), movieTitle: row.title,
          moviePhotoUrl: row.photo_url, content: row.content, updatedAt: row.updated_at,
        })),
      };
      await connection.queryObject("COMMIT");
      return response;
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally {
      connection.release();
    }
  },
  async updateMyProfile(authUser, update) {
    const { connection, userId } = await beginUserTransaction(authUser);
    try {
      await connection.queryObject({
        text: `UPDATE rewind.users
               SET display_name = CASE WHEN $2 THEN NULLIF(BTRIM($3), '') ELSE display_name END,
                   avatar_url = CASE WHEN $4 THEN NULLIF(BTRIM($5), '') ELSE avatar_url END,
                   bio = CASE WHEN $6 THEN NULLIF(BTRIM($7), '') ELSE bio END
               WHERE id = $1`,
        args: [
          userId,
          Object.hasOwn(update, "displayName"), update.displayName ?? null,
          Object.hasOwn(update, "avatarUrl"), update.avatarUrl ?? null,
          Object.hasOwn(update, "bio"), update.bio ?? null,
        ],
      });
      await connection.queryObject("COMMIT");
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally {
      connection.release();
    }
  },
  async deleteMyAccount(authUser): Promise<boolean> {
    // Do not remove the REWIND profile until the server has the key needed to
    // delete its hosted identity. Provider outages are retryable after enqueue;
    // missing credentials are a setup error and must fail before any mutation.
    if (!supabaseUrl || !supabaseSecretKey) {
      throw new RewindApiError(503, "Account deletion is not configured");
    }
    const { connection } = await beginUserTransaction(authUser);
    try {
      const result = await connection.queryObject<{ deleted: boolean }>({
        text: "SELECT rewind.delete_current_supabase_profile() AS deleted",
      });
      await connection.queryObject("COMMIT");
      return result.rows[0]?.deleted === true;
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally {
      connection.release();
    }
  },
  async getMyProfileCollection(authUser, collection, page, size) {
    const { connection, userId } = await beginUserTransaction(authUser);
    try {
      let count = 0;
      let content: unknown[] = [];
      const offset = page * size;
      if (collection === "watched" || collection === "watchlist" || collection === "favorites") {
        const listType = collection === "favorites" ? "FAVORITES" : collection.toUpperCase();
        const args = [userId, listType];
        const [countResult, rows] = await Promise.all([
          connection.queryObject<{ total: string }>({
            text: `SELECT COUNT(*)::text AS total FROM rewind.list_items i
                   JOIN rewind.lists l ON l.id = i.list_id
                   WHERE l.user_id = $1 AND l.list_type = $2`, args,
          }),
          connection.queryObject<{
            id: string; title: string; release_date: string | null; rating: string | null; photo_url: string | null;
          }>({
            text: `SELECT m.id::text AS id, m.title, m.release_date::text AS release_date,
                          m.rating::text AS rating, m.photo_url
                   FROM rewind.list_items i JOIN rewind.lists l ON l.id = i.list_id
                   JOIN rewind.movies m ON m.id = i.movie_id
                   WHERE l.user_id = $1 AND l.list_type = $2
                   ORDER BY i.added_at DESC, i.id DESC LIMIT $3 OFFSET $4`,
            args: [...args, size, offset],
          }),
        ]);
        count = Number(countResult.rows[0]?.total ?? 0);
        content = rows.rows.map((row) => ({
          id: Number(row.id), title: row.title, releaseDate: row.release_date,
          rating: row.rating === null ? null : Number(row.rating), photoUrl: row.photo_url,
        }));
      } else if (collection === "ratings") {
        const [countResult, rows] = await Promise.all([
          connection.queryObject<{ total: string }>({
            text: "SELECT COUNT(*)::text AS total FROM rewind.ratings WHERE user_id = $1", args: [userId],
          }),
          connection.queryObject<{
            movie_id: string; title: string; photo_url: string | null; rating: number; updated_at: string;
          }>({
            text: `SELECT r.movie_id::text AS movie_id, m.title, m.photo_url, r.rating, r.updated_at::text AS updated_at
                   FROM rewind.ratings r JOIN rewind.movies m ON m.id = r.movie_id
                   WHERE r.user_id = $1 ORDER BY r.updated_at DESC, r.id DESC LIMIT $2 OFFSET $3`,
            args: [userId, size, offset],
          }),
        ]);
        count = Number(countResult.rows[0]?.total ?? 0);
        content = rows.rows.map((row) => ({
          movieId: Number(row.movie_id), movieTitle: row.title, moviePhotoUrl: row.photo_url,
          rating: row.rating, updatedAt: row.updated_at,
        }));
      } else {
        const [countResult, rows] = await Promise.all([
          connection.queryObject<{ total: string }>({
            text: "SELECT COUNT(*)::text AS total FROM rewind.reviews WHERE user_id = $1", args: [userId],
          }),
          connection.queryObject<{
            review_id: string; movie_id: string; title: string; photo_url: string | null; content: string; updated_at: string;
          }>({
            text: `SELECT r.id::text AS review_id, r.movie_id::text AS movie_id, m.title, m.photo_url,
                          r.content, r.updated_at::text AS updated_at
                   FROM rewind.reviews r JOIN rewind.movies m ON m.id = r.movie_id
                   WHERE r.user_id = $1 ORDER BY r.updated_at DESC, r.id DESC LIMIT $2 OFFSET $3`,
            args: [userId, size, offset],
          }),
        ]);
        count = Number(countResult.rows[0]?.total ?? 0);
        content = rows.rows.map((row) => ({
          reviewId: Number(row.review_id), movieId: Number(row.movie_id), movieTitle: row.title,
          moviePhotoUrl: row.photo_url, content: row.content, updatedAt: row.updated_at,
        }));
      }
      await connection.queryObject("COMMIT");
      return { content, totalPages: Math.ceil(count / size), totalElements: count, number: page };
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally {
      connection.release();
    }
  },
  async getMyRating(authUser, movieId): Promise<number | null> {
    const { connection, userId } = await beginUserTransaction(authUser);
    try {
      const result = await connection.queryObject<{ rating: number }>({
        text: "SELECT rating FROM rewind.ratings WHERE user_id = $1 AND movie_id = $2",
        args: [userId, movieId],
      });
      await connection.queryObject("COMMIT");
      return result.rows[0]?.rating ?? null;
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally {
      connection.release();
    }
  },
  async getMyMovieStatus(authUser, movieId) {
    const { connection, userId } = await beginUserTransaction(authUser);
    try {
      const result = await connection.queryObject<{ list_type: string; rating: number | null; has_movie: boolean }>(
        {
          text: `SELECT l.list_type, r.rating, (li.id IS NOT NULL) AS has_movie
                 FROM rewind.lists l
                 LEFT JOIN rewind.list_items li ON li.list_id = l.id AND li.movie_id = $2
                 LEFT JOIN rewind.ratings r ON r.user_id = l.user_id AND r.movie_id = $2
                 WHERE l.user_id = $1 AND l.list_type IN ('WATCHED', 'WATCHLIST', 'FAVORITES')`,
          args: [userId, movieId],
        },
      );
      await connection.queryObject("COMMIT");
      return {
        inWatchlist: result.rows.some((row) => row.list_type === "WATCHLIST" && row.has_movie),
        watched: result.rows.some((row) => row.list_type === "WATCHED" && row.has_movie),
        favorite: result.rows.some((row) => row.list_type === "FAVORITES" && row.has_movie),
        myRating: result.rows.find((row) => row.rating !== null)?.rating ?? null,
      };
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally {
      connection.release();
    }
  },
  async setMyMovieFlag(authUser, movieId, flag) {
    const { connection, userId } = await beginUserTransaction(authUser);
    try {
      const movie = await connection.queryObject({ text: "SELECT 1 FROM rewind.movies WHERE id = $1", args: [movieId] });
      if (!movie.rows.length) throw new Error("Movie not found.");
      const listType = flag === "favorite" ? "FAVORITES" : flag.toUpperCase();
      const list = await connection.queryObject<{ id: string }>({
        text: "SELECT id::text AS id FROM rewind.lists WHERE user_id = $1 AND list_type = $2",
        args: [userId, listType],
      });
      if (!list.rows[0]) throw new Error("System list is unavailable.");
      const inserted = await connection.queryObject({
        text: `INSERT INTO rewind.list_items (list_id, movie_id)
               VALUES ($1, $2) ON CONFLICT (list_id, movie_id) DO NOTHING RETURNING id`,
        args: [Number(list.rows[0].id), movieId],
      });
      if (flag === "watched" && inserted.rows.length > 0) {
        await connection.queryObject({
          text: "INSERT INTO rewind.user_activities (user_id, activity_type, movie_id) VALUES ($1, 'WATCHED', $2)",
          args: [userId, movieId],
        });
      }
      await connection.queryObject("COMMIT");
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally {
      connection.release();
    }
  },
  async deleteMyMovieFlag(authUser, movieId, flag) {
    const { connection, userId } = await beginUserTransaction(authUser);
    try {
      const listType = flag === "favorite" ? "FAVORITES" : flag.toUpperCase();
      await connection.queryObject({
        text: `DELETE FROM rewind.list_items li
               USING rewind.lists l
               WHERE li.list_id = l.id AND l.user_id = $1 AND l.list_type = $2 AND li.movie_id = $3`,
        args: [userId, listType, movieId],
      });
      await connection.queryObject("COMMIT");
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally {
      connection.release();
    }
  },
  async setMyRating(authUser, movieId, rating): Promise<void> {
    const { connection, userId } = await beginUserTransaction(authUser);
    try {
      const movie = await connection.queryObject({ text: "SELECT 1 FROM rewind.movies WHERE id = $1", args: [movieId] });
      if (!movie.rows.length) throw new Error("Movie not found.");
      await connection.queryObject({
        text: `INSERT INTO rewind.ratings (user_id, movie_id, rating)
               VALUES ($1, $2, $3)
               ON CONFLICT (user_id, movie_id) DO UPDATE SET rating = EXCLUDED.rating`,
        args: [userId, movieId, rating],
      });
      await connection.queryObject({
        text: "INSERT INTO rewind.user_activities (user_id, activity_type, movie_id) VALUES ($1, 'RATING', $2)",
        args: [userId, movieId],
      });
      await connection.queryObject("COMMIT");
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally {
      connection.release();
    }
  },
  async deleteMyRating(authUser, movieId): Promise<void> {
    const { connection, userId } = await beginUserTransaction(authUser);
    try {
      await connection.queryObject({
        text: "DELETE FROM rewind.ratings WHERE user_id = $1 AND movie_id = $2",
        args: [userId, movieId],
      });
      await connection.queryObject("COMMIT");
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally {
      connection.release();
    }
  },
}, allowedOrigins, {
  async verifyAccessToken(token: string): Promise<HostedAuthUser | null> {
    if (!supabaseUrl || !supabaseAnonKey) return null;
    const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { apikey: supabaseAnonKey, Authorization: `Bearer ${token}` },
    });
    if (!response.ok) return null;
    const user = await response.json();
    if (typeof user?.id !== "string" || typeof user?.email !== "string") return null;
    const metadataUsername = typeof user.user_metadata?.username === "string"
      ? user.user_metadata.username.trim()
      : "";
    const candidate = metadataUsername.replace(/[^\p{L}\p{N}_.-]/gu, "").slice(0, 50);
    const emailPrefix = user.email.split("@")[0].replace(/[^\p{L}\p{N}_.-]/gu, "").slice(0, 40);
    return {
      id: user.id,
      email: user.email,
      emailConfirmed: Boolean(user.email_confirmed_at),
      username: candidate.length >= 3 ? candidate : (emailPrefix.length >= 3 ? emailPrefix : `user_${user.id.slice(0, 8)}`),
    };
  },
  verifyCurrentPassword: verifyHostedPassword,
  changePassword: changeHostedPassword,
  async processPendingIdentityDeletion() { await processPendingIdentityDeletion(); },
}, handleTmdbRefreshRequest);

Deno.serve(async (request) => {
  const response = await handler(request);
  const edgeRuntime = (globalThis as typeof globalThis & { EdgeRuntime?: { waitUntil(promise: Promise<unknown>): void } }).EdgeRuntime;
  if (edgeRuntime) edgeRuntime.waitUntil(processPendingIdentityDeletion().catch(() => undefined));
  return response;
});
