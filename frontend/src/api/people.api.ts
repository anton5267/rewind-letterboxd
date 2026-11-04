import api from "./axios";

export type PersonType = "actor" | "director" | "producer";

export interface PersonFilmography {
  id: number;
  name: string;
  photoUrl: string | null;
  type: string;
  films: {
    id: number;
    title: string;
    releaseDate: string | null;
    rating: number | null;
    photoUrl: string | null;
    characterName: string | null;
  }[];
}

export interface PersonSearchPage {
  content: { id: number; name: string; photoUrl: string | null; type: "ACTOR" | "DIRECTOR"; filmCount: number }[];
  totalPages: number;
  totalElements: number;
  number: number;
}

export const getPersonFilmography = (type: PersonType, id: string | number, sort: string, genreId: string) =>
  api.get<PersonFilmography>(`/${type}s/${id}`, { params: { sort, genreId: genreId || undefined } });

export const searchPeople = (type: "actor" | "director", q: string | undefined, page: number, size: number) =>
  api.get<PersonSearchPage>("/people/search", { params: { type, q, page, size } });
