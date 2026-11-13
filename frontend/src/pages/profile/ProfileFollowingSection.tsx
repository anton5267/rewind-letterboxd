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
    | "followingLoading"
    | "followingError"
    | "retryNetwork"
    | "following"
    | "refreshNetwork"
    | "followingPage"
    | "setFollowingPage"
  >;
  route: Pick<ProfileRoute, "profileView">;
}

export default function ProfileFollowingSection({ network, route }: Props) {
  const { followingLoading, followingError, retryNetwork, following, refreshNetwork, followingPage, setFollowingPage } = network;
  const { profileView } = route;
  const { t, path } = useLocale();

  return <section className={styles.section} id="profile-following" aria-labelledby="profile-following-title" aria-busy={followingLoading}>
        <h2 id="profile-following-title">{t("following")}</h2>
        {followingLoading && <ProfileLoading label={t("loading")} layout="rows" />}
        {followingError && <RetryNotice className={styles.feedback} message={t("loadNetworkError")} retryLabel={t("retry")} onRetry={() => retryNetwork("profile-following")} />}
        {!followingLoading && !followingError && following && (following.content.length === 0 ? <p>{t("noFollowing")}</p> : <ul className={styles.networkList}>
          {(!profileView || profileView === "following") && following.content.map(networkUser => <UserFollowRow key={networkUser.id} user={networkUser} href={path(`/users/${networkUser.id}`)} presentation="profileNetwork" onFollowSettled={refreshNetwork} />)}
        </ul>)}
        {!followingLoading && !followingError && following && <Pagination className={styles.pagination} page={followingPage} totalPages={following.totalPages} label={t("networkPagination")} busy={followingLoading} onPageChange={setFollowingPage} />}
      </section>;
}
