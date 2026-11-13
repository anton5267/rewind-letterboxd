import { type ProfileCollection } from "../../api/profile.api";
import { useLocale } from "../../i18n";
import styles from "../Profile.module.css";
import { Link } from "react-router-dom";
import ProfileLoading from "../../components/ProfileLoading";
import RetryNotice from "../../components/RetryNotice";
import { getUserName, getUserInitial } from "../../utils/userIdentity";
import ResilientImage from "../../components/ResilientImage";
import { type ProfileNetworkModel } from "./useProfileNetwork";

interface Props {
  network: Pick<ProfileNetworkModel, "followingLoading" | "followingError" | "retryNetwork" | "following">;
  sectionTarget: (id: string, kind: ProfileCollection | null) => { search: string; hash: string };
}

export default function ProfileFollowingPreview({ network, sectionTarget }: Props) {
  const { followingLoading, followingError, retryNetwork, following } = network;
  const { t, path } = useLocale();

  return <section className={`${styles.section} ${styles.previewSection}`} id="profile-following-preview" aria-labelledby="profile-following-preview-title" aria-busy={followingLoading}>
        <h2 id="profile-following-preview-title"><Link to={sectionTarget("profile-following", null)}>{t("following")}</Link></h2>
        {followingLoading && <ProfileLoading label={t("loading")} layout="rows" />}
        {followingError && <RetryNotice className={styles.feedback} message={t("loadNetworkError")} retryLabel={t("retry")} onRetry={() => retryNetwork("profile-following")} />}
        {!followingLoading && !followingError && following && (following.content.length === 0 ? <p>{t("noFollowing")}</p> : <ul className={styles.followingPreview}>{following.content.map(networkUser => <li key={networkUser.id}><Link to={path(`/users/${networkUser.id}`)} aria-label={getUserName(networkUser, t("someone"))} title={getUserName(networkUser, t("someone"))}><ResilientImage src={networkUser.avatarUrl} alt="" width={80} height={80} loading="lazy" fallback={<span className={styles.followingInitial} aria-hidden="true">{getUserInitial(networkUser)}</span>} /></Link></li>)}</ul>)}
      </section>;
}
