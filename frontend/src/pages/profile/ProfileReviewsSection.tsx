import { type ProfileCollection } from "../../api/profile.api";
import { useLocale } from "../../i18n";
import styles from "../Profile.module.css";
import { getUserName } from "../../utils/userIdentity";
import { Link, useLocation } from "react-router-dom";
import RetryNotice from "../../components/RetryNotice";
import Pagination from "../../components/Pagination";
import { type ProfileReviewsModel } from "./useProfileReviews";
import { type ProfileRoute } from "./profileRoute";
import { type ProfileIdentityModel } from "./useProfileIdentity";

interface Props {
  reviews: Pick<
    ProfileReviewsModel,
    | "reviewsLoading"
    | "reviewDetailLoading"
    | "reviewActionBusy"
    | "reviewHeadingRef"
    | "reviewActionMessage"
    | "reviewActionError"
    | "reviewErrorRef"
    | "reviewDetailError"
    | "reviewsError"
    | "detailRetryOrigin"
    | "reviewDetailMobileHeadingRef"
    | "setReviewDetailLoading"
    | "setReviewsAttempt"
    | "reviewDetail"
    | "renderReviewCards"
    | "reviewsHistory"
    | "reviewsPage"
    | "setReviewsPage"
  >;
  route: Pick<ProfileRoute, "profileView" | "requestedReviewValue" | "requestedReviewId">;
  profile: NonNullable<ProfileIdentityModel["profile"]>;
  sectionTarget: (id: string, kind: ProfileCollection | null) => { search: string; hash: string };
}

export default function ProfileReviewsSection({ reviews, route, profile, sectionTarget }: Props) {
  const location = useLocation();
  const {
    reviewsLoading,
    reviewDetailLoading,
    reviewActionBusy,
    reviewHeadingRef,
    reviewActionMessage,
    reviewActionError,
    reviewErrorRef,
    reviewDetailError,
    reviewsError,
    detailRetryOrigin,
    reviewDetailMobileHeadingRef,
    setReviewDetailLoading,
    setReviewsAttempt,
    reviewDetail,
    renderReviewCards,
    reviewsHistory,
    reviewsPage,
    setReviewsPage,
  } = reviews;
  const { profileView, requestedReviewValue, requestedReviewId } = route;
  const { t } = useLocale();

  return <section className={styles.section} id="profile-reviews" aria-labelledby="profile-reviews-title" aria-busy={reviewsLoading || reviewDetailLoading || reviewActionBusy !== null}>
        <h2 ref={reviewHeadingRef} id="profile-reviews-title" tabIndex={profileView === "reviews" ? -1 : undefined}>{profileView === "reviews" ? <><span className={styles.mobileReviewsHeading}>{t(requestedReviewValue === null ? "reviews" : "review")}</span><span className={styles.desktopReviewsHeading}>{requestedReviewValue === null ? t("reviewsByUser").replace("{name}", getUserName(profile, t("someone"))) : `${t("reviewBy")} ${getUserName(profile, t("someone"))}`}</span></> : <Link to={sectionTarget("profile-reviews", null)}>{t("allReviews")}</Link>}</h2>
        {profileView === "reviews" && (reviewActionMessage || location.state?.reviewDeleted) && <p className={styles.status} role="status">{t(reviewActionMessage ?? "reviewDeleted")}</p>}
        {profileView === "reviews" && reviewActionError && <p ref={reviewErrorRef} tabIndex={-1} className={`${styles.alert} ${styles.reviewFeedbackFocus}`} role="alert">{t(reviewActionError)}</p>}
        {(requestedReviewValue !== null ? reviewDetailLoading : reviewsLoading) && <div role="status" aria-label={t("loading")}><span className="srOnly">{t("loading")}</span><div className={styles.reviewLoading} aria-hidden="true"><span /><div><span /><span /><span /></div></div></div>}
        {(requestedReviewValue !== null ? reviewDetailError : reviewsError) && <RetryNotice className={styles.feedback} message={t(requestedReviewValue !== null ? "reviewUnavailable" : "loadReviewsError")} retryLabel={t("retry")} disabled={reviewDetailLoading || reviewsLoading} busy={reviewDetailLoading || reviewsLoading} onRetry={() => {
          detailRetryOrigin.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
          if (requestedReviewValue !== null && requestedReviewId === null) {
            (window.matchMedia("(max-width: 767px)").matches ? reviewDetailMobileHeadingRef.current : reviewHeadingRef.current)?.focus();
            detailRetryOrigin.current = null;
            return;
          }
          setReviewDetailLoading(requestedReviewValue !== null);
          setReviewsAttempt(value => value + 1);
        }} />}
        {requestedReviewValue !== null && !reviewDetailLoading && !reviewDetailError && reviewDetail && <ul className={styles.reviewCards}>{renderReviewCards([reviewDetail], true, true)}</ul>}
          {requestedReviewValue === null && !reviewsLoading && !reviewsError && reviewsHistory && <>
          {reviewsHistory.content.length === 0 ? <p>{t("noReviews")}</p> : <ul className={styles.reviewCards}>{renderReviewCards(reviewsHistory.content, true)}</ul>}
          <Pagination className={styles.pagination} page={reviewsPage} totalPages={reviewsHistory.totalPages} label={t("allReviews")} busy={reviewsLoading} onPageChange={setReviewsPage} />
        </>}
      </section>;
}
