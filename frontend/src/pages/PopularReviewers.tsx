import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getPopularReviewers, type PopularReviewer } from "../api/social.api";
import UserFollowRow from "../components/UserFollowRow";
import { FollowActionsProvider } from "../context/FollowActionsContext";
import RetryNotice from "../components/RetryNotice";
import { useLocale } from "../i18n";
import { getUserIdentity } from "../utils/userIdentity";
import styles from "./PopularReviewers.module.css";

const PAGE_SIZE = 8;

export default function PopularReviewers() {
  const { lang, path, t } = useLocale();
  const [reviewers, setReviewers] = useState<PopularReviewer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);

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
        <h1 id="popular-reviewers-title">{t("popularReviewers")}</h1>
        <Link className={styles.toolbarButton} to={path("/search")} aria-label={t("globalSearch")}>⌕</Link>
      </div>
    </header>

    <section className={styles.shell} aria-labelledby="popular-reviewers-title" aria-busy={loading}>
      {loading && <p className={styles.status} role="status">{t("loading")}</p>}
      {error && <RetryNotice className={styles.status} message={t("loadCommunityError")} retryLabel={t("retry")} busy={loading} onRetry={() => setRetry(value => value + 1)} />}
      {!loading && !error && reviewers.length === 0 && <p className={styles.empty}>{t("noPopularReviewers")}</p>}
      {!loading && !error && reviewers.length > 0 && <ul className={styles.list}>
        {reviewers.map(reviewer => <UserFollowRow key={reviewer.id} user={reviewer} href={path(`/users/${reviewer.id}`)} subtitle={`${reviewer.likes} ${t("likes")}`} label={getUserIdentity(reviewer, t("someone"))} />)}
      </ul>}
    </section>
  </main></FollowActionsProvider>;
}
