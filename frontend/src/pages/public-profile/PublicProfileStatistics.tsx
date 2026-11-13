import { type CSSProperties } from "react";
import { type PublicProfileResponse } from "../../api/profile.api";
import { useLocale } from "../../i18n";
import styles from "../PublicProfile.module.css";

interface Props {
  profile: PublicProfileResponse;
}

export default function PublicProfileStatistics({ profile }: Props) {
  const { t } = useLocale();
  return <section className={styles.section} id="public-profile-stats" aria-labelledby="public-profile-stats-title"><h2 id="public-profile-stats-title">{t("profileStats")}</h2><div className={styles.stats}>
      <article className={styles.stat}><strong>{profile.stats.watched}</strong><span>{t("watched")}</span></article>
      <article className={styles.stat}><strong>{profile.stats.watchlist}</strong><span>{t("watchlist")}</span></article>
      <article className={styles.stat}><strong>{profile.stats.favorites}</strong><span>{t("favorite")}</span></article>
      <article className={styles.stat}><strong>{profile.stats.reviews}</strong><span>{t("reviews")}</span></article>
      <article className={styles.stat}><strong>{profile.stats.ratings}</strong><span>{t("ratings")}</span></article>
    </div>
      <div className={styles.distribution}><h3>{t("ratingDistribution")}</h3>
      {profile.ratingDistribution.length === 0 ? <p>{t("noRatingDistribution")}</p> : <ul aria-label={t("ratingDistribution")}>
        {[5, 4, 3, 2, 1].map(rating => {
          const count = profile.ratingDistribution.find(item => item.rating === rating)?.count ?? 0;
          const max = Math.max(...profile.ratingDistribution.map(item => item.count), 1);
          return <li key={rating}><span>{rating}/5</span><span className={styles.bar} aria-hidden="true"><span style={{ "--bar-width": `${Math.round((count / max) * 100)}%` } as CSSProperties} /></span><strong>{count}</strong></li>;
        })}
      </ul>}
      </div>
    </section>;
}
