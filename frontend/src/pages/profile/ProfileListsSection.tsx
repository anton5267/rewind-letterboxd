import { type ProfileCollection } from "../../api/profile.api";
import { useLocale } from "../../i18n";
import { useAuth } from "../../context/AuthContext";
import styles from "../Profile.module.css";
import { Link } from "react-router-dom";
import RetryNotice from "../../components/RetryNotice";
import ProfileListCard from "../../components/ProfileListCard";
import { type ProfileRoute } from "./profileRoute";
import { type ProfileListsModel } from "./useProfileLists";
import { type ProfileIdentityModel } from "./useProfileIdentity";

interface Props {
  route: Pick<ProfileRoute, "profileView">;
  lists: Pick<
    ProfileListsModel,
    | "listMetadataLoading"
    | "listMetadataHeadingRef"
    | "listMetadataError"
    | "listMetadataRetryFocus"
    | "listMetadataAttempt"
    | "setListMetadataLoading"
    | "setListMetadataError"
    | "setListMetadataAttempt"
    | "listMetadata"
  >;
  profile: NonNullable<ProfileIdentityModel["profile"]>;
  sectionTarget: (id: string, kind: ProfileCollection | null) => { search: string; hash: string };
}

export default function ProfileListsSection({ route, lists, profile, sectionTarget }: Props) {
  const { profileView } = route;
  const {
    listMetadataLoading,
    listMetadataHeadingRef,
    listMetadataError,
    listMetadataRetryFocus,
    listMetadataAttempt,
    setListMetadataLoading,
    setListMetadataError,
    setListMetadataAttempt,
    listMetadata,
  } = lists;
  const { t } = useLocale();
  const { user } = useAuth();

  return <section className={`${styles.section} ${!profileView ? styles.previewSection : ""}`} id="profile-lists" aria-labelledby="profile-lists-title" aria-busy={listMetadataLoading}>
        <h2 id="profile-lists-title" ref={listMetadataHeadingRef} tabIndex={-1}>{profileView ? t("lists") : <Link to={sectionTarget("profile-lists", null)}>{t("searchLists")}</Link>}</h2>
        {listMetadataError && <RetryNotice className={styles.feedback} message={t("loadListsError")} retryLabel={t("retry")} onRetry={() => { listMetadataRetryFocus.current = { origin: document.activeElement instanceof HTMLElement ? document.activeElement : null, attempt: listMetadataAttempt + 1 }; setListMetadataLoading(true); setListMetadataError(false); setListMetadataAttempt(value => value + 1); }} />}
        {profile.lists.length === 0 ? <p className={styles.empty}>{t("noLists")}</p> : <ul className={styles.listCards}>{(profileView === "lists" ? profile.lists : profile.lists.slice(0, 1)).map(list => {
          const metadata = listMetadata?.find(item => item.id === list.id);
          return <ProfileListCard key={`${profile.id}:${list.id}`} list={metadata ?? list} description={metadata?.description} tags={metadata?.tags} ownerId={profile.id} enabled={user?.id === profile.id && (!profileView || profileView === "lists")} />;
        })}</ul>}
      </section>;
}
