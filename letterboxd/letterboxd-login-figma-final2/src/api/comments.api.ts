import api from "./axios";

export const getComments = (reviewId: number) =>
  api.get(`/reviews/${reviewId}/comments`);

export const addComment = (reviewId: number, text: string) =>
  api.post(`/reviews/${reviewId}/comments`, { text });

export const deleteComment = (commentId: number) =>
  api.delete(`/comments/${commentId}`);
