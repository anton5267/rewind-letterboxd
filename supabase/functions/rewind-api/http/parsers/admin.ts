import type { AdminJournalArticleRequest } from "../../contracts/journal.ts";
import type { AdminCreateNotificationRequest, AdminModerationTarget, AdminMovieWriteRequest, AdminUserUpdateRequest } from "../../contracts/admin.ts";

export function parseAdminUserUpdate(value: unknown): AdminUserUpdateRequest | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const body = value as Record<string, unknown>;
  const update: AdminUserUpdateRequest = {};
  if (body.username !== undefined && body.username !== null) {
    if (typeof body.username !== "string" || body.username.length < 3 || body.username.length > 50 || !/\S/.test(body.username) || /[\r\n]/.test(body.username)) return null;
    update.username = body.username;
  }
  if (body.displayName !== undefined && body.displayName !== null) {
    if (typeof body.displayName !== "string" || body.displayName.length > 60
      || (body.displayName !== "" && (body.displayName.length < 2 || !/\S/.test(body.displayName)))) return null;
    update.displayName = body.displayName;
  }
  if (body.avatarUrl !== undefined && body.avatarUrl !== null) {
    if (typeof body.avatarUrl !== "string" || body.avatarUrl.length > 255
      || (body.avatarUrl !== "" && !/^https?:\/\/\S+$/i.test(body.avatarUrl))) return null;
    update.avatarUrl = body.avatarUrl;
  }
  if (body.role !== undefined && body.role !== null) {
    if (typeof body.role !== "string") return null;
    const role = body.role.trim().toUpperCase();
    if (role !== "USER" && role !== "ADMIN") return null;
    update.role = role;
  }
  if (body.isActive !== undefined && body.isActive !== null) {
    if (typeof body.isActive !== "boolean") return null;
    update.isActive = body.isActive;
  }
  return update;
}

export function parseAdminMovieWrite(value: unknown, create: boolean): AdminMovieWriteRequest | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const body = value as Record<string, unknown>;
  const result: AdminMovieWriteRequest = {};
  if (body.title !== undefined && body.title !== null) {
    if (typeof body.title !== "string" || body.title.length > 255 || !/\S/.test(body.title)) return null;
    result.title = body.title;
  } else if (create) return null;
  const strings = [
    ["imdbId", 20], ["ageRating", 10], ["shortPlot", 10000],
    ["photoUrl", 255], ["backdropUrl", 255], ["trailerUrl", 255],
  ] as const;
  for (const [key, maximum] of strings) {
    const raw = body[key];
    if (raw === undefined) continue;
    if (raw !== null && (typeof raw !== "string" || raw.length > maximum)) return null;
    if (key === "trailerUrl" && typeof raw === "string" && raw !== "" && !/^https?:\/\/\S+$/i.test(raw)) return null;
    (result as Record<string, unknown>)[key] = raw;
  }
  if (body.originalLanguage !== undefined) {
    if (body.originalLanguage !== null && (typeof body.originalLanguage !== "string" || !/^[a-z]{2}$/i.test(body.originalLanguage))) return null;
    result.originalLanguage = typeof body.originalLanguage === "string" ? body.originalLanguage.toLowerCase() : null;
  }
  if (body.published !== undefined) {
    if (typeof body.published !== "boolean") return null;
    result.published = body.published;
  }
  if (body.durationMinutes !== undefined) {
    if (body.durationMinutes !== null && (!Number.isSafeInteger(body.durationMinutes) || (body.durationMinutes as number) <= 0)) return null;
    result.durationMinutes = body.durationMinutes as number | null;
  }
  if (body.rating !== undefined) {
    if (body.rating !== null && (typeof body.rating !== "number" || !Number.isFinite(body.rating) || body.rating < 0 || body.rating > 10)) return null;
    result.rating = body.rating as number | null;
  }
  if (body.releaseDate !== undefined) {
    if (body.releaseDate !== null && (typeof body.releaseDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(body.releaseDate)
      || Number.isNaN(Date.parse(`${body.releaseDate}T00:00:00Z`))
      || new Date(`${body.releaseDate}T00:00:00Z`).toISOString().slice(0, 10) !== body.releaseDate)) return null;
    result.releaseDate = body.releaseDate as string | null;
  }
  if (body.genreIds !== undefined) {
    if (!Array.isArray(body.genreIds) || body.genreIds.length > 100
      || body.genreIds.some((id) => !Number.isSafeInteger(id) || (id as number) <= 0)
      || new Set(body.genreIds).size !== body.genreIds.length) return null;
    result.genreIds = body.genreIds as number[];
  }
  for (const field of ["directorIds", "producerIds"] as const) {
    const ids = body[field];
    if (ids !== undefined) {
      if (!Array.isArray(ids) || ids.length > 100
        || ids.some((id) => !Number.isSafeInteger(id) || (id as number) <= 0)
        || new Set(ids).size !== ids.length) return null;
      result[field] = ids as number[];
    }
  }
  if (body.actorCredits !== undefined) {
    if (!Array.isArray(body.actorCredits) || body.actorCredits.length > 100) return null;
    const actorCredits: NonNullable<AdminMovieWriteRequest["actorCredits"]> = [];
    const actorIds = new Set<number>();
    for (const value of body.actorCredits) {
      if (!value || typeof value !== "object" || Array.isArray(value)) return null;
      const credit = value as Record<string, unknown>;
      const actorId = credit.actorId;
      const characterName = credit.characterName;
      const castOrder = credit.castOrder;
      if (!Number.isSafeInteger(actorId) || (actorId as number) <= 0 || actorIds.has(actorId as number)
        || (characterName !== null && characterName !== undefined && (typeof characterName !== "string" || characterName.length > 150))
        || (castOrder !== null && castOrder !== undefined && (!Number.isSafeInteger(castOrder) || (castOrder as number) < 0))) return null;
      actorIds.add(actorId as number);
      actorCredits.push({ actorId: actorId as number, characterName: (characterName ?? null) as string | null,
        castOrder: (castOrder ?? null) as number | null });
    }
    result.actorCredits = actorCredits;
  }
  return result;
}

