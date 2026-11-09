import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { getPopularReviewers, type PopularReviewer } from "../api/social.api";
import UserFollowRow from "../components/UserFollowRow";
import { FollowActionsProvider } from "../context/FollowActionsContext";
import RetryNotice from "../components/RetryNotice";
import { formatReviewCount, useLocale } from "../i18n";
import { getUserIdentity } from "../utils/userIdentity";
import styles from "./PopularReviewers.module.css";

const PAGE_SIZE = 10;

export default function PopularReviewers() {
  const { lang, path, t } = useLocale();
  const [reviewers, setReviewers] = useState<PopularReviewer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  const resultsRef = useRef<HTMLElement>(null);
  const retryFocus = useRef<{ origin: HTMLElement; lang: string } | null>(null);

  useEffect(() => {
    retryFocus.current = null;
  }, [lang]);

  useEffect(() => {
    const pending = retryFocus.current;
    if (!pending || loading) return;
    const frame = window.requestAnimationFrame(() => {
      if (retryFocus.current !== pending) return;
      retryFocus.current = null;
      if (pending.lang !== lang) return;
      const active = document.activeElement;
      if (active !== document.body && active !== pending.origin) return;
      if (error) resultsRef.current?.querySelector<HTMLButtonElement>("[data-retry-button]")?.focus();
      else resultsRef.current?.focus();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [lang, loading, error, reviewers]);

  const retryLoad = () => {
    if (document.activeElement instanceof HTMLElement) retryFocus.current = { origin: document.activeElement, lang };
    setLoading(true);
    setError(false);
    setRetry(value => value + 1);
  };

  useEffect(() => {
    let current = true;
    setLoading(true);
    setError(false);
    setReviewers([]);
    getPopularReviewers(PAGE_SIZE)
      .then(({ data }) => { if (current) setReviewers(data); })
      .catch(() => { if (current) setError(true); })
      .finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [lang, retry]);

  return <FollowActionsProvider><main className={styles.page} aria-labelledby="popular-reviewers-title" aria-busy={loading}>
    <header className={styles.hero}>
      <div className={styles.toolbar}>
        <Link className={styles.toolbarButton} to={path("/community")} aria-label={t("community")}>←</Link>
        <span className={styles.toolbarTitle} aria-hidden="true">{t("popularReviewers")}</span>
        <Link className={styles.toolbarButton} to={path("/search")} aria-label={t("globalSearch")}>⌕</Link>
      </div>
      <div className={styles.heroCopy}>
        <h1 id="popular-reviewers-title">{t("popularReviewers")}</h1>
        <p>{t("popularReviewersIntro")}</p>
      </div>
    </header>

    <section ref={resultsRef} className={styles.shell} aria-labelledby="popular-reviewers-title" aria-busy={loading} tabIndex={-1}>
      <div className={styles.sectionHeading}><h2>{t("popularReviewers")}</h2><span>{t("sortByPopularity")}</span></div>
      {loading && <><p className="srOnly" role="status">{t("loading")}</p><div className={styles.table} aria-hidden="true">{Array.from({ length: PAGE_SIZE }, (_, item) => <div className={styles.skeletonRow} key={item}><div className={styles.skeletonAvatar} /><div className={styles.skeletonLine} /></div>)}</div></>}
      {error && <RetryNotice className={styles.status} message={t("loadCommunityError")} retryLabel={t("retry")} busy={loading} onRetry={retryLoad} />}
      {!loading && !error && reviewers.length === 0 && <p className={styles.empty}>{t("noPopularReviewers")}</p>}
      {!loading && !error && reviewers.length > 0 && <div className={styles.table}>
        <div className={styles.columnHeadings} aria-hidden="true"><span>{t("name")}</span><span>{t("watched")}</span><span>{t("searchLists")}</span><span>{t("likes")}</span><span /></div>
        <ul id="reviewer-list" className={styles.list}>
          {reviewers.map(reviewer => {
            const reviewCount = reviewer.reviewCount;
            const hasMetrics = reviewCount != null && reviewer.watchedCount != null && reviewer.listCount != null;
            return <UserFollowRow key={reviewer.id} user={reviewer} href={path(`/users/${reviewer.id}`)}
              subtitle={hasMetrics ? formatReviewCount(reviewCount, lang) : `${reviewer.likes} ${t("likes")}`}
              reviewerMetrics={hasMetrics ? { watched: reviewer.watchedCount!, lists: reviewer.listCount!, likes: reviewer.likes } : undefined}
              showMobileMoreAction
              label={getUserIdentity(reviewer, t("someone"))} />;
          })}
        </ul>
      </div>}
    </section>
  </main></FollowActionsProvider>;
}
