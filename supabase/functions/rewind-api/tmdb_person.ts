import type {
  PersonBiography,
  PersonBiographyProvider,
} from "./contracts/catalog.ts";
import { apiGet, TmdbError } from "./tmdb.ts";

const SUCCESS_TTL = 6 * 60 * 60 * 1000;
const EMPTY_TTL = 10 * 60 * 1000;
const ERROR_TTL = 30 * 1000;
const MAX_CACHE_ENTRIES = 128;

/** Optional catalogue enrichment with a bounded, process-local cache. */
export function createTmdbPersonBiographyProvider(
  apiKey: string | undefined,
  fetcher: typeof fetch = fetch,
  now: () => number = Date.now,
): PersonBiographyProvider {
  const cache = new Map<
    string,
    { expires: number; value: PersonBiography | null }
  >();
  const pending = new Map<string, Promise<PersonBiography | null>>();
  const key = apiKey?.trim();
  const remember = (
    cacheKey: string,
    value: PersonBiography | null,
    ttl: number,
  ) => {
    cache.delete(cacheKey);
    cache.set(cacheKey, { value, expires: now() + ttl });
    if (cache.size > MAX_CACHE_ENTRIES) {
      cache.delete(cache.keys().next().value!);
    }
    return value;
  };
  const readLocalized = async (
    id: number,
    language: "uk" | "en",
  ): Promise<string | null> => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);
    try {
      const timedFetch: typeof fetch = (input, init) =>
        fetcher(input, { ...init, signal: controller.signal });
      const body = await apiGet(
        `/person/${id}`,
        { language: language === "uk" ? "uk-UA" : "en-US" },
        key!,
        timedFetch,
      );
      if (body.id !== id) {
        throw new TmdbError(502, "TMDB returned a different person");
      }
      return typeof body.biography === "string"
        ? body.biography.trim() || null
        : null;
    } finally {
      clearTimeout(timeout);
    }
  };
  const readBiography = async (
    id: number,
    language: "uk" | "en",
  ): Promise<PersonBiography | null> => {
    const localized = await readLocalized(id, language);
    if (localized) return { text: localized, language };
    if (language === "en") return null;
    const english = await readLocalized(id, "en");
    return english ? { text: english, language: "en" } : null;
  };
  return (id, language) => {
    if (!key || !Number.isSafeInteger(id) || id <= 0) {
      return Promise.resolve(null);
    }
    const cacheKey = `${id}:${language}`;
    const cached = cache.get(cacheKey);
    if (cached && cached.expires > now()) return Promise.resolve(cached.value);
    const running = pending.get(cacheKey);
    if (running) return running;
    const request = readBiography(id, language)
      .then((value) =>
        remember(cacheKey, value, value ? SUCCESS_TTL : EMPTY_TTL)
      )
      .catch(() => remember(cacheKey, null, ERROR_TTL))
      .finally(() => pending.delete(cacheKey));
    pending.set(cacheKey, request);
    return request;
  };
}
