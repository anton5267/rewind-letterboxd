import api from "./axios";
import type { NumberedPage } from "./types";

export interface MovieReview {
  id: number;
  userId: number;
  username: string;
  content: string;
  rating: number | null;
  createdAt: string;
}

export type MovieReviewPage = NumberedPage<MovieReview>;

export interface RecentReview {
  id: number;
  movieId: number;
  movieTitle: string;
  userId: number;
  username: string;
  content: string;
  rating: number | null;
  createdAt: string;
  moviePhotoUrl: string | null;
  userAvatarUrl: string | null;
}

export type ReviewFeedPage = NumberedPage<RecentReview>;

export interface ReviewDetails {
  id: number;
  content: string;
  rating: number | null;
  createdAt: string;
  author: { id: number; username: string; displayName: string | null; avatarUrl: string | null };
  movie: {
    id: number;
    title: string;
    releaseDate: string | null;
    durationMinutes: number | null;
    ageRating: string | null;
    photoUrl: string | null;
    backdropUrl: string | null;
    trailerUrl: string | null;
  };
  likes: number;
  likedBy: { id: number; username: string; displayName: string | null; avatarUrl: string | null }[];
}

export const getReviewDetails = (id: number) => api.get<ReviewDetails>(`/reviews/${id}`);
export const getRecentReviews = (page = 0, size = 20) => api.get<ReviewFeedPage>("/reviews/recent", { params: { page, size } });
export const getPopularReviews = (page = 0, size = 6) => api.get<ReviewFeedPage>("/reviews/popular", { params: { page, size } });
export const getReviewLikeStatus = (id: number) => api.get<{ liked: boolean; likes: number }>(`/reviews/${id}/like-status`);
export const getReviewLikes = (id: number) => api.get<number>(`/reviews/${id}/likes`);
export const likeReview = (id: number) => api.post<void>(`/reviews/${id}/likes`);
export const unlikeReview = (id: number) => api.delete<void>(`/reviews/${id}/likes`);

export const getMovieReviews = (movieId: number, page: number) =>
  api.get<MovieReviewPage>(`/movies/${movieId}/reviews`, { params: { page, size: 10 } });

export const getMyMovieReview = (movieId: number) =>
  api.get<MovieReview>(`/movies/${movieId}/reviews/me`);

export const createMovieReview = (movieId: number, content: string, rating: number) =>
  api.post<MovieReview>(`/movies/${movieId}/reviews`, { content, rating });

export const updateReview = (reviewId: number, data: { content?: string; rating?: number | null }) =>
  api.patch<MovieReview>(`/reviews/${reviewId}`, data);

export const deleteReview = (reviewId: number) =>
  api.delete<void>(`/reviews/${reviewId}`);