export function parseModerationReason(value: unknown, maxLength: number): string | null | false {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const reason = (value as Record<string, unknown>).reason;
  if (reason === undefined || reason === null) return null;
  return typeof reason === "string" && reason.length <= maxLength ? reason : false;
}

export function parseBulkModeration(value: unknown): { items: AdminModerationTarget[]; reason: string } | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const body = value as Record<string, unknown>;
  if (!Array.isArray(body.items) || body.items.length < 1 || body.items.length > 50
    || typeof body.reason !== "string" || !body.reason.trim() || body.reason.length > 500) return null;
  const items: AdminModerationTarget[] = [];
  for (const item of body.items) {
    if (!item || typeof item !== "object" || Array.isArray(item)) return null;
    const target = item as Record<string, unknown>;
    if (typeof target.type !== "string" || !target.type.trim() || typeof target.id !== "number"
      || !Number.isSafeInteger(target.id) || target.id <= 0) return null;
    items.push({ type: target.type, id: target.id });
  }
  return { items, reason: body.reason };
}

export function parseAdminCreateNotification(value: unknown): AdminCreateNotificationRequest | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const body = value as Record<string, unknown>;
  const positiveId = (key: string, required: boolean): number | null | false => {
    const item = body[key];
    if ((item === undefined || item === null) && !required) return null;
    if (typeof item !== "number" || !Number.isSafeInteger(item) || item <= 0) return false;
    return item;
  };
  const recipientId = positiveId("recipientId", true);
  const actorId = positiveId("actorId", true);
  const relatedUserId = positiveId("relatedUserId", false);
  const reviewId = positiveId("reviewId", false);
  if (recipientId === false || actorId === false || recipientId === null || actorId === null || relatedUserId === false || reviewId === false) return null;
  if (body.type !== "FOLLOW" && body.type !== "REVIEW_LIKED") return null;
  if (body.type === "FOLLOW" && (recipientId === actorId || relatedUserId !== actorId || reviewId !== null)) return null;
  if (body.type === "REVIEW_LIKED" && (recipientId === actorId || relatedUserId !== null || reviewId === null)) return null;
  return { recipientId, actorId, type: body.type, relatedUserId, reviewId };
}

export function parseAdminJournalArticle(value: unknown): AdminJournalArticleRequest | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const body = value as Record<string, unknown>;
  const nullableText = (key: string, max: number): string | null | false => {
    const item = body[key];
    if (item === undefined || item === null) return null;
    if (typeof item !== "string" || item.length > max) return false;
    return item;
  };
  const excerpt = nullableText("excerpt", 500);
  const coverUrl = nullableText("coverUrl", 500);
  const audioUrl = nullableText("audioUrl", 500);
  if (excerpt === false || coverUrl === false || audioUrl === false) return null;
  if (typeof body.slug !== "string" || !body.slug.trim() || body.slug.trim().length > 180
    || (body.language !== "uk" && body.language !== "en")
    || typeof body.category !== "string" || !body.category.trim() || body.category.trim().length > 80
    || typeof body.title !== "string" || !body.title.trim() || body.title.trim().length > 255
    || typeof body.content !== "string" || !body.content.trim()
    || (body.published !== undefined && typeof body.published !== "boolean")
    || (audioUrl !== null && !/^https?:\/\/\S+$/i.test(audioUrl))) return null;
  return { slug: body.slug.trim(), language: body.language, category: body.category.trim(), title: body.title.trim(),
    excerpt, content: body.content, coverUrl, audioUrl, published: body.published === true };
}
