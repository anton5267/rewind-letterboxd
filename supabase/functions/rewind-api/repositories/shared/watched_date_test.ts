import { getMyWatchedOn, setMyWatchedOn } from "./watched_date.ts";
import type { PgConnection } from "../../runtime/database.ts";

Deno.test("watched date reads only the member's WATCHED list item and preserves DATE text", async () => {
  let sql = "";
  const connection = { async queryObject(query: string | { text: string; args?: unknown[] }) {
    sql = typeof query === "string" ? query : query.text;
    return { rows: [{ watched_on: "2025-12-18" }] };
  } } as unknown as PgConnection;
  const date = await getMyWatchedOn(connection, 71, 35);
  if (date !== "2025-12-18" || !sql.includes("l.user_id=$1") || !sql.includes("l.list_type='WATCHED'")) {
    throw new Error(`Watched date query/value is not user scoped: ${date} ${sql}`);
  }
});

Deno.test("watched date update creates a watched entry once and updates an existing entry without duplicate activity", async () => {
  const run = async (existing: boolean) => {
    const statements: Array<{ text: string; args: unknown[] }> = [];
    const connection = { async queryObject(query: string | { text: string; args?: unknown[] }) {
      const text = typeof query === "string" ? query : query.text;
      const args = typeof query === "string" ? [] : query.args ?? [];
      statements.push({ text, args });
      if (text.includes("SELECT 1 FROM rewind.movies")) return { rows: [{ movie: 1 }] };
      if (text.includes("SELECT id::text AS id FROM rewind.lists")) return { rows: [{ id: "9" }] };
      if (text.includes("SELECT 1 FROM rewind.list_items")) return { rows: existing ? [{ item: 1 }] : [] };
      if (text.includes("INSERT INTO rewind.list_items")) return { rows: [] };
      if (text.includes("UPDATE rewind.list_items")) return { rows: [] };
      if (text.includes("INSERT INTO rewind.user_activities")) return { rows: [] };
      throw new Error(`Unexpected query: ${text}`);
    } } as unknown as PgConnection;
    await setMyWatchedOn(connection, 71, 35, "2025-12-19");
    return statements;
  };
  const inserted = await run(false);
  const updated = await run(true);
  if (!inserted.some(item => item.text.includes("INSERT INTO rewind.list_items") && JSON.stringify(item.args) === JSON.stringify([9, 35, "2025-12-19"]))
    || !inserted.some(item => item.text.includes("INSERT INTO rewind.user_activities"))
    || !updated.some(item => item.text.includes("UPDATE rewind.list_items") && JSON.stringify(item.args) === JSON.stringify([9, 35, "2025-12-19"]))
    || updated.some(item => item.text.includes("INSERT INTO rewind.user_activities"))) {
    throw new Error(`Watched date insert/update behavior was incorrect: ${JSON.stringify({ inserted, updated })}`);
  }
});
