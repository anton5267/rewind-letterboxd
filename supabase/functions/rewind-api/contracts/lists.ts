import type { ReplyPreference } from "./profile.ts";
import type { MovieCardResponse } from "./catalog.ts";

export type FeaturedListCategory = "REWIND_COMMUNITY" | "OTHER_TOP_FILM_LISTS" | "FILMMAKER_RECOMMENDATIONS";

export interface PublicListCardResponse {
  id: number;
  name: string;
  description: string | null;
  isPublic: boolean;
  ownerId: number;
  ownerUsername: string;
  ownerAvatarUrl: string | null;
  tags: string[];
  likeCount: number;
  itemCount: number;
  previewMovies: MovieCardResponse[];
  featuredCategory: FeaturedListCategory | null;
}

export interface PublicListDetailsResponse {
  id: number;
  name: string;
  description: string | null;
  ownerId: number;
  ownerUsername: string;
  ownerAvatarUrl: string | null;
  publishedAt: string;
  tags: string[];
  likeCount: number;
  isRanked?: boolean;
  replyPreference?: ReplyPreference | null;
  movies: MovieCardResponse[];
}

export interface PublicListPageResponse {
  content: PublicListCardResponse[];
  totalPages: number;
  totalElements: number;
  number: number;
}

export interface ListLikeStatusResponse { liked: boolean; likes: number }

export interface PopularTagResponse { id: number; name: string; slug: string }

export interface MyListResponse {
  id: number;
  name: string;
  description: string | null;
  listType: "CUSTOM" | "WATCHED" | "WATCHLIST" | "FAVORITES";
  isPublic: boolean;
  isRanked?: boolean;
  replyPreference?: ReplyPreference | null;
  tags: string[];
}

export interface MyListPageResponse {
  content: MyListResponse[];
  totalPages: number;
  totalElements: number;
  number: number;
}

export interface MyListItemResponse {
  id: number;
  position: number | null;
  movie: MovieCardResponse;
}

export interface CreateMyListRequest {
  name: string;
  description: string | null;
  isPublic: boolean;
  isRanked?: boolean;
  replyPreference?: ReplyPreference | null;
  tags: string[];
  movieIds: number[];
}

export interface UpdateMyListRequest {
  name?: string;
  description?: string | null;
  isPublic?: boolean;
  isRanked?: boolean;
  replyPreference?: ReplyPreference | null;
  tags?: string[];
}
