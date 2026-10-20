export type UserIdentitySource = {
  displayName?: string | null;
  username?: string | null;
};

export function getUserName(user: UserIdentitySource, fallback = "—") {
  return user.displayName?.trim() || user.username?.trim() || fallback;
}

export function getUserHandle(user: UserIdentitySource, fallback = "—") {
  const username = user.username?.trim();
  return username ? `@${username}` : fallback;
}

export function getUserIdentity(user: UserIdentitySource, fallback = "—") {
  return user.displayName?.trim() || getUserHandle(user, fallback);
}

export function getUserInitial(user: UserIdentitySource, fallback = "?") {
  const initial = (user.displayName?.trim() || user.username?.trim() || fallback).slice(0, 1).toUpperCase();
  return initial || fallback;
}
