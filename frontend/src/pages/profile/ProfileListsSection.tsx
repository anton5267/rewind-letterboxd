import { useEffect, useState } from "react";
import { type ProfileCollection } from "../../api/profile.api";
import { getPopularTags, type PopularTag } from "../../api/tags.api";
import { useLocale } from "../../i18n";
import { useAuth } from "../../context/AuthContext";
import styles from "../Profile.module.css";
import { Link } from "react-router-dom";
import { toTagSlug } from "../../utils/tagSlug";
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
  filterValue: string;
}

export default function ProfileListsSection({ route, lists, profile, sectionTarget, filterValue }: Props) {
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
  const { t, path, lang } = useLocale();
  const { user } = useAuth();
  const [popularTags, setPopularTags] = useState<PopularTag[]>([]);
  const normalizedFilter = filterValue.trim().toLocaleLowerCase(lang === "uk" ? "uk-UA" : "en-US");
  const visibleLists = profileView === "lists" && normalizedFilter
    ? profile.lists.filter(list => {
      const metadata = listMetadata?.find(item => item.id === list.id);
      return [list.name, metadata?.description, ...(metadata?.tags ?? [])].some(value => value?.toLocaleLowerCase(lang === "uk" ? "uk-UA" : "en-US").includes(normalizedFilter));
    })
    : profileView === "lists" ? profile.lists : profile.lists.slice(0, 1);

  useEffect(() => {
    let current = true;
    if (profileView !== "lists") { setPopularTags([]); return; }
    getPopularTags(8).then(({ data }) => { if (current) setPopularTags(data); }).catch(() => { if (current) setPopularTags([]); });
    return () => { current = false; };
  }, [profileView]);

  return <section className={`${styles.section} ${!profileView ? styles.previewSection : ""}`} id="profile-lists" data-profile-list-view={profileView ?? undefined} aria-labelledby="profile-lists-title" aria-busy={listMetadataLoading}>
        {profileView ? <h2 id="profile-lists-title" ref={listMetadataHeadingRef} tabIndex={-1}>{t("searchLists")}</h2> : <div className={styles.previewHeading}><h2 id="profile-lists-title" ref={listMetadataHeadingRef} tabIndex={-1}><Link to={sectionTarget("profile-lists", null)}>{t("searchLists")}</Link></h2><Link className={styles.previewAll} to={sectionTarget("profile-lists", null)}>{t("allSearchResults")}</Link></div>}
        {listMetadataError && <RetryNotice className={styles.feedback} message={t("loadListsError")} retryLabel={t("retry")} onRetry={() => { listMetadataRetryFocus.current = { origin: document.activeElement instanceof HTMLElement ? document.activeElement : null, attempt: listMetadataAttempt + 1 }; setListMetadataLoading(true); setListMetadataError(false); setListMetadataAttempt(value => value + 1); }} />}
        {profile.lists.length === 0 || visibleLists.length === 0 ? <p className={styles.empty}>{t("noLists")}</p> : <ul className={styles.listCards}>{visibleLists.map(list => {
          const metadata = listMetadata?.find(item => item.id === list.id);
          return <ProfileListCard key={`${profile.id}:${list.id}`} list={metadata ?? list} description={metadata?.description} tags={metadata?.tags} ownerId={profile.id} enabled={user?.id === profile.id && (!profileView || profileView === "lists")} />;
        })}</ul>}
        {profileView === "lists" && <>
          <Link className={styles.listCreateAction} to={path("/lists")}>{t("newList")}</Link>
          {popularTags.length > 0 && <div className={styles.profileListTags} aria-labelledby="profile-list-tags-title">
            <h3 id="profile-list-tags-title">{t("listTags")}</h3>
            <div>{popularTags.map(tag => <Link key={tag.id} to={path(`/lists/discover?feed=recent&tag=${encodeURIComponent(tag.slug || toTagSlug(tag.name))}`)}>#{tag.name}</Link>)}</div>
          </div>}
        </>}
      </section>;
}
