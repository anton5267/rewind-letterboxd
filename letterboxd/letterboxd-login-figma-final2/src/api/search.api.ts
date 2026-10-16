import api from "./axios";

export interface MovieCard {
  id: number;
  title: string;
  releaseDate: string | null;
  rating: number | null;
  photoUrl: string | null;
}

export interface MoviePage {
  content: MovieCard[];
  number: number;
  totalPages: number;
  totalElements: number;
}

export interface Genre { id: number; name: string }

export interface MovieSearchParams {
  q?: string;
  genreId?: string;
  year?: string;
  minRating?: string;
  sort: string;
  page: number;
  size: number;
}

export const searchMovies = (params: MovieSearchParams) =>
  api.get<MoviePage>("/movies/search", { params });

export const getGenres = () => api.get<Genre[]>("/genres");
