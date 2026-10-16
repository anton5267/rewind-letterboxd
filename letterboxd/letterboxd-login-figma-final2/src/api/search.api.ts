import api from "./axios";

export const getMovies = () => api.get("/movies");

export const searchMovies = (query: string) =>
  api.get("/movies/search", { params: { q: query } });
