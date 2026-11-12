import { assertEquals, assertRejects } from "jsr:@std/assert@1.0.14";
import { replaceAdminMovieCredits } from "./admin_movie_credits.ts";

Deno.test("credit replacement validates every linked person before changing joins", async () => {
  const calls: { text: string; args: unknown[] }[] = [];
  const connection = {
    async queryObject<T>(query: string | { text: string; args?: unknown[] }): Promise<{ rows: T[] }> {
      const normalized = typeof query === "string" ? { text: query, args: [] } : { text: query.text, args: query.args ?? [] };
      calls.push(normalized);
      if (normalized.text.startsWith("SELECT id::text")) return { rows: (normalized.args[0] as number[]).map(id => ({ id: String(id) }) as T) };
      return { rows: [] };
    },
  };

  await replaceAdminMovieCredits(connection, 50, {
    actorCredits: [{ actorId: 4, characterName: "Lead", castOrder: 0 }],
    directorIds: [7],
    producerIds: [9],
  });

  const firstMutation = calls.findIndex(call => call.text.startsWith("DELETE"));
  assertEquals(calls.slice(0, firstMutation).map(call => call.text), [
    "SELECT id::text AS id FROM rewind.actors WHERE id = ANY($1::bigint[])",
    "SELECT id::text AS id FROM rewind.directors WHERE id = ANY($1::bigint[])",
    "SELECT id::text AS id FROM rewind.producers WHERE id = ANY($1::bigint[])",
  ]);
  assertEquals(calls.filter(call => call.text.startsWith("DELETE")).length, 3);
  assertEquals(calls.find(call => call.text.startsWith("INSERT INTO rewind.movie_actors"))?.args,
    [50, [4], ["Lead"], [0]]);
});

Deno.test("credit replacement rejects an unknown person before deleting links", async () => {
  const calls: string[] = [];
  const connection = {
    async queryObject<T>(query: string | { text: string; args?: unknown[] }): Promise<{ rows: T[] }> {
      const text = typeof query === "string" ? query : query.text;
      calls.push(text);
      if (text.startsWith("SELECT id::text")) return { rows: [] };
      return { rows: [] };
    },
  };

  await assertRejects(() => replaceAdminMovieCredits(connection, 50, { directorIds: [999] }), Error, "directors were not found");
  assertEquals(calls.some(text => text.startsWith("DELETE")), false);
});

Deno.test("partial credit replacement only changes the submitted relation type", async () => {
  const calls: string[] = [];
  const connection = {
    async queryObject<T>(query: string | { text: string; args?: unknown[] }): Promise<{ rows: T[] }> {
      const text = typeof query === "string" ? query : query.text;
      calls.push(text);
      if (text.startsWith("SELECT id::text")) return { rows: [{ id: "2" }] as T[] };
      return { rows: [] };
    },
  };

  await replaceAdminMovieCredits(connection, 50, { producerIds: [2] });
  assertEquals(calls.filter(text => text.startsWith("DELETE")).map(text => text.split(" ")[2]), ["rewind.movie_producers"]);
});
