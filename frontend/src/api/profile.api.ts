import api from "./axios";
import type { MoviePreview } from "./lists.api";
import type { MoviePage } from "./search.api";
import type { NumberedPage } from "./types";

export interface ProfileStats {
  ratings: number;
  reviews: number;
  watched: number;
  watchlist: number;
  favorites: number;
}

export interface ProfileList {
  id: number;
  name: string;
  listType: string;
  isPublic: boolean;
}

export interface ProfileResponse {
  id: number;
  username: string;
  displayName: string | null;
  email: string;
  role: string;
  avatarUrl: string | null;
  stats: ProfileStats;
  lists: ProfileList[];
  recentRatings: ProfileRating[];
  recentReviews: ProfileReview[];
}

export const getProfile = () => api.get<ProfileResponse>("/profile/me");

export const updateProfile = (data: { displayName?: string; avatarUrl?: string }) =>
  api.patch<ProfileResponse>("/profile/me", data);

export interface SocialLink { platform: string; url: string; }
export const getSocialLinks = () => api.get<SocialLink[]>("/profile/me/social-links");
export const updateSocialLinks = (links: SocialLink[]) => api.put<SocialLink[]>("/profile/me/social-links", links);

export const changePassword = (currentPassword: string, newPassword: string) =>
  api.put<string>("/profile/me/password", { currentPassword, newPassword });

export const deleteAccount = (currentPassword: string) =>
  api.delete<void>("/profile/me", { data: { currentPassword } });

export type ProfileCollection = "watched" | "watchlist" | "favorites";

export interface ProfileRating {
  movieId: number;
  movieTitle: string;
  moviePhotoUrl: string | null;
  rating: number;
  updatedAt: string;
}

export interface ProfileReview {
  reviewId: number;
  movieId: number;
  movieTitle: string;
  moviePhotoUrl?: string | null;
  content: string;
  updatedAt: string;
}

export type ProfilePage<T> = NumberedPage<T>;

export const getProfileCollection = (collection: ProfileCollection, page: number) =>
  api.get<MoviePage>(`/profile/me/${collection}`, { params: { page, size: 12 } });

export const getProfileRatings = (page: number) =>
  api.get<ProfilePage<ProfileRating>>("/profile/me/ratings", { params: { page, size: 12 } });

export const getProfileReviews = (page: number) =>
  api.get<ProfilePage<ProfileReview>>("/profile/me/reviews", { params: { page, size: 12 } });

export type PublicCollection = "watched" | "watchlist" | "favorites";

export interface PublicProfileReview {
  id: number;
  movieId: number;
  movieTitle: string;
  content: string;
  rating: number | null;
  updatedAt?: string;
}

export interface PublicProfileResponse {
  id: number;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  hq: boolean;
  stats: { ratings: number; reviews: number; watched: number; watchlist: number; favorites: number };
  ratingDistribution: { rating: number; count: number }[];
  socialLinks: SocialLink[];
  lists: { id: number; name: string; description: string | null }[];
  recentReviews: PublicProfileReview[];
}

export interface PublicProfileList {
  id: number;
  name: string;
  description: string | null;
  ownerId: number;
  ownerUsername: string;
  tags: string[];
  itemCount?: number | null;
  previewMovies: MoviePreview[];
}

export type PublicProfileListPage = ProfilePage<PublicProfileList>;
export type PublicProfileReviewPage = ProfilePage<PublicProfileReview>;

export const getPublicProfile = (userId: string | number) =>
  api.get<PublicProfileResponse>(`/users/${userId}/profile`);

export const getPublicProfileCollection = (userId: string | number, collection: PublicCollection, page: number) =>
  api.get<MoviePage>(`/users/${userId}/collections/${collection}`, { params: { page, size: 12 } });

export const getPublicProfileLists = (userId: string | number, page: number) =>
  api.get<PublicProfileListPage>(`/users/${userId}/lists`, { params: { page, size: 12 } });

export const getPublicProfileLikedReviews = (userId: string | number, page: number) =>
  api.get<PublicProfileReviewPage>(`/users/${userId}/liked-reviews`, { params: { page, size: 10 } });
