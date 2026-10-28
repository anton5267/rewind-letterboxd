import { useEffect, useRef, useState } from "react";
import { getAdminUserOverview, type AdminUserOverview } from "../api/admin.api";
import { getPublicProfile } from "../api/profile.api";
import { useLocale } from "../i18n";
import RetryNotice from "./RetryNotice";
import styles from "./AdminPersonalMetrics.module.css";

export default function AdminPersonalMetrics({ userId }: { userId: number }) {
  const { lang, t } = useLocale();
  const [stats, setStats] = useState<AdminUserOverview["stats"] | null>(null);
  const [average, setAverage] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const title = useRef<HTMLHeadingElement>(null);
  const retryOrigin = useRef<HTMLElement | null>(null);

  useEffect(() => {
    let current = true;
    setLoading(true);
    setError(false);
    Promise.allSettled([getAdminUserOverview(userId), getPublicProfile(userId)]).then(([overview, profile]) => {
      if (!current) return;
      setStats(overview.status === "fulfilled" ? overview.value.data.stats : null);
      const distribution = profile.status === "fulfilled" ? profile.value.data.ratingDistribution : [];
      const count = distribution.reduce((total, bucket) => total + bucket.count, 0);
      setAverage(count > 0 ? distribution.reduce((total, bucket) => total + bucket.rating * bucket.count, 0) / count : null);
      setError(overview.status === "rejected" || profile.status === "rejected");
      setLoading(false);
    });
    return () => { current = false; };
  }, [userId, attempt]);

  useEffect(() => {
    const origin = retryOrigin.current;
    if (loading || !origin) return;
    retryOrigin.current = null;
    if (document.activeElement === document.body || document.activeElement === origin) title.current?.focus();
  }, [loading]);

  const number = (value: number | undefined) => value === undefined ? t("adminMetricUnavailable") : new Intl.NumberFormat(lang).format(value);
  const metrics = [
    { label: t("adminWatchedMovies"), value: number(stats?.watched) },
    { label: t("adminCreatedLists"), value: number(stats?.customLists) },
    { label: t("adminAverageRating"), value: average === null ? t("adminMetricUnavailable") : new Intl.NumberFormat(lang, { maximumFractionDigits: 2 }).format(average), note: average === null && !error ? t("adminNoRatings") : t("adminRatingSnapshot") },
    { label: t("adminReviewsWritten"), value: number(stats?.reviews) },
    { label: t("adminLikesReceived"), value: number(stats?.likesReceived) },
    { label: t("adminEngagementGrowth"), value: t("adminMetricUnavailable"), note: t("adminHistoryUnavailable") },
    { label: t("adminAverageSession"), value: t("adminMetricUnavailable"), note: t("adminHistoryUnavailable") },
    { label: t("adminWatchlistMovies"), value: number(stats?.watchlist) },
  ];

  return <section className={styles.section} aria-labelledby="admin-personal-metrics" aria-busy={loading}>
    <h3 id="admin-personal-metrics" className={styles.title} ref={title} tabIndex={-1}>{t("adminPersonalMetrics")}</h3>
    <p className={styles.scope}>{t("adminAllTimeMetrics")}</p>
    {error && <RetryNotice className={styles.error} message={t("adminLoadError")} retryLabel={t("retry")} disabled={loading} busy={loading} onRetry={() => {
      if (loading) return;
      retryOrigin.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      setLoading(true);
      setAttempt(value => value + 1);
    }} />}
    <div className={styles.grid}>
      {loading ? Array.from({ length: 8 }, (_, index) => <div className={`${styles.card} ${styles.skeleton}`} aria-hidden="true" key={index} />)
        : metrics.map(metric => <div className={styles.card} key={metric.label}>
          <h4>{metric.label}</h4>
          <p className={metric.value === t("adminMetricUnavailable") ? styles.unavailable : styles.value}>{metric.value}</p>
          {metric.note && <p className={styles.note}>{metric.note}</p>}
        </div>)}
    </div>
    {loading && <span className="srOnly" role="status">{t("loading")}</span>}
  </section>;
}
