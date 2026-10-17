import api from "./axios";
export interface JournalArticle { id: number; slug: string; language: string; category: string; title: string; excerpt: string | null; content: string; coverUrl: string | null; publishedAt: string | null }
export interface JournalPage { content: JournalArticle[]; totalPages: number; totalElements: number }
export const getJournal = (language: string) => api.get<JournalPage>("/journal/articles", { params: { language, size: 20 } });
export const getJournalArticle = (language: string, slug: string) => api.get<JournalArticle>(`/journal/articles/${encodeURIComponent(slug)}`, { params: { language } });
