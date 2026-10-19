import api from "./axios";
import type { PublicList } from "./lists.api";

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

export interface PublicUserSearchResult {
  id: number;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
}

export interface SearchArticle {
  id: number;
  slug: string;
  category: string;
  title: string;
  excerpt: string | null;
  coverUrl: string | null;
  publishedAt: string | null;
}

export interface SearchPerson {
  id: number;
  name: string;
  photoUrl: string | null;
  type: "ACTOR" | "DIRECTOR" | "PRODUCER";
}

export interface SearchReview {
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

export interface GlobalSearchResponse {
  films: MoviePage;
  users: { content: PublicUserSearchResult[]; totalElements: number };
  lists: { content: PublicList[]; totalElements: number };
  tags: { id: number; name: string; slug: string }[];
  people: SearchPerson[];
  reviews: { content: SearchReview[]; totalElements: number };
  journal: { content: SearchArticle[]; totalElements: number };
}

export const searchGlobal = (q: string, language: string, size = 6) =>
  api.get<GlobalSearchResponse>("/search/global", { params: { q, language, size } });
