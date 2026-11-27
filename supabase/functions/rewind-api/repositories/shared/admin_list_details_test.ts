import { addAdminListMovie, loadAdminListDetails } from "./admin_list_details.ts";
import type { PgConnection } from "../../runtime/database.ts";

Deno.test("Admin list details scope reports to the list and load ordered published film previews", async () => {
  const statements: string[] = [];
  const connection = {
    async queryObject(query: string | { text: string; args?: unknown[] }) {
      const text = typeof query === "string" ? query : query.text;
      statements.push(text);
      if (text.includes("FROM rewind.lists l JOIN rewind.users")) return { rows: [{
        id: "23", user_id: "71", username: "film-oracle", email: "oracle@example.test", name: "Nolan films",
        description: "A list description", list_type: "CUSTOM", is_public: true, item_count: "2",
        created_at: "2025-12-02T00:00:00Z", updated_at: "2026-11-01T00:00:00Z", featured_position: null, featured_category: null,
      }] };
      if (text.includes("FROM rewind.list_likes")) return { rows: [{ count: "12" }] };
      if (text.includes("FROM rewind.list_reports") && text.includes("COUNT(*)")) return { rows: [{ count: "3" }] };
      if (text.includes("FROM rewind.list_reports lr")) return { rows: [{ id: "91", reason: "SPAM", created_at: "2026-11-20T10:00:00Z" }] };
      if (text.includes("FROM rewind.list_items li JOIN rewind.movies")) return { rows: [{
        id: "8", title: "Oppenheimer", release_date: "2023-07-21", rating: 4.5, photo_url: "/poster.jpg",
      }] };
      if (text.includes("FROM rewind.admin_audit_logs")) return { rows: [{
        id: "3", admin_id: "42", action: "LIST_UPDATED", target_type: "LIST", target_id: "23", metadata: "name changed", created_at: "2026-11-21T10:00:00Z",
      }] };
      throw new Error(`Unexpected query: ${text}`);
    },
  } as unknown as PgConnection;

  const details = await loadAdminListDetails(connection, 23, 91);
  if (!details || details.id !== 23 || details.username !== "film-oracle" || details.email !== "oracle@example.test"
    || details.likeCount !== 12 || details.reportCount !== 3 || details.report?.id !== 91
    || details.films[0]?.id !== 8 || details.history[0]?.action !== "LIST_UPDATED") {
    throw new Error(`Admin list details lost source data: ${JSON.stringify(details)}`);
  }
  const reportQuery = statements.find(text => text.includes("FROM rewind.list_reports lr")) ?? "";
  const filmQuery = statements.find(text => text.includes("FROM rewind.list_items li JOIN rewind.movies")) ?? "";
  if (!reportQuery.includes("lr.list_id=$1") || !reportQuery.includes("lr.status='OPEN'")
    || !filmQuery.includes("m.is_published=TRUE") || !filmQuery.includes("ORDER BY li.position")) {
    throw new Error("Reported-list lookup and film previews must be scoped to open reports and published movies");
  }
});

Deno.test("Admin list details reject a report that is closed or belongs to another list", async () => {
  const connection = {
    async queryObject(query: string | { text: string; args?: unknown[] }) {
      const text = typeof query === "string" ? query : query.text;
      if (text.includes("FROM rewind.lists l JOIN rewind.users")) return { rows: [{
        id: "23", user_id: "71", username: "film-oracle", email: "oracle@example.test", name: "Nolan films",
        description: null, list_type: "CUSTOM", is_public: true, item_count: "0",
        created_at: "2025-12-02T00:00:00Z", updated_at: "2026-11-01T00:00:00Z", featured_position: null, featured_category: null,
      }] };
      if (text.includes("FROM rewind.list_likes")) return { rows: [{ count: "0" }] };
      if (text.includes("FROM rewind.list_reports") && text.includes("COUNT(*)")) return { rows: [{ count: "1" }] };
      if (text.includes("FROM rewind.list_reports lr")) return { rows: [] };
      if (text.includes("FROM rewind.list_items li JOIN rewind.movies")) return { rows: [] };
      if (text.includes("FROM rewind.admin_audit_logs")) return { rows: [] };
      throw new Error(`Unexpected query: ${text}`);
    },
  } as unknown as PgConnection;
  const details = await loadAdminListDetails(connection, 23, 99);
  if (details !== null) throw new Error("A report not attached to this list was returned as valid");
});

