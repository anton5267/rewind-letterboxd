import type { HttpRouteContext } from "../context.ts";
import { readProfileImage } from "../parsers/profile_media.ts";
import { parseRouteId } from "../parsers/query.ts";
import { confirmedAuthUser, json, repositoryFailure } from "../response.ts";

const PROFILE_MEDIA_PATH = /^\/api\/profile\/me\/media\/(avatar|banner)$/;

export async function handleProfileMediaRoute(
  context: HttpRouteContext,
): Promise<Response | null> {
  const { request, path, repository, authVerifier, corsHeaders } = context;
  const match = path.match(PROFILE_MEDIA_PATH);
  if (!match) return null;
  if (request.method !== "POST" && request.method !== "DELETE") {
    corsHeaders.set("Allow", "POST, DELETE, OPTIONS");
    return json({ message: "Method not allowed" }, 405, corsHeaders);
  }
  const authUser = await confirmedAuthUser(request, authVerifier);
  if (!authUser) {
    return json({ message: "Authentication required" }, 401, corsHeaders);
  }
  const expectedUserId = parseRouteId(
    new URL(request.url).searchParams.get("expectedUserId") ?? "",
  );
  if (expectedUserId === null) {
    return json(
      { message: "A valid expected user ID is required" },
      400,
      corsHeaders,
    );
  }
  if (!repository.updateMyProfileMedia) {
    return json({ message: "Not found" }, 404, corsHeaders);
  }
  try {
    const image = request.method === "POST"
      ? await readProfileImage(request)
      : null;
    const kind = match[1] === "avatar" ? "avatar" : "banner";
    const result = await repository.updateMyProfileMedia(
      authUser,
      kind,
      image,
      expectedUserId,
    );
    return json(result, 200, corsHeaders);
  } catch (error) {
    return repositoryFailure(
      error,
      "Unable to update profile image",
      corsHeaders,
    );
  }
}
