import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAdminActivityOverview, getAdminNotifications, type AdminActivityOverview, type AdminNotification } from "../api/admin.api";
import AdminLoading from "./AdminLoading";
import RetryNotice from "./RetryNotice";
import { formatDateTime, useLocale } from "../i18n";
import { getUserName } from "../utils/userIdentity";
import { useAuth } from "../context/AuthContext";
import styles from "./AdminActivity.module.css";

export default function AdminActivity() {
  const { user } = useAuth();
  const { lang, path, t } = useLocale();
  const [overview, setOverview] = useState<AdminActivityOverview | null>(null);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [overviewError, setOverviewError] = useState(false);
  const [notificationsError, setNotificationsError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let current = true;
    setLoading(true);
    setOverviewError(false);
    setNotificationsError(false);
    Promise.allSettled([getAdminActivityOverview(), getAdminNotifications({}, 0)]).then(([activity, eventPage]) => {
      if (!current) return;
      if (activity.status === "fulfilled") setOverview(activity.value.data);
      else { setOverview(null); setOverviewError(true); }
      if (eventPage.status === "fulfilled") setNotifications(eventPage.value.data.content.slice(0, 4));
      else { setNotifications([]); setNotificationsError(true); }
    }).finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [attempt, user?.id, user?.role, lang]);

  const number = (value: number) => new Intl.NumberFormat(lang, { maximumFractionDigits: 1 }).format(value);
  const adminPath = path("/admin");
  const metricCards = overview ? [
    { key: "watched", title: t("adminActivityAverageWatched"), value: number(overview.metrics.averageWatched), icon: "fa-solid fa-chart-line" },
    { key: "reviews", title: t("adminActivityAverageReviews"), value: number(overview.metrics.averageReviews), icon: "fa-solid fa-star" },
    { key: "all-lists", title: t("adminActivityAverageAllLists"), value: number(overview.metrics.averageAllLists), note: t("adminActivityMetricNote"), icon: "fa-solid fa-list" },
    { key: "custom-lists", title: t("adminActivityAverageCustomLists"), value: number(overview.metrics.averageCustomLists), icon: "fa-solid fa-list-check" },
    { key: "session", title: t("adminActivityAverageSession"), value: overview.metrics.averageSessionMinutes === null ? t("adminActivitySessionUnavailable") : `${number(overview.metrics.averageSessionMinutes)} ${t("minutes")}`, note: overview.metrics.averageSessionMinutes === null ? t("adminActivitySessionUnavailable") : t("adminActivityMetricNote"), icon: "fa-solid fa-clock" },
    { key: "watchlist", title: t("adminActivityAverageWatchlist"), value: number(overview.metrics.averageWatchlist), icon: "fa-solid fa-circle-plus" },
  ] : [];

  return <section className={styles.workspace} aria-label={t("adminActivityTitle")}>
    <h2 className={styles.title}>{t("adminActivityTitle")}</h2>
    {overviewError && <RetryNotice className={styles.error} message={t("adminActivityLoadError")} retryLabel={t("retry")} disabled={loading} busy={loading} onRetry={() => setAttempt(value => value + 1)} />}
    <section className={styles.usersPanel} aria-label={t("adminActivityUsers")} aria-busy={loading}>
      {loading && !overview ? <AdminLoading label={t("loading")} layout="users" /> : overview && <>
        <Link className={styles.moreUsers} to={`${adminPath}?view=more-users`}>{t("adminMoreUsers")}</Link>
        <div className={styles.tableRail}>
          <table className={styles.table}>
            <caption className={styles.srOnly}>{t("adminActivityUsers")}</caption>
            <thead><tr>
              <th scope="col">{t("name")}</th><th scope="col">{t("email")}</th>
              <th scope="col">{t("adminUserFollowers")}</th><th scope="col">{t("userStatus")}</th><th scope="col"><span className={styles.srOnly}>{t("adminReportActions")}</span></th>
            </tr></thead>
            <tbody>{overview.users.map(member => <tr key={member.id}>
              <td><span className={styles.cellLabel}>{t("name")}</span>{getUserName({ displayName: member.displayName, username: member.username }, t("someone"))}</td>
              <td><span className={styles.cellLabel}>{t("email")}</span>{member.email}</td>
              <td><span className={styles.cellLabel}>{t("adminUserFollowers")}</span>{number(member.followerCount)}</td>
              <td><span className={styles.cellLabel}>{t("userStatus")}</span>{member.isActive ? t("adminActivityStatusActive") : t("adminActivityStatusBlocked")}</td>
              <td><span className={styles.cellLabel}>{t("adminReportActions")}</span><Link className={styles.editLink} to={`${adminPath}?view=user-profile&user=${member.id}`} aria-label={`${t("adminActivityOpenProfile")}: ${member.username}`}>{t("adminActivityOpenProfile")}</Link></td>
            </tr>)}</tbody>
          </table>
          {overview.users.length === 0 && <p className={styles.empty}>{t("adminActivityNoUsers")}</p>}
        </div>
      </>}
    </section>

    <section className={styles.notificationsPanel} aria-label={t("adminActivityHistoryNotifications")} aria-busy={loading}>
      <div className={styles.historyColumn}>
        <h3>{t("adminActivityHistoryNotifications")}</h3>
        <div className={styles.historyCard}>
          <strong>{t("adminActivityRecentEvents")}</strong>
          {notificationsError ? <RetryNotice className={styles.error} message={t("adminLoadError")} retryLabel={t("retry")} disabled={loading} busy={loading} onRetry={() => setAttempt(value => value + 1)} />
            : notifications.length === 0 ? <p>{t("adminActivityNoNotifications")}</p>
              : <ul>{notifications.map(event => <li key={event.id}>
                <span>{event.type === "FOLLOW" ? t("notificationFollowedYou") : t("notificationLikedReview")}</span>
                <time dateTime={event.createdAt}>{formatDateTime(event.createdAt, lang)}</time>
              </li>)}</ul>}
        </div>
      </div>
      <div className={styles.campaignColumn}>
        <h3>{t("adminActivityNotifications")}</h3>
        <Link className={styles.manageNotifications} to={`${adminPath}?view=notifications`}>{t("adminActivityOpenNotifications")}</Link>
        <div className={styles.campaignActions} aria-describedby="admin-campaign-unavailable">
          <button type="button" disabled>{t("adminActivityNotifyFeatures")}</button>
          <button type="button" disabled>{t("adminActivityNotifyUpdates")}</button>
        </div>
        <p className={styles.campaignHint} id="admin-campaign-unavailable">{t("adminActivityCampaignUnavailable")}</p>
      </div>
    </section>

    <section className={styles.metricsPanel} aria-label={t("adminActivityTitle")} aria-busy={loading}>
      {loading && !overview ? <AdminLoading label={t("loading")} layout="settings" /> : overview && metricCards.map(card => <article className={styles.metricCard} key={card.key}>
        <h3>{card.title}</h3>
        <div className={styles.metricValue}>{card.value}</div>
        <p>{card.note ?? t("adminActivityMetricNote")}</p>
        <i className={card.icon} aria-hidden="true" />
      </article>)}
    </section>
  </section>;
}
