import type { PublicSocialUser } from "./social.ts";
import type { ReviewFeedResponse } from "./reviews.ts";
import type { PopularTagResponse, PublicListPageResponse } from "./lists.ts";

export interface GenreResponse {
  id: number;
  name: string;
}

export interface MovieCardResponse {
  id: number;
  title: string;
  releaseDate: string | null;
  rating: number | null;
  photoUrl: string | null;
}

export interface MovieSearchResult {
  content: MovieCardResponse[];
  totalPages: number;
  totalElements: number;
  number: number;
}

export interface MovieDetailsResponse {
  id: number;
  imdbId: string | null;
  tmdbId: number | null;
  originalLanguage: string | null;
  title: string;
  durationMinutes: number | null;
  releaseDate: string | null;
  ageRating: string | null;
  rating: number | null;
  shortPlot: string | null;
  photoUrl: string | null;
  backdropUrl: string | null;
  trailerUrl: string | null;
  genres: { id: number; name: string }[];
  directors: { id: number; name: string; photoUrl: string | null }[];
  producers: { id: number; name: string; photoUrl: string | null }[];
  actors: { id: number; name: string; photoUrl: string | null; characterName: string | null; castOrder: number | null }[];
  externalRatings: { source: string; rating: number; votesCount: number | null; lastUpdatedAt: string | null }[];
  similarMovies: MovieCardResponse[];
  myFlags: { watched: boolean; watchlist: boolean; favorites: boolean } | null;
}

export interface MovieSearchParams {
  q: string | null;
  genreId: number | null;
  year: number | null;
  minRating: number | null;
  sort: string;
  page: number;
  size: number;
}

export interface PersonFilmographyResponse {
  id: number;
  name: string;
  photoUrl: string | null;
  type: "ACTOR" | "DIRECTOR" | "PRODUCER";
  relatedPeople?: { id: number; type: "ACTOR" | "DIRECTOR" | "PRODUCER" }[];
  tmdbId?: number | null;
  biography?: string | null;
  biographyLanguage?: "uk" | "en" | null;
  films: {
    id: number;
    title: string;
    releaseDate: string | null;
    rating: number | null;
    photoUrl: string | null;
    characterName: string | null;
  }[];
}

export interface PersonBiography {
  text: string;
  language: "uk" | "en";
}

export type PersonBiographyProvider = (id: number, language: "uk" | "en") => Promise<PersonBiography | null>;

export interface PersonSearchResult {
  content: {
    id: number;
    name: string;
    photoUrl: string | null;
    type: "ACTOR" | "DIRECTOR" | "PRODUCER";
    filmCount: number;
  }[];
  totalPages: number;
  totalElements: number;
  number: number;
}

export interface PersonSearchParams {
  q: string | null;
  type: "ACTOR" | "DIRECTOR" | "PRODUCER";
  page: number;
  size: number;
}

export interface MovieStatusResponse {
  inWatchlist: boolean;
  watched: boolean;
  favorite: boolean;
  myRating: number | null;
}

export type MovieFlagType = "watched" | "watchlist" | "favorite";

export interface GlobalSearchArticleResponse {
  id: number; slug: string; category: string; title: string; excerpt: string | null;
  coverUrl: string | null; publishedAt: string | null;
}

export interface GlobalSearchResponse {
  films: MovieSearchResult;
  users: { content: PublicSocialUser[]; totalPages: number; totalElements: number; number: number };
  lists: PublicListPageResponse;
  tags: PopularTagResponse[];
  people: { id: number; name: string; photoUrl: string | null; type: "ACTOR" | "DIRECTOR" | "PRODUCER" }[];
  reviews: ReviewFeedResponse;
  journal: { content: GlobalSearchArticleResponse[]; totalPages: number; totalElements: number; number: number };
}
