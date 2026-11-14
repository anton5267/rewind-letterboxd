import { Link } from "react-router-dom";
import type { CommunityUser } from "../../api/social.api";
import { useLocale } from "../../i18n";
import { getUserIdentity } from "../../utils/userIdentity";
import ResilientImage from "../ResilientImage";
import UserFollowRow from "../UserFollowRow";
import styles from "./CommunityMemberCard.module.css";

export default function CommunityMemberCard(
  { user, showcase = false }: { user: CommunityUser; showcase?: boolean },
) {
  const { lang, path, t } = useLocale();
  const href = path(`/users/${user.id}`);
  const number = new Intl.NumberFormat(lang);
  const filmsAndReviews =
    user.watchedCount !== undefined && user.reviewCount !== undefined
      ? t("communityFilmReviewCounts").replace(
        "{films}",
        number.format(user.watchedCount),
      ).replace("{reviews}", number.format(user.reviewCount))
      : undefined;
  const network =
    user.followerCount !== undefined && user.followingCount !== undefined
      ? t(user.followerCount === 1 ? "networkStatsOne" : "networkStats")
        .replace("{followers}", number.format(user.followerCount)).replace(
          "{following}",
          number.format(user.followingCount),
        )
      : undefined;
  const metrics = !showcase && user.watchedCount !== undefined &&
      user.listCount !== undefined && user.likes !== undefined
    ? { watched: user.watchedCount, lists: user.listCount, likes: user.likes }
    : undefined;
  const favorites = user.favoriteMovies?.slice(0, 4) ?? [];
  const favoriteLabel = `${t("favoriteFilms")} · ${getUserIdentity(user, "?")}`;

  return (
    <UserFollowRow
      user={user}
      href={href}
      presentation={showcase ? "communityShowcase" : "communityDirectory"}
      subtitle={showcase ? "" : network}
      meta={showcase ? filmsAndReviews : undefined}
      reviewerMetrics={metrics}
    >
      {showcase && favorites.length > 0 && (
        <Link
          className={styles.films}
          to={`${href}?view=collection&collection=favorites#public-profile-collections`}
          aria-label={favoriteLabel}
        >
          {favorites.map((movie) => (
            <ResilientImage
              key={movie.id}
              src={movie.photoUrl}
              alt=""
              loading="lazy"
              fallback={
                <span className={styles.fallback} aria-hidden="true">
                  {movie.title.slice(0, 1)}
                </span>
              }
            />
          ))}
        </Link>
      )}
    </UserFollowRow>
  );
}
