import type { ProfileMediaUpload } from "./contracts/profile_media.ts";
import { RewindApiError } from "./http/errors.ts";

export const PROFILE_MEDIA_BUCKET = "rewind-profile-media";
const uuid =
  "[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}";
const objectPathPattern = new RegExp(
  `^[1-9][0-9]*/(avatar|banner)/${uuid}[.](jpg|png)$`,
  "i",
);

export function createProfileStorageClient(
  projectUrl: string | undefined,
  secretKey: string | undefined,
  fetcher: typeof fetch = fetch,
) {
  const baseUrl = projectUrl?.replace(/\/$/, "");
  function ensureConfigured() {
    if (!baseUrl || !secretKey) {
      throw new RewindApiError(503, "Profile image storage is not configured");
    }
  }
  function validatePath(path: string) {
    if (!objectPathPattern.test(path)) {
      throw new RewindApiError(400, "Invalid profile image path");
    }
  }
  async function send(path: string, options: RequestInit) {
    ensureConfigured();
    try {
      const headers = new Headers(options.headers);
      headers.set("apikey", secretKey!);
      headers.set("Authorization", `Bearer ${secretKey}`);
      const response = await fetcher(`${baseUrl}/storage/v1${path}`, {
        ...options,
        headers,
        signal: AbortSignal.timeout(20000),
      });
      await response.arrayBuffer();
      if (
        response.ok || (options.method === "DELETE" && response.status === 404)
      ) return;
      throw new RewindApiError(
        response.status === 429 ? 429 : 503,
        "Profile image storage is temporarily unavailable",
      );
    } catch (error) {
      if (error instanceof RewindApiError) throw error;
      throw new RewindApiError(
        503,
        "Profile image storage is temporarily unavailable",
      );
    }
  }
  return {
    ensureConfigured,
    publicUrl(path: string) {
      ensureConfigured();
      validatePath(path);
      return `${baseUrl}/storage/v1/object/public/${PROFILE_MEDIA_BUCKET}/${path}`;
    },
    async upload(path: string, image: ProfileMediaUpload) {
      validatePath(path);
      await send(`/object/${PROFILE_MEDIA_BUCKET}/${path}`, {
        method: "POST",
        body: image.bytes.slice(),
        headers: {
          "Content-Type": image.contentType,
          "cache-control": "max-age=3600",
          "x-upsert": "false",
        },
      });
    },
    async remove(path: string) {
      validatePath(path);
      await send(`/object/${PROFILE_MEDIA_BUCKET}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prefixes: [path] }),
      });
    },
  };
}
