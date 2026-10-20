import api from "./axios";
import type { Page } from "./types";

export interface ConversationUser { id: number; username: string; displayName: string | null; avatarUrl: string | null }
export interface MessageSummary { id: number; senderId: number; body: string; createdAt: string; readAt: string | null }
export interface Conversation { id: number; otherUser: ConversationUser; updatedAt: string; lastMessage: MessageSummary | null }
export interface Message { id: number; conversationId: number; senderId: number; body: string; createdAt: string; readAt: string | null }
export const getConversations = (page = 0) => api.get<Page<Conversation>>("/conversations", { params: { page, size: 30 } });
export const getUnreadMessageCount = () => api.get<{ count: number }>("/conversations/unread-count");
export const startConversation = (userId: number) => api.post<Conversation>("/conversations", { userId });
export const getMessages = (conversationId: number, page = 0) => api.get<Page<Message>>(`/conversations/${conversationId}/messages`, { params: { page, size: 50 } });
export const sendMessage = (conversationId: number, body: string) => api.post<Message>(`/conversations/${conversationId}/messages`, { body });
export const markConversationRead = (conversationId: number) => api.post<void>(`/conversations/${conversationId}/read`);
