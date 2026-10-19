import api from "./axios";

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
export const getReviewLikeStatus = (id: number) => api.get<{ liked: boolean; likes: number }>(`/reviews/${id}/like-status`);
export const likeReview = (id: number) => api.post<void>(`/reviews/${id}/likes`);
export const unlikeReview = (id: number) => api.delete<void>(`/reviews/${id}/likes`);
