import { useLocale, editorialText, localizeActivityType, formatDateTime } from "../../i18n";
import styles from "../Profile.module.css";
import ProfileLoading from "../../components/ProfileLoading";
import RetryNotice from "../../components/RetryNotice";
import { getUserName } from "../../utils/userIdentity";
import PublicProfilePoster from "../../components/PublicProfilePoster";
import { Link } from "react-router-dom";
import Pagination from "../../components/Pagination";
import { type ProfileActivityModel } from "./useProfileActivity";

interface Props {
  activityModel: Pick<
    ProfileActivityModel,
    | "activityLoading"
    | "activityHeadingRef"
    | "activityError"
    | "activityRetryFocus"
    | "activityAttempt"
    | "setActivityLoading"
    | "setActivityError"
    | "setActivityAttempt"
    | "activity"
    | "activityExpanded"
    | "setActivityPage"
    | "setActivityExpanded"
    | "activityPage"
  >;
}

export default function ProfileActivitySection({ activityModel }: Props) {
  const {
    activityLoading,
    activityHeadingRef,
    activityError,
    activityRetryFocus,
    activityAttempt,
    setActivityLoading,
    setActivityError,
    setActivityAttempt,
    activity,
    activityExpanded,
    setActivityPage,
    setActivityExpanded,
    activityPage,
  } = activityModel;
  const { t, path, lang } = useLocale();

  return <section className={`${styles.section} ${styles.previewSection}`} id="profile-activity" aria-labelledby="profile-activity-title" aria-busy={activityLoading}>
        <h2 id="profile-activity-title" ref={activityHeadingRef} tabIndex={-1}>{t("recentActivity")}</h2>
        {activityLoading && <ProfileLoading label={t("loading")} layout="films" />}
        {activityError && <RetryNotice className={styles.feedback} message={t("loadActivityError")} retryLabel={t("retry")} onRetry={() => { activityRetryFocus.current = { origin: document.activeElement instanceof HTMLElement ? document.activeElement : null, attempt: activityAttempt + 1 }; setActivityLoading(true); setActivityError(false); setActivityAttempt(value => value + 1); }} />}
        {!activityLoading && !activityError && activity && (activity.content.length === 0 ? <p className={styles.empty}>{t("noActivity")}</p> : <>
          <ul className={styles.overviewPosterGrid} id="profile-activity-preview">{(activityExpanded ? activity.content : activity.content.slice(0, 4)).map(item => {
            const title = item.movie ? editorialText(item.movie.title, t("untitledFilm")) : item.relatedUser ? getUserName(item.relatedUser, t("someone")) : item.list ? editorialText(item.list.name, t("lists")) : localizeActivityType(item.type, t);
            return <li key={item.id}>
              {item.movie ? <PublicProfilePoster movieId={item.movie.id} title={title} /> : item.relatedUser ? <Link className={styles.railPosterLink} to={path(`/users/${item.relatedUser.id}`)} aria-label={title}><span className={styles.railPosterFallback} aria-hidden="true">{title.slice(0, 1).toUpperCase()}</span></Link> : <div className={styles.railPosterFallback} role="img" aria-label={title}>{title.slice(0, 1).toUpperCase()}</div>}
              <p className={styles.activityCaption}><span>{localizeActivityType(item.type, t)}</span><span className="srOnly">{title}</span><time dateTime={item.createdAt}>{formatDateTime(item.createdAt, lang)}</time></p>
            </li>;
          })}</ul>
          {(activity.content.length > 4 || activity.totalPages > 1) && <button className={styles.previewAction} type="button" aria-expanded={activityExpanded} aria-controls="profile-activity-preview" onClick={() => { if (activityExpanded) setActivityPage(0); setActivityExpanded(value => !value); }}>{activityExpanded ? t("close") : t("viewAll")}<span className="srOnly">: {t("recentActivity")}</span></button>}
          {activityExpanded && <Pagination className={styles.pagination} page={activityPage} totalPages={activity.totalPages} label={t("activityPagination")} busy={activityLoading} onPageChange={setActivityPage} />}
        </>)}
      </section>;
}
