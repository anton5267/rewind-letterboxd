import { writingCreditPredicate } from "./repositories/shared/writing_credit.ts";

Deno.test("writing-credit fallback excludes storyboarding, supervision, and coordination jobs", () => {
  const predicate = writingCreditPredicate("c");
  for (const expected of [
    "LOWER(BTRIM(c.department)) = 'writing'",
    "LOWER(BTRIM(c.job)) LIKE '%screenplay%'",
    "LOWER(BTRIM(c.job)) LIKE '%screenstory%'",
    "LOWER(BTRIM(c.job)) NOT LIKE '%storyboard%'",
    "LOWER(BTRIM(c.job)) NOT LIKE '%script supervisor%'",
    "LOWER(BTRIM(c.job)) NOT LIKE '%script coordinator%'",
  ]) {
    if (!predicate.includes(expected)) throw new Error(`Missing writing-credit predicate clause: ${expected}`);
  }
});
