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

export const getPersonFilmography = (type: PersonType, id: string | number, sort: string, genreId: string) =>
  api.get<PersonFilmography>(`/${type}s/${id}`, { params: { sort, genreId: genreId || undefined } });
