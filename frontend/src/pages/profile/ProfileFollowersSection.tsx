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
  >;
  route: Pick<ProfileRoute, "profileView">;
}

export default function ProfileFollowersSection({ network, route }: Props) {
  const { followersLoading, followersError, retryNetwork, followers, refreshNetwork, followersPage, setFollowersPage } = network;
  const { profileView } = route;
  const { t, path } = useLocale();

  return <section className={styles.section} id="profile-followers" aria-labelledby="profile-followers-title" aria-busy={followersLoading}>
        <h2 id="profile-followers-title">{t("followers")}</h2>
        {followersLoading && <ProfileLoading label={t("loading")} layout="rows" />}
        {followersError && <RetryNotice className={styles.feedback} message={t("loadNetworkError")} retryLabel={t("retry")} onRetry={() => retryNetwork("profile-followers")} />}
        {!followersLoading && !followersError && followers && (followers.content.length === 0 ? <p>{t("noFollowers")}</p> : <ul className={styles.networkList}>{(!profileView || profileView === "followers") && followers.content.map(networkUser => <UserFollowRow key={networkUser.id} user={networkUser} href={path(`/users/${networkUser.id}`)} presentation="profileNetwork" onFollowSettled={refreshNetwork} />)}</ul>)}
        {followers && <Pagination className={styles.pagination} page={followersPage} totalPages={followers.totalPages} label={t("networkPagination")} busy={followersLoading} onPageChange={setFollowersPage} />}
      </section>;
}
