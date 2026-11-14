import { profileBannerStyle } from "../../utils/profileBannerStyle";
import ProfileSocialLinks from "../../components/ProfileSocialLinks";
import { Link } from "react-router-dom";
import { type PublicCollection, type PublicProfileResponse } from "../../api/profile.api";
import ResilientImage from "../../components/ResilientImage";
import RetryNotice from "../../components/RetryNotice";
import { useAuth } from "../../context/AuthContext";
import { useLocale } from "../../i18n";
import { getUserHandle, getUserName } from "../../utils/userIdentity";
import styles from "../PublicProfile.module.css";
import type { usePublicRelationships } from "./usePublicRelationships";

interface Props {
  profile: PublicProfileResponse;
  followingCount?: number;
  followersCount?: number;
  relationships: ReturnType<typeof usePublicRelationships>;
  sectionTarget: (sectionId: string, kind: PublicCollection | null) => { search: string; hash: string };
}

export default function PublicProfileIdentity({ profile, followingCount, followersCount, relationships, sectionTarget }: Props) {
  const { path, t } = useLocale();
  const { isAuth, user } = useAuth();
  const identityName = getUserName(profile, t("someone"));
  const {
    followStatus, followBusy, followStatusLoading, followStatusError, followError, changeFollow,
    blockStatus, blockBusy, blockStatusLoading, blockStatusError, blockError, changeBlock,
    retryRelationshipStatus,
  } = relationships;
  return <>
<section style={profileBannerStyle(profile.bannerUrl)} className={styles.hero} aria-labelledby="public-profile-title">
        <div className={styles.mobileToolbar}>
          <Link className={styles.mobileBack} to={path("/community")} aria-label={t("community")}>←</Link>
          <span>{t("profile")}</span>
          <Link className={styles.mobileSearch} to={path("/search")} aria-label={t("search")}>⌕</Link>
        </div>
        <div className={styles.identity}>
          <ResilientImage className={styles.avatar} src={profile.avatarUrl} alt="" width={112} height={112} fallback={<div className={styles.avatarFallback} aria-hidden="true">{identityName.slice(0, 1).toUpperCase()}</div>} />
          <div className={styles.identityCopy}>
            <p className={styles.eyebrow}>{t("profile")}</p>
            <h1 id="public-profile-title" tabIndex={-1}>{identityName}{profile.hq && <span className={styles.hq} aria-label={t("hq")} title={t("hq")}>{t("hq")}</span>}</h1>
            <p className={styles.username}>{getUserHandle(profile, t("someone"))}</p>
            {profile.location?.trim() && <p className={styles.username} aria-label={t("profileLocation")}><i className="fa-solid fa-location-dot" aria-hidden="true" /> {profile.location}</p>}
            <ProfileSocialLinks links={profile.socialLinks} />
            {profile.bio?.trim() && <p className={styles.bio}>{profile.bio}</p>}
          </div>
        </div>
        <dl className={styles.heroMetrics}>
          <div><dt>{t("watched")}</dt><dd>{profile.stats.watched}</dd></div>
          <div><dt>{t("following")}</dt><dd><Link to={sectionTarget("public-profile-following", null)} aria-label={t("following")}>{followingCount ?? "—"}</Link></dd></div>
          <div><dt>{t("followers")}</dt><dd><Link to={sectionTarget("public-profile-followers", null)} aria-label={t("followers")}>{followersCount ?? "—"}</Link></dd></div>
        </dl>
        {isAuth && user?.id !== profile.id && (followStatus || blockStatus) && <div className={styles.profileActions}>
          {followStatus && !blockStatus?.blocked && <button className={`${styles.primaryButton} ${styles.relationshipActionFocus}`} data-relationship-action="follow" type="button" aria-busy={followBusy} disabled={followBusy || blockBusy} onClick={() => void changeFollow()}>{followBusy ? t("loading") : followStatus.following ? t("unfollow") : t("follow")}</button>}
          {blockStatus && <button className={`${styles.secondaryButton} ${styles.relationshipActionFocus}`} data-relationship-action="block" type="button" aria-busy={blockBusy} disabled={blockBusy || followBusy} onClick={() => void changeBlock()}>{blockBusy ? t("loading") : blockStatus.blocked ? t("unblockUser") : t("blockProfileUser")}</button>}
          {!blockStatus?.blocked && <Link className={styles.messageLink} to={path(`/messages?user=${profile.id}`)}>{t("sendMessage")}</Link>}
        </div>}
        {!isAuth && <div className={styles.profileActions}>
          <Link className={`${styles.primaryButton} ${styles.guestFollowButton}`} to={path("/login")} aria-label={`${t("follow")}: ${identityName}`}>{t("follow")}</Link>
        </div>}
      </section>
      {isAuth && user?.id !== profile.id && (followStatusLoading || blockStatusLoading) && <p className={styles.actionStatus} role="status">{t("loading")}</p>}
      {followStatusError && <RetryNotice className={styles.alert} message={t("loadFollowStatusError")} retryLabel={t("retry")} onRetry={() => retryRelationshipStatus("follow")} />}
      {blockStatusError && <RetryNotice className={styles.alert} message={t("loadBlockStatusError")} retryLabel={t("retry")} onRetry={() => retryRelationshipStatus("block")} />}
      {followError && <RetryNotice className={styles.alert} message={t("followError")} retryLabel={t("retry")} disabled={followBusy || blockBusy} busy={followBusy} onRetry={() => void changeFollow()} />}
      {blockError && <RetryNotice className={styles.alert} message={t("blockError")} retryLabel={t("retry")} disabled={blockBusy || followBusy} busy={blockBusy} onRetry={() => void changeBlock()} />}
  </>;
}
