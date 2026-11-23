import api from "./axios";

export type PersonType = "actor" | "director" | "producer";
export type FilmographyType = PersonType | "writer";
export type PersonRole = "ACTOR" | "DIRECTOR" | "PRODUCER" | "WRITER";
export type RelatedPersonType = Exclude<PersonRole, "WRITER">;

export interface RelatedPersonRole {
  id: number;
  type: RelatedPersonType;
}

export interface PersonFilmography {
  id: number;
  name: string;
  photoUrl: string | null;
  type: PersonRole;
  relatedPeople?: RelatedPersonRole[];
  tmdbId?: number | null;
  biography?: string | null;
  biographyLanguage?: "uk" | "en" | null;
  careerJobs?: string[];
  films: {
    id: number;
    title: string;
    releaseDate: string | null;
    rating: number | null;
    photoUrl: string | null;
    characterName: string | null;
    crewCredits?: { department: string; job: string }[];
  }[];
}

export interface PersonSearchPage {
  content: { id: number; name: string; photoUrl: string | null; type: "ACTOR" | "DIRECTOR" | "PRODUCER"; filmCount: number }[];
  totalPages: number;
  totalElements: number;
  number: number;
}

export const getPersonFilmography = (type: FilmographyType, id: string | number, sort: string, genreId: string, language?: "uk" | "en") =>
  api.get<PersonFilmography>(`/${type}s/${id}`, { params: { sort, genreId: genreId || undefined, language } });

export const searchPeople = (type: PersonType, q: string | undefined, page: number, size: number) =>
  api.get<PersonSearchPage>("/people/search", { params: { type, q, page, size } });
