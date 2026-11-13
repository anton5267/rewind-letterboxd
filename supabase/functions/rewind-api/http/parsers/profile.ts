import type { ProfileUpdateRequest } from "../../contracts/profile.ts";

export function parseProfileUpdate(value: unknown): ProfileUpdateRequest | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const body = value as Record<string, unknown>;
  const update: ProfileUpdateRequest = {};
  if (body.displayName !== undefined && body.displayName !== null) {
    if (typeof body.displayName !== "string") return null;
    const name = body.displayName;
    if (name.length > 60 || (name !== "" && (name.length < 2 || !/\S/.test(name)))) return null;
    update.displayName = name;
  }
  if (body.avatarUrl !== undefined && body.avatarUrl !== null) {
    if (typeof body.avatarUrl !== "string") return null;
    const avatar = body.avatarUrl;
    if (avatar.length > 255 || (avatar !== "" && !/^https?:\/\/\S+$/.test(avatar))) return null;
    update.avatarUrl = avatar;
  }
  if (Object.hasOwn(body, "bio")) {
    if (body.bio !== null && typeof body.bio !== "string") return null;
    const bio = body.bio ?? "";
    if (bio.length > 500) return null;
    update.bio = bio;
  }
  if (Object.hasOwn(body, "location")) {
    if (body.location !== null && typeof body.location !== "string") return null;
    const location = (body.location ?? "").trim();
    if (location.length > 80) return null;
    update.location = location;
  }
  if (Object.hasOwn(body, "pronoun")) {
    if (body.pronoun !== null && typeof body.pronoun !== "string") return null;
    const pronoun = (body.pronoun ?? "").trim();
    const supported = ["", "They / their", "He / his", "He / their", "She / her", "She / their", "Xe / xyr", "Ze / hir", "Ze / zir", "It / its"];
    if (!supported.includes(pronoun)) return null;
    update.pronoun = pronoun;
  }
  return update;
}
