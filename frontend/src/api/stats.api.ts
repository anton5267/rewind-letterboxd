import api from "./axios";

export interface PublicStats {
  count: number;
}

export const getPublicWatchedFilmCount = () => api.get<PublicStats>("/stats/watched-films");
