import { createRewindApiHandler, type RewindApiRepository } from "./handler.ts";
import { parseProfileUpdate } from "./http/parsers/profile.ts";
import { RewindApiError } from "./http/errors.ts";
import {
  getProfilePinnedListId,
  saveProfilePinnedList,
} from "./repositories/shared/profile_pin.ts";

function same(actual: unknown, expected: unknown) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(
      `Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`,
    );
  }
}

Deno.test("profile pin parsing accepts positive numeric IDs, explicit clearing and legacy omission", () => {
  same(parseProfileUpdate({ pinnedListId: 12 }), { pinnedListId: 12 });
  same(parseProfileUpdate({ pinnedListId: null }), { pinnedListId: null });
  same(parseProfileUpdate({ displayName: "Reader" }), {
    displayName: "Reader",
  });
  for (
    const value of [
      0,
      -1,
      1.5,
      Number.MAX_SAFE_INTEGER + 1,
      "12",
      false,
      undefined,
      {},
      [],
    ]
  ) {
    same(parseProfileUpdate({ pinnedListId: value }), null);
  }
});

Deno.test("profile pin helper preserves omission, clears explicitly, binds the mapped owner and rejects unavailable lists", async () => {
  const calls: { text: string; args: unknown[] }[] = [];
  let available = true;
  const connection = {
    async queryObject(query: { text: string; args: unknown[] }) {
      calls.push(query);
      return { rows: available ? [{ id: "12", list_id: "12" }] : [] };
    },
  } as unknown as Parameters<typeof saveProfilePinnedList>[0];
  await saveProfilePinnedList(connection, 7, { bio: "Other fields" });
  same(calls.length, 0);
  await saveProfilePinnedList(connection, 7, { pinnedListId: null });
  same(calls[0].args, [7]);
  await saveProfilePinnedList(connection, 7, { pinnedListId: 12 });
  same(calls.slice(1).map((call) => call.args), [[12, 7], [7, 12]]);
  same(await getProfilePinnedListId(connection, 7), 12);
  available = false;
  same(await getProfilePinnedListId(connection, 7), null);
  let rejected = false;
  try {
    await saveProfilePinnedList(connection, 7, { pinnedListId: 99 });
  } catch (error) {
    rejected = error instanceof RewindApiError && error.status === 400;
  }
  same(rejected, true);
  same(calls.filter((call) => call.text.startsWith("INSERT")).length, 1);
});

Deno.test("profile PATCH carries pin changes and the expected account through confirmed authentication", async () => {
  const empty = { content: [], number: 0, totalElements: 0, totalPages: 0 };
  const changes: unknown[] = [];
  const repository: RewindApiRepository = {
    async listGenres() {
      return [];
    },
    async searchMovies() {
      return empty;
    },
    async getMovieDetails() {
      return null;
    },
    async searchPeople() {
      return empty;
    },
    async getPersonFilmography() {
      return null;
    },
    async getMyProfile() {
      return { id: 7, pinnedListId: 12 } as Awaited<
        ReturnType<NonNullable<RewindApiRepository["getMyProfile"]>>
      >;
    },
    async updateMyProfile(actor, update, expected) {
      same(actor.id, "auth-7");
      if (expected !== undefined && expected !== 7) {
        throw new RewindApiError(409, "The signed-in account has changed");
      }
      changes.push(update);
    },
  };
  const handler = createRewindApiHandler(repository, [], {
    async verifyAccessToken(token) {
      return {
        id: "auth-7",
        email: "fixture@example.invalid",
        username: "reader",
        emailConfirmed: token === "confirmed",
      };
    },
  });
  const request = (
    body: unknown,
    query = "?expectedUserId=7",
    token = "confirmed",
  ) =>
    new Request(`https://project.supabase.co/api/profile/me${query}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
  same((await handler(request({ pinnedListId: 12 }))).status, 200);
  same((await handler(request({ pinnedListId: null }))).status, 200);
  same((await handler(request({ bio: "Legacy caller" }, ""))).status, 200);
  same(
    (await handler(request({ pinnedListId: 12 }, "?expectedUserId=6"))).status,
    409,
  );
  same(
    (await handler(request({ pinnedListId: 12 }, "?expectedUserId=0"))).status,
    400,
  );
  same((await handler(request({ pinnedListId: "12" }))).status, 400);
  same(
    (await handler(
      request({ pinnedListId: 12 }, "?expectedUserId=7", "unconfirmed"),
    )).status,
    401,
  );
  same(changes, [{ pinnedListId: 12 }, { pinnedListId: null }, {
    bio: "Legacy caller",
  }]);
});
