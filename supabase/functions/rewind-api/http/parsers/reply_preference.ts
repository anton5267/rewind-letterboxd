import type { ReplyPreference } from "../../contracts/profile.ts";

export function isReplyPreference(value: unknown): value is ReplyPreference {
  return value === "ANYONE" || value === "FOLLOWED" || value === "SELF";
}
