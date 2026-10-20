import api from "./axios";

export interface UserRating { rating: number }

export const getUserRating = (movieId: number) =>
  api.get<UserRating>(`/movies/${movieId}/rating/me`);

export const setRating = (movieId: number, rating: number) =>
  api.put<void>(`/movies/${movieId}/rating`, { rating });

export const deleteRating = (movieId: number) =>
  api.delete<void>(`/movies/${movieId}/rating`);
