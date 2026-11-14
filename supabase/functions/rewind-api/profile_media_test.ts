import {
  PROFILE_IMAGE_MAX_BYTES,
  readProfileImage,
  validateProfileImage,
} from "./http/parsers/profile_media.ts";
import { createProfileStorageClient } from "./profile_storage.ts";
import { RewindApiError } from "./http/errors.ts";
import { createRewindApiHandler, type RewindApiRepository } from "./handler.ts";

const png = Uint8Array.from(
  atob(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jB6kAAAAASUVORK5CYII=",
  ),
  (character) => character.charCodeAt(0),
);
function same(actual: unknown, expected: unknown) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(
      `Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`,
    );
  }
}
async function rejected(action: () => unknown, status: number) {
  try {
    await action();
  } catch (error) {
    if (error instanceof RewindApiError && error.status === status) return;
    throw error;
  }
  throw new Error(`Expected HTTP ${status}`);
}

Deno.test("profile image parsing bounds JPEG/PNG dimensions and rejects MIME spoofing and unsupported bodies", async () => {
  const image = validateProfileImage(png, "image/png");
  same([image.width, image.height, image.extension], [1, 1, "png"]);
  const jpeg = new Uint8Array([
    0xff,
    0xd8,
    0xff,
    0xe0,
    0,
    4,
    0,
    0,
    0xff,
    0xc2,
    0,
    17,
    8,
    0,
    24,
    0,
    32,
    3,
    1,
    0x11,
    0,
    2,
    0x11,
    0,
    3,
    0x11,
    0,
    0xff,
    0xd9,
  ]);
  const photo = validateProfileImage(jpeg, "image/jpeg");
  same([photo.width, photo.height, photo.extension], [32, 24, "jpg"]);
  const oversized = png.slice();
  new DataView(oversized.buffer).setUint32(16, 4097);
  const zero = png.slice();
  new DataView(zero.buffer).setUint32(20, 0);
  await rejected(() => validateProfileImage(oversized, "image/png"), 400);
  await rejected(() => validateProfileImage(zero, "image/png"), 400);
  await rejected(() => validateProfileImage(png, "image/jpeg"), 400);
  await rejected(
    () =>
      validateProfileImage(
        new TextEncoder().encode('<svg onload="alert(1)"/>'),
        "image/svg+xml",
      ),
    415,
  );
  await rejected(
    () => validateProfileImage(png.slice(0, 24), "image/png"),
    400,
  );
});

Deno.test("profile image body reading enforces the byte limit for announced and streamed requests", async () => {
  const image = await readProfileImage(
    new Request("https://project.invalid/upload", {
      method: "POST",
      headers: { "Content-Type": "image/png" },
      body: png,
    }),
  );
  same(image.bytes.length, png.length);
  await rejected(
    () =>
      readProfileImage(
        new Request("https://project.invalid/upload", {
          method: "POST",
          headers: {
            "Content-Type": "image/png",
            "Content-Length": String(PROFILE_IMAGE_MAX_BYTES + 1),
          },
          body: png,
        }),
      ),
    413,
  );
  let canceled = false;
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(new Uint8Array(PROFILE_IMAGE_MAX_BYTES + 1));
    },
    cancel() {
      canceled = true;
    },
  });
  await rejected(
    () =>
      readProfileImage(
        new Request("https://project.invalid/upload", {
          method: "POST",
          headers: { "Content-Type": "image/png" },
          body: stream,
        }),
      ),
    413,
  );
  same(canceled, true);
});

Deno.test("profile Storage uses server credentials, immutable object paths and idempotent deletion", async () => {
  const path = "7/avatar/dad9e33b-8b2f-44ab-851f-74db76a81ac7.png";
  const requests: {
    url: string;
    method: string | undefined;
    contentType: string | null;
    body: string | null;
  }[] = [];
  const fetcher: typeof fetch = (input, options) => {
    const headers = new Headers(options?.headers);
    same(headers.get("apikey"), "fixture-server-secret");
    same(headers.get("Authorization"), "Bearer fixture-server-secret");
    requests.push({
      url: String(input),
      method: options?.method,
      contentType: headers.get("Content-Type"),
      body: typeof options?.body === "string" ? options.body : null,
    });
    return Promise.resolve(
      new Response(null, { status: options?.method === "DELETE" ? 404 : 200 }),
    );
  };
  const storage = createProfileStorageClient(
    "https://project.supabase.co/",
    "fixture-server-secret",
    fetcher,
  );
  await storage.upload(path, validateProfileImage(png, "image/png"));
  await storage.remove(path);
  same(requests.map((r) => r.method), ["POST", "DELETE"]);
  same(requests[0].contentType, "image/png");
  same(JSON.parse(requests[1].body!).prefixes, [path]);
  same(
    storage.publicUrl(path),
    `https://project.supabase.co/storage/v1/object/public/rewind-profile-media/${path}`,
  );
  await rejected(() => storage.remove("../another-bucket/object"), 400);
  await rejected(
    () =>
      createProfileStorageClient(undefined, undefined, fetcher).upload(
        path,
        validateProfileImage(png, "image/png"),
      ),
    503,
  );
  same(requests.length, 2);
});

Deno.test("profile media routes require confirmed identity, expected profile ID and validated bytes", async () => {
  const calls: unknown[] = [];
  const empty = { content: [], number: 0, totalElements: 0, totalPages: 0 };
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
    async updateMyProfileMedia(actor, kind, image, expectedUserId) {
      calls.push([actor.id, kind, image?.contentType ?? null, expectedUserId]);
      if (expectedUserId !== 7) {
        throw new RewindApiError(409, "The signed-in account has changed");
      }
      return {
        avatarUrl: kind === "avatar" && image
          ? "https://images.invalid/avatar.png"
          : null,
        bannerUrl: null,
      };
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
    method: string,
    query = "?expectedUserId=7",
    token = "confirmed",
    type = "image/png",
    body = png,
  ) =>
    new Request(
      `https://project.supabase.co/functions/v1/rewind-api/api/profile/me/media/avatar${query}`,
      {
        method,
        headers: { Authorization: `Bearer ${token}`, "Content-Type": type },
        ...(method === "POST" ? { body } : {}),
      },
    );
  same(
    (await handler(request("POST", "?expectedUserId=7", "unconfirmed"))).status,
    401,
  );
  same((await handler(request("POST", ""))).status, 400);
  same((await handler(request("POST", "?expectedUserId=-1"))).status, 400);
  same(
    (await handler(
      request("POST", "?expectedUserId=7", "confirmed", "image/svg+xml"),
    )).status,
    415,
  );
  same(
    (await handler(
      request(
        "POST",
        "?expectedUserId=7",
        "confirmed",
        "image/png",
        png.slice(0, 8),
      ),
    )).status,
    400,
  );
  same(calls, []);
  const saved = await handler(request("POST"));
  same(saved.status, 200);
  same(await saved.json(), {
    avatarUrl: "https://images.invalid/avatar.png",
    bannerUrl: null,
  });
  same((await handler(request("DELETE"))).status, 200);
  same((await handler(request("POST", "?expectedUserId=6"))).status, 409);
  same((await handler(request("GET"))).status, 405);
  same(calls, [["auth-7", "avatar", "image/png", 7], [
    "auth-7",
    "avatar",
    null,
    7,
  ], ["auth-7", "avatar", "image/png", 6]]);
});
