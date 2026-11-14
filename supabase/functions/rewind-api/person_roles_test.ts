import { findRelatedPersonRoles } from "./repositories/shared/person_roles.ts";

function same(actual: unknown, expected: unknown) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(
      `Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`,
    );
  }
}

Deno.test("person role lookup skips missing TMDB identities", async () => {
  const connection = {
    queryObject() {
      throw new Error("Unexpected database call");
    },
  } as unknown as Parameters<typeof findRelatedPersonRoles>[0];
  same(await findRelatedPersonRoles(connection, "ACTOR", null), []);
});

Deno.test("person role lookup binds identity and primary role and returns numeric catalogue IDs", async () => {
  let query: { text: string; args: unknown[] } | undefined;
  const connection = {
    queryObject(statement: { text: string; args: unknown[] }) {
      query = statement;
      return Promise.resolve({ rows: [{ id: "17", type: "PRODUCER" }] });
    },
  } as unknown as Parameters<typeof findRelatedPersonRoles>[0];
  same(await findRelatedPersonRoles(connection, "ACTOR", "880"), [{
    id: 17,
    type: "PRODUCER",
  }]);
  same(query?.args, ["880", "ACTOR"]);
  if (!query || query.text.includes("880") || query.text.includes("name =")) {
    throw new Error("Identity must use a bound TMDB ID");
  }
});

Deno.test("person role lookup rejects catalogue IDs outside the JSON integer range", async () => {
  const connection = {
    queryObject: () =>
      Promise.resolve({ rows: [{ id: "9007199254740992", type: "PRODUCER" }] }),
  } as unknown as Parameters<typeof findRelatedPersonRoles>[0];
  let rejected = false;
  try {
    await findRelatedPersonRoles(connection, "ACTOR", "880");
  } catch {
    rejected = true;
  }
  same(rejected, true);
});
