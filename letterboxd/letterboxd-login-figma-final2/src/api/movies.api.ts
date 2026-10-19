import api from "./axios";
import type { MovieCard } from "./search.api";

export interface MovieDetails {
  id: number;
  title: string;
  shortPlot: string | null;
  photoUrl: string | null;
  backdropUrl: string | null;
  releaseDate: string | null;
  durationMinutes: number | null;
  ageRating: string | null;
  rating: number | null;
  trailerUrl: string | null;
  genres: { id: number; name: string }[];
  actors: { id: number; name: string; characterName: string | null }[];
  directors: { id: number; name: string }[];
  producers: { id: number; name: string }[];
  externalRatings: { source: string; rating: number }[];
  similarMovies: MovieCard[];
  myFlags: { watched: boolean; watchlist: boolean; favorites: boolean } | null;
}

export type MovieFlag = "watched" | "watchlist" | "favorite";

export const getMovieDetails = (movieId: number) =>
  api.get<MovieDetails>(`/movies/${movieId}/details`);

export const setMovieFlag = (movieId: number, flag: MovieFlag) =>
  api.post(`/movies/${movieId}/${flag}`);

export const clearMovieFlag = (movieId: number, flag: MovieFlag) =>
  api.delete(`/movies/${movieId}/${flag}`);
