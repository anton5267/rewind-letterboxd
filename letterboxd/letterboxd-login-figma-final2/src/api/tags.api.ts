import api from "./axios";

export interface PopularTag {
  id: number;
  name: string;
  slug: string;
}

export const getPopularTags = (size = 30) => api.get<PopularTag[]>("/tags/popular", { params: { size } });
