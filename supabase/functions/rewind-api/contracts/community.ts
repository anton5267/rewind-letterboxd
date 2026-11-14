import type { MovieCardResponse } from "./catalog.ts";

/** Optional enrichment keeps existing directory and reviewer clients compatible. */
export interface CommunityDetails {
  watchedCount?: number;
  reviewCount?: number;
  listCount?: number;
  likes?: number;
  followerCount?: number;
  followingCount?: number;
  favoriteMovies?: MovieCardResponse[];
}
