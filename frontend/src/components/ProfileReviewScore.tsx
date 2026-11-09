import { useEffect, useRef, useState } from "react";
import { getUserRating } from "../api/ratings.api";
import { useAuth } from "../context/AuthContext";
import { useLocale } from "../i18n";
import RetryButton from "./RetryButton";
import styles from "./ProfileReviewScore.module.css";

// This is the owner's current movie rating, never the public film average.
export default function ProfileReviewScore({ movieId, ownerId, title }: { movieId: number; ownerId: number; title: string }) {
  const { isAuth, user } = useAuth();
  const { t } = useLocale();
  const enabled = isAuth && user?.id === ownerId;
  const key = `${ownerId}:${movieId}`;
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{ key: string; attempt: number; value: number | null; error: boolean } | null>(null);
  const retryGroupRef = useRef<HTMLSpanElement>(null);
  const successRef = useRef<HTMLSpanElement>(null);
  const retryFocus = useRef<{ key: string; attempt: number; origin: Element | null } | null>(null);
  useEffect(() => {
    if (!enabled) { retryFocus.current = null; return; }
    let current = true;
    setResult(null);
    getUserRating(movieId).then(({ data }) => {
      if (current) setResult({ key, attempt, value: typeof data.rating === "number" && data.rating >= 1 && data.rating <= 5 ? data.rating : null, error: false });
    }).catch(() => { if (current) setResult({ key, attempt, value: null, error: true }); });
    return () => { current = false; };
  }, [attempt, enabled, key, movieId]);
  useEffect(() => {
    const pending = retryFocus.current;
    if (!pending) return;
    if (pending.key !== key) { retryFocus.current = null; return; }
    if (!enabled || !result || result.key !== key || result.attempt !== attempt) return;
    const frame = window.requestAnimationFrame(() => {
      if (retryFocus.current !== pending) return;
      retryFocus.current = null;
      if (document.activeElement !== document.body && document.activeElement !== pending.origin) return;
      if (result.error) retryGroupRef.current?.querySelector<HTMLElement>("[data-retry-button]")?.focus();
      else if (result.value !== null) successRef.current?.focus();
      else document.querySelector<HTMLElement>(`[data-profile-review-title="${movieId}"]`)?.focus();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [attempt, enabled, key, result]);
  if (!enabled) return null;
  if (!result || result.key !== key || result.attempt !== attempt) return <span role="status" aria-label={t("loading")}>…</span>;
  if (result.error) return <span ref={retryGroupRef} role="group" aria-label={`${title}: ${t("myRating")}`}><RetryButton label={t("retry")} onClick={() => {
    retryFocus.current = { key, attempt: attempt + 1, origin: document.activeElement };
    setAttempt(value => value + 1);
  }} /></span>;
  return result.value === null ? null
    : <span ref={successRef} tabIndex={-1} className={styles.scoreFocus} aria-label={`${t("myRating")}: ${result.value}/5`} title={t("myRating")}>★ {result.value}/5</span>;
}
