import api from "./axios";
import type { MovieCard } from "./search.api";

export interface MovieDetails {
  id: number;
  title: string;
  imdbId: string | null;
  originalLanguage?: string | null;
  shortPlot: string | null;
  photoUrl: string | null;
  backdropUrl: string | null;
  releaseDate: string | null;
  durationMinutes: number | null;
  ageRating: string | null;
  rating: number | null;
  trailerUrl: string | null;
  genres: { id: number; name: string }[];
  actors: { id: number; name: string; photoUrl?: string | null; characterName: string | null; castOrder?: number | null }[];
  directors: { id: number; name: string; photoUrl?: string | null }[];
  producers: { id: number; name: string }[];
  writers?: { tmdbId: number; name: string; photoUrl: string | null }[];
  externalRatings: { source: string; rating: number; votesCount?: number | null; lastUpdatedAt?: string | null }[];
  similarMovies: MovieCard[];
  myFlags: { watched: boolean; watchlist: boolean; favorites: boolean } | null;
}

export type MovieFlag = "watched" | "watchlist" | "favorite";

export interface TmdbMovieCandidate {
  tmdbId: number;
  title: string;
  releaseDate: string | null;
  overview: string | null;
  posterUrl: string | null;
  voteAverage?: number | null;
}

export interface TmdbMovieSearchPage {
  content: TmdbMovieCandidate[];
  page: number;
  totalPages: number;
  totalResults: number;
}

export interface TmdbMovieDiscoveryParams {
  page: number;
  genreId?: number;
  year?: number;
  minRating?: number;
  language: "uk" | "en";
}

export const searchTmdbMovies = (query: string, year: string | undefined, page: number, language: "uk" | "en") =>
  api.get<TmdbMovieSearchPage>("/tmdb/movies/search", { params: { q: query, year, page, language } });

export const discoverTmdbMovies = (params: TmdbMovieDiscoveryParams) =>
  api.get<TmdbMovieSearchPage>("/tmdb/movies/discover", { params });

export const importTmdbMovie = (tmdbId: number, options: { addToWatchlist?: boolean } = {}) =>
  api.post<{ movieId: number; title: string }>("/tmdb/movies/import", { tmdbId, ...options });

export const getMovieDetails = (movieId: number) =>
  api.get<MovieDetails>(`/movies/${movieId}/details`);

export const setMovieFlag = (movieId: number, flag: MovieFlag) =>
  api.post<void>(`/movies/${movieId}/${flag}`);

export const clearMovieFlag = (movieId: number, flag: MovieFlag) =>
  api.delete<void>(`/movies/${movieId}/${flag}`);
