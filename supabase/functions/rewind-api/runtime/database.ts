import {
  Pool,
} from "@db/postgres";

const databaseUrl = Deno.env.get("SUPABASE_DB_URL");

if (!databaseUrl) {
  throw new Error("SUPABASE_DB_URL must be available to this Edge Function");
}

// The server-only connection URL never leaves this function. Each checkout
// assumes a narrowly scoped NOLOGIN role for each operation.
export const pool = new Pool(databaseUrl, 1, true);

// A separate connection is held only for the advisory lock. The main pool has
// one connection and must remain available to the normal per-movie transactions.
export const tmdbRefreshLockPool = new Pool(databaseUrl, 1, true);

export type PgConnection = Awaited<ReturnType<typeof pool.connect>>;
