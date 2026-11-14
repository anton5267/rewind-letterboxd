import { profileMediaRepository } from "./repositories/profile_media.ts";
import { processPendingProfileMediaDeletion } from "./runtime/profile_media.ts";
import { commentsRepository } from "./repositories/comments.ts";
import "./runtime/database.ts";
import { createRewindApiHandler, type RewindApiRepository } from "./handler.ts";
import { apiPath } from "./http/response.ts";
import { allowedOrigins } from "./runtime/config.ts";
import { hostedAuthVerifier, processPendingIdentityDeletion } from "./runtime/identity.ts";
import { handleTmdbRefreshRequest } from "./runtime/tmdb_refresh.ts";
import { journalRepository } from "./repositories/journal.ts";
import { adminUsersRepository } from "./repositories/admin_users.ts";
import { adminListsRepository } from "./repositories/admin_lists.ts";
import { adminOperationsRepository } from "./repositories/admin_operations.ts";
import { adminTmdbRepository } from "./repositories/admin_tmdb.ts";
import { adminMoviesRepository } from "./repositories/admin_movies.ts";
import { notificationsRepository } from "./repositories/notifications.ts";
import { adminModerationRepository } from "./repositories/admin_moderation.ts";
import { messagesRepository } from "./repositories/messages.ts";
import { profileRepository } from "./repositories/profile.ts";
import { socialRepository } from "./repositories/social.ts";
import { listsRepository } from "./repositories/lists.ts";
import { reviewsRepository } from "./repositories/reviews.ts";
import { catalogueRepository } from "./repositories/catalogue.ts";
import { ratingsRepository } from "./repositories/ratings.ts";

const repository: RewindApiRepository = {
  ...journalRepository,
  ...adminUsersRepository,
  ...adminListsRepository,
  ...adminOperationsRepository,
  ...adminTmdbRepository,
  ...adminMoviesRepository,
  ...notificationsRepository,
  ...adminModerationRepository,
  ...messagesRepository,
  ...profileRepository,
  ...profileMediaRepository,
  ...socialRepository,
  ...listsRepository,
  ...reviewsRepository,
  ...commentsRepository,
  ...catalogueRepository,
  ...ratingsRepository,
};

const handler = createRewindApiHandler(repository, allowedOrigins, hostedAuthVerifier, handleTmdbRefreshRequest);

Deno.serve(async (request) => {
  const response = await handler(request);
  const edgeRuntime = (globalThis as typeof globalThis & { EdgeRuntime?: { waitUntil(promise: Promise<unknown>): void } }).EdgeRuntime;
  const path = apiPath(new URL(request.url).pathname);
  const profileMutation = response.ok && request.method !== "GET" && request.method !== "OPTIONS"
    && (path === "/api/profile/me" || path.startsWith("/api/profile/me/media/"));
  if (edgeRuntime) edgeRuntime.waitUntil(Promise.allSettled([processPendingIdentityDeletion(), processPendingProfileMediaDeletion(profileMutation)]));
  return response;
});
