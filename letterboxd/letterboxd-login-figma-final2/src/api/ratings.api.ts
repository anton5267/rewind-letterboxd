import api from "./axios";

export const getUserRating = (movieId: number) =>
  api.get(`/movies/${movieId}/rating/me`);

export const setRating = (movieId: number, rating: number) =>
  api.put(`/movies/${movieId}/rating`, { rating });

export const deleteRating = (movieId: number) =>
  api.delete(`/movies/${movieId}/rating`);
