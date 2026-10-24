import { useEffect, useState } from "react";
import { getUserRating } from "../api/ratings.api";
import { useAuth } from "../context/AuthContext";
import { useLocale } from "../i18n";
import RetryButton from "./RetryButton";

// This is the owner's current movie rating, never the public film average.
export default function ProfileReviewScore({ movieId, ownerId, title }: { movieId: number; ownerId: number; title: string }) {
  const { isAuth, user } = useAuth();
  const { t } = useLocale();
  const enabled = isAuth && user?.id === ownerId;
  const key = `${ownerId}:${movieId}`;
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{ key: string; value: number | null; error: boolean } | null>(null);
  useEffect(() => {
    if (!enabled) return;
    let current = true;
    setResult(null);
    getUserRating(movieId).then(({ data }) => {
      if (current) setResult({ key, value: typeof data.rating === "number" && data.rating >= 1 && data.rating <= 5 ? data.rating : null, error: false });
    }).catch(() => { if (current) setResult({ key, value: null, error: true }); });
    return () => { current = false; };
  }, [attempt, enabled, key, movieId]);
  if (!enabled) return null;
  if (!result || result.key !== key) return <span role="status" aria-label={t("loading")}>…</span>;
  if (result.error) return <span role="group" aria-label={`${title}: ${t("myRating")}`}><RetryButton label={t("retry")} onClick={() => setAttempt(value => value + 1)} /></span>;
  return result.value === null ? null : <span aria-label={`${t("myRating")}: ${result.value}/5`} title={t("myRating")}>★ {result.value}/5</span>;
}
