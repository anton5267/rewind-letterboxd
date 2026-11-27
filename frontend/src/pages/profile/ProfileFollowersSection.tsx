import { useLocale } from "../../i18n";
import styles from "../Profile.module.css";
import ProfileLoading from "../../components/ProfileLoading";
import RetryNotice from "../../components/RetryNotice";
import UserFollowRow from "../../components/UserFollowRow";
import Pagination from "../../components/Pagination";
import { type ProfileNetworkModel } from "./useProfileNetwork";
import { type ProfileRoute } from "./profileRoute";

interface Props {
  network: Pick<
    ProfileNetworkModel,
    | "followersLoading"
    | "followersError"
    | "retryNetwork"
    | "followers"
    | "refreshNetwork"
    | "followersPage"
    | "setFollowersPage"
    | "networkFilter"
  >;
  route: Pick<ProfileRoute, "profileView">;
}

export default function ProfileFollowersSection({ network, route }: Props) {
  const { followersLoading, followersError, retryNetwork, followers, refreshNetwork, followersPage, setFollowersPage, networkFilter } = network;
  const { profileView } = route;
  const { t, path } = useLocale();

  return <section className={styles.section} id="profile-followers" aria-labelledby="profile-followers-title" aria-busy={followersLoading}>
        <h2 id="profile-followers-title">{t("followers")}</h2>
        {followersLoading && <ProfileLoading label={t("loading")} layout="rows" />}
        {followersError && <RetryNotice className={styles.feedback} message={t("loadNetworkError")} retryLabel={t("retry")} onRetry={() => retryNetwork("profile-followers")} />}
        {!followersLoading && !followersError && followers && (() => {
          const query = networkFilter.trim().toLocaleLowerCase();
          const visible = followers.content.filter(networkUser => !query || `${networkUser.displayName ?? ""} ${networkUser.username}`.toLocaleLowerCase().includes(query));
          return visible.length === 0 ? <p>{networkFilter ? t("noGlobalResults") : t("noFollowers")}</p> : <ul className={styles.networkList}>{(!profileView || profileView === "followers") && visible.map(networkUser => <UserFollowRow key={networkUser.id} user={networkUser} href={path(`/users/${networkUser.id}`)} presentation="profileNetwork" hideMobileNetworkStats reviewerMetrics={networkUser.watchedCount != null && networkUser.listCount != null && networkUser.likes != null ? { watched: networkUser.watchedCount, lists: networkUser.listCount, likes: networkUser.likes } : undefined} onFollowSettled={refreshNetwork} />)}</ul>;
        })()}
        {followers && <Pagination className={styles.pagination} page={followersPage} totalPages={followers.totalPages} label={t("networkPagination")} busy={followersLoading} onPageChange={setFollowersPage} />}
      </section>;
}
