import api from "./axios";

export const getUserLists = () => api.get("/lists/my");

export const createList = (name: string, description: string, isPublic: boolean) =>
  api.post("/lists", { name, description: description || null, isPublic });

export const updateList = (listId: number, name: string, description: string, isPublic: boolean) =>
  api.patch(`/lists/${listId}`, { name, description: description || null, isPublic });

export const getListItems = (listId: number) => api.get(`/lists/${listId}/items`);

export const addMovieToList = (listId: number, movieId: number) =>
  api.post(`/lists/${listId}/movies`, { movieId });

export const removeMovieFromList = (listId: number, movieId: number) =>
  api.delete(`/lists/${listId}/movies/${movieId}`);

export const reorderListItems = (listId: number, orderedItemIds: number[]) =>
  api.put(`/lists/${listId}/items/reorder`, { orderedItemIds });
