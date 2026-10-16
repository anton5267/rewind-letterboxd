import api from "./axios";

export const getUserLists = () => api.get("/lists/my");

export const createList = (name: string) =>
  api.post("/lists", { name, isPublic: true });

export const getListItems = (listId: number) => api.get(`/lists/${listId}/items`);

export const addMovieToList = (listId: number, movieId: number) =>
  api.post(`/lists/${listId}/movies`, { movieId });

export const removeMovieFromList = (listId: number, movieId: number) =>
  api.delete(`/lists/${listId}/movies/${movieId}`);
