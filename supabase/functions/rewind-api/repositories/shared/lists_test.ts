import { loadPublicListPreviewRows } from "./lists.ts";
import type { PgConnection } from "../../runtime/database.ts";

Deno.test("public-list previews read the five first existing movies in list order", async () => {
  const rows = Array.from({ length: 5 }, (_, index) => ({
    list_id: "23", movie_id: String(80 + index), title: `Existing film ${index + 1}`,
    release_date: null, rating: null, photo_url: `/poster-${index + 1}.jpg`,
  }));
  const queries: Array<{ text: string; args?: unknown[] }> = [];
  const connection = {
    async queryObject(value: string | { text: string; args?: unknown[] }) {
      queries.push(typeof value === "string" ? { text: value } : value);
      return { rows };
    },
  } as unknown as PgConnection;

  const result = await loadPublicListPreviewRows(connection, [23]);
  const query = queries[0];
  if (result.length !== 5 || result[4]?.title !== "Existing film 5"
    || queries.length !== 1 || !query?.text.includes("ROW_NUMBER() OVER (PARTITION BY li.list_id")
    || !query.text.includes("rn <= $2")
    || JSON.stringify(query.args) !== JSON.stringify([[23], 5])) {
    throw new Error(`Public-list preview query must load five ordered existing movies: ${JSON.stringify({ result, query })}`);
  }
});
