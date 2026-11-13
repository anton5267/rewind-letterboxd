import { useLocale, editorialText } from "../../i18n";
import styles from "../Profile.module.css";
import ProfileLoading from "../../components/ProfileLoading";
import RetryNotice from "../../components/RetryNotice";
import { Link } from "react-router-dom";
import ResilientImage from "../../components/ResilientImage";
import Pagination from "../../components/Pagination";
import { type ProfileRatingsModel } from "./useProfileRatings";

interface Props {
  ratings: Pick<
    ProfileRatingsModel,
    | "ratingsLoading"
    | "ratingsHeadingRef"
    | "ratingsError"
    | "pendingRatingsFocus"
    | "currentRatingsFocusScope"
    | "ratingsRequest"
    | "setRatingsLoading"
    | "setRatingsError"
    | "setRatingsAttempt"
    | "ratingsHistory"
    | "ratingsPage"
    | "setRatingsPage"
  >;
}

export default function ProfileRatingsSection({ ratings }: Props) {
  const {
    ratingsLoading,
    ratingsHeadingRef,
    ratingsError,
    pendingRatingsFocus,
    currentRatingsFocusScope,
    ratingsRequest,
    setRatingsLoading,
    setRatingsError,
    setRatingsAttempt,
    ratingsHistory,
    ratingsPage,
    setRatingsPage,
  } = ratings;
  const { t, path } = useLocale();

  return <section className={styles.section} id="profile-ratings" aria-labelledby="profile-ratings-title" aria-busy={ratingsLoading}>
        <h2 id="profile-ratings-title" ref={ratingsHeadingRef} tabIndex={-1} className={styles.retryFocusHeading}>{t("allRatings")}</h2>
        {ratingsLoading && <ProfileLoading label={t("loading")} layout="films" />}
        {ratingsError && <RetryNotice className={styles.feedback} message={t("loadRatingsError")} retryLabel={t("retry")} onRetry={() => { pendingRatingsFocus.current = { origin: document.activeElement instanceof HTMLElement ? document.activeElement : null, scope: currentRatingsFocusScope.current, request: ratingsRequest.current + 1 }; setRatingsLoading(true); setRatingsError(false); setRatingsAttempt(value => value + 1); }} />}
        {!ratingsLoading && !ratingsError && ratingsHistory && <>
          {ratingsHistory.content.length === 0 ? <p>{t("noRatings")}</p> : <ul className={styles.posterRail}>{ratingsHistory.content.map(item => {
            const title = editorialText(item.movieTitle, t("untitledFilm"));
            return <li key={item.movieId}>
              <Link className={styles.railPosterLink} to={path(`/films/${item.movieId}`)} aria-label={title} title={title}>
                <ResilientImage className={styles.railPoster} src={item.moviePhotoUrl} alt="" loading="lazy" fallback={<span className={styles.railPosterFallback}>{title.slice(0, 1).toUpperCase()}</span>} />
              </Link>
              <p className={styles.railRating}>★ {item.rating}/5</p>
            </li>;
          })}</ul>}
          <Pagination className={styles.pagination} page={ratingsPage} totalPages={ratingsHistory.totalPages} label={t("allRatings")} busy={ratingsLoading} onPageChange={setRatingsPage} />
        </>}
      </section>;
}
