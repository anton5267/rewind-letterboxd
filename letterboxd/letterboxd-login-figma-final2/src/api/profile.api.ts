import api from "./axios";
import type { MoviePage } from "./search.api";

export const getProfile = () => api.get("/profile/me");

export const updateProfile = (data: { displayName?: string; avatarUrl?: string }) =>
  api.patch("/profile/me", data);

export const changePassword = (currentPassword: string, newPassword: string) =>
  api.put("/profile/me/password", { currentPassword, newPassword });

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
  content: string;
  updatedAt: string;
}

export interface ProfilePage<T> {
  content: T[];
  number: number;
  totalPages: number;
  totalElements: number;
}

export const getProfileCollection = (collection: ProfileCollection, page: number) =>
  api.get<MoviePage>(`/profile/me/${collection}`, { params: { page, size: 12 } });

export const getProfileRatings = (page: number) =>
  api.get<ProfilePage<ProfileRating>>("/profile/me/ratings", { params: { page, size: 12 } });

export const getProfileReviews = (page: number) =>
  api.get<ProfilePage<ProfileReview>>("/profile/me/reviews", { params: { page, size: 12 } });