Deno.test("Admin list film addition appends the next position and writes an audit record", async () => {
  const statements: Array<{ text: string; args: unknown[] }> = [];
  const connection = {
    async queryObject(query: string | { text: string; args?: unknown[] }) {
      const text = typeof query === "string" ? query : query.text;
      const args = typeof query === "string" ? [] : query.args ?? [];
      statements.push({ text, args });
      if (text.includes("SELECT list_type FROM rewind.lists")) return { rows: [{ list_type: "CUSTOM" }] };
      if (text.includes("SELECT is_published FROM rewind.movies")) return { rows: [{ is_published: true }] };
      if (text.includes("SELECT 1 FROM rewind.list_items")) return { rows: [] };
      if (text.includes("MAX(position)")) return { rows: [{ next_position: 4 }] };
      if (text.includes("INSERT INTO rewind.list_items")) return { rows: [] };
      if (text.includes("INSERT INTO rewind.admin_audit_logs")) return { rows: [] };
      if (text.includes("FROM rewind.lists l JOIN rewind.users")) return { rows: [{
        id: "23", user_id: "71", username: "film-oracle", email: "oracle@example.test", name: "Nolan films",
        description: null, list_type: "CUSTOM", is_public: true, item_count: "1",
        created_at: "2025-12-02T00:00:00Z", updated_at: "2026-11-01T00:00:00Z", featured_position: null, featured_category: null,
      }] };
      if (text.includes("FROM rewind.list_likes") || text.includes("FROM rewind.list_reports")) return { rows: [{ count: "0" }] };
      if (text.includes("FROM rewind.list_items li JOIN rewind.movies")) return { rows: [{
        id: "8", title: "Oppenheimer", release_date: "2023-07-21", rating: 4.5, photo_url: "/poster.jpg",
      }] };
      if (text.includes("FROM rewind.admin_audit_logs")) return { rows: [] };
      throw new Error(`Unexpected query: ${text}`);
    },
  } as unknown as PgConnection;
  const result = await addAdminListMovie(connection, 42, 23, 8);
  const insert = statements.find(query => query.text.includes("INSERT INTO rewind.list_items"));
  const audit = statements.find(query => query.text.includes("INSERT INTO rewind.admin_audit_logs"));
  if (typeof result === "string" || result.films[0]?.id !== 8 || !insert || JSON.stringify(insert.args) !== JSON.stringify([23, 8, 4])
    || audit?.args[1] !== "LIST_FILM_ADDED" || !String(audit.args[4]).includes('"movie":8')) {
    throw new Error(`Film addition did not append/audit correctly: ${JSON.stringify({ result, insert, audit })}`);
  }
});

Deno.test("Admin list film addition refuses system lists, unpublished movies, and duplicates before writing", async () => {
  const run = async (listType: string, published: boolean, duplicate: boolean) => {
    const writes: string[] = [];
    const connection = {
      async queryObject(query: string | { text: string; args?: unknown[] }) {
        const text = typeof query === "string" ? query : query.text;
        if (text.includes("INSERT INTO")) writes.push(text);
        if (text.includes("SELECT list_type FROM rewind.lists")) return { rows: [{ list_type: listType }] };
        if (text.includes("SELECT is_published FROM rewind.movies")) return { rows: [{ is_published: published }] };
        if (text.includes("SELECT 1 FROM rewind.list_items")) return { rows: duplicate ? [{ exists: 1 }] : [] };
        throw new Error(`Unexpected query: ${text}`);
      },
    } as unknown as PgConnection;
    return { result: await addAdminListMovie(connection, 42, 23, 8), writes };
  };
  const systemList = await run("WATCHED", true, false);
  const unpublished = await run("CUSTOM", false, false);
  const duplicate = await run("CUSTOM", true, true);
  if (systemList.result !== "SYSTEM_LIST" || unpublished.result !== "UNPUBLISHED" || duplicate.result !== "DUPLICATE"
    || systemList.writes.length || unpublished.writes.length || duplicate.writes.length) {
    throw new Error("Admin list film addition mutated a protected, unpublished, or duplicate entry");
  }
});
