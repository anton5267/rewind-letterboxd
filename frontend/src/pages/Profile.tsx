import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { changePassword, deleteAccount, getProfile, getProfileCollection, getProfileRatings, getProfileReviews, getSocialLinks, updateSocialLinks, type ProfileCollection, type ProfilePage, type ProfileRating, type ProfileResponse, type ProfileReview, type SocialLink, updateProfile } from "../api/profile.api";
import { getNewsletterSubscription, updateNewsletterSubscription } from "../api/newsletter.api";
import type { MoviePage } from "../api/search.api";
import { getFollowing, getUserActivity, type ActivityPage, type NetworkPage } from "../api/social.api";
import ResilientImage from "../components/ResilientImage";
import Pagination from "../components/Pagination";
import RetryNotice from "../components/RetryNotice";
import { useAuth } from "../context/AuthContext";
import { editorialText, formatDateTime, formatMovieYear, localizeActivityType, useLocale, type TranslationKey } from "../i18n";
import { useRovingTabs } from "../hooks/useRovingTabs";
import { useActiveSection } from "../hooks/useActiveSection";
import { safeHttpUrl } from "../utils/externalUrl";
import { getLastPageIndex, isPageOutOfRange } from "../utils/pagination";
import { getUserHandle, getUserIdentity, getUserInitial, getUserName } from "../utils/userIdentity";
import { isPasswordWithinByteLimit, MAX_PASSWORD_BYTES } from "../utils/passwordValidation";
import styles from "./Profile.module.css";

const collectionKinds = ["watched", "watchlist", "favorites"] as const;
type SocialLinkPlatform = "website" | "instagram" | "tiktok" | "letterboxd";
const socialLinkPlatforms = ["website", "instagram", "tiktok", "letterboxd"] as const satisfies readonly SocialLinkPlatform[];
const profileNavigation = [
  { id: "profile-overview", label: "profile" },
  { id: "profile-collections", label: "watched" },
  { id: "profile-ratings", label: "allRatings" },
  { id: "profile-reviews", label: "allReviews" },
  { id: "profile-lists", label: "lists" },
  { id: "profile-following", label: "following" },
] as const satisfies readonly { id: string; label: TranslationKey }[];
const profileSectionIds = profileNavigation.map(({ id }) => id);

export default function Profile() {
  const { isAuth, ready, logout, user } = useAuth();
  const navigate = useNavigate();
  const { path, t, lang } = useLocale();
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [activeProfileSection, setActiveProfileSection] = useActiveSection(profileSectionIds, "profile-overview", { enabled: profile !== null, rootMargin: "-88px 0px -55% 0px", scopeKey: profile?.id });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileLoadError, setProfileLoadError] = useState(false);
  const [profileAttempt, setProfileAttempt] = useState(0);
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [collectionKind, setCollectionKind] = useState<ProfileCollection>("watched");
  const [collection, setCollection] = useState<MoviePage | null>(null);
  const [collectionPage, setCollectionPage] = useState(0);
  const [collectionLoading, setCollectionLoading] = useState(false);
  const [collectionError, setCollectionError] = useState(false);
  const [collectionAttempt, setCollectionAttempt] = useState(0);
  const [favoritePreview, setFavoritePreview] = useState<MoviePage | null>(null);
  const [favoritePreviewLoading, setFavoritePreviewLoading] = useState(false);
  const [favoritePreviewError, setFavoritePreviewError] = useState(false);
  const [favoritePreviewAttempt, setFavoritePreviewAttempt] = useState(0);
  const [ratingsHistory, setRatingsHistory] = useState<ProfilePage<ProfileRating> | null>(null);
  const [ratingsPage, setRatingsPage] = useState(0);
  const [ratingsLoading, setRatingsLoading] = useState(false);
  const [ratingsError, setRatingsError] = useState(false);
  const [ratingsAttempt, setRatingsAttempt] = useState(0);
  const [reviewsHistory, setReviewsHistory] = useState<ProfilePage<ProfileReview> | null>(null);
  const [reviewsPage, setReviewsPage] = useState(0);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsError, setReviewsError] = useState(false);
  const [reviewsAttempt, setReviewsAttempt] = useState(0);
  const [following, setFollowing] = useState<NetworkPage | null>(null);
  const [followingPage, setFollowingPage] = useState(0);
  const [followingLoading, setFollowingLoading] = useState(false);
  const [followingError, setFollowingError] = useState(false);
  const [followingAttempt, setFollowingAttempt] = useState(0);
  const [activity, setActivity] = useState<ActivityPage | null>(null);
  const [activityPage, setActivityPage] = useState(0);
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityError, setActivityError] = useState(false);
  const [activityAttempt, setActivityAttempt] = useState(0);
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);
  const [newsletterLoading, setNewsletterLoading] = useState(false);
  const [newsletterLoadError, setNewsletterLoadError] = useState(false);
  const [newsletterAttempt, setNewsletterAttempt] = useState(0);
  const [newsletterBusy, setNewsletterBusy] = useState(false);
  const [newsletterRetry, setNewsletterRetry] = useState<boolean | null>(null);
  const [newsletterSaveError, setNewsletterSaveError] = useState(false);
  const [socialLinkValues, setSocialLinkValues] = useState<Record<SocialLinkPlatform, string>>({ website: "", instagram: "", tiktok: "", letterboxd: "" });
  const [socialLinksLoading, setSocialLinksLoading] = useState(false);
  const [socialLinksError, setSocialLinksError] = useState(false);
  const [socialLinksAttempt, setSocialLinksAttempt] = useState(0);
  const [socialLinksBusy, setSocialLinksBusy] = useState(false);
  const [nameBusy, setNameBusy] = useState(false);
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [accountDeleted, setAccountDeleted] = useState(false);
  const [passwordChanged, setPasswordChanged] = useState(false);
  const [profileActionsOpen, setProfileActionsOpen] = useState(false);
  const activeUserId = useRef<number | null>(null);
  const profileActionsButtonRef = useRef<HTMLButtonElement>(null);
  const profileActionsMenuRef = useRef<HTMLDivElement>(null);
  const identityFormRef = useRef<HTMLFormElement>(null);
  const displayNameInputRef = useRef<HTMLInputElement>(null);
  const identityMutation = useRef(0);
  const newsletterMutation = useRef(0);
  const socialLinksMutation = useRef(0);
  const passwordMutation = useRef(0);
  const deleteMutation = useRef(0);
  const socialLinkLabelKeys: Record<SocialLinkPlatform, TranslationKey> = { website: "socialWebsite", instagram: "socialInstagram", tiktok: "socialTiktok", letterboxd: "socialLetterboxd" };

  activeUserId.current = user?.id ?? null;

  useEffect(() => {
    identityMutation.current += 1;
    newsletterMutation.current += 1;
    socialLinksMutation.current += 1;
    passwordMutation.current += 1;
    deleteMutation.current += 1;
    setNameBusy(false);
    setNewsletterBusy(false);
    setSocialLinksBusy(false);
    setPasswordBusy(false);
    setDeleteBusy(false);
  }, [isAuth, user?.id]);

  useEffect(() => {
    if (!profileActionsOpen) return;
    const closeOnOutsideClick = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (!profileActionsMenuRef.current?.contains(target) && !profileActionsButtonRef.current?.contains(target)) setProfileActionsOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      setProfileActionsOpen(false);
      window.requestAnimationFrame(() => profileActionsButtonRef.current?.focus());
    };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    window.requestAnimationFrame(() => profileActionsMenuRef.current?.querySelector<HTMLElement>("button")?.focus());
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [profileActionsOpen]);

  const applySocialLinks = (data: SocialLink[]) => {
    setSocialLinkValues({
      website: data.find(link => link.platform === "website")?.url ?? "",
      instagram: data.find(link => link.platform === "instagram")?.url ?? "",
      tiktok: data.find(link => link.platform === "tiktok")?.url ?? "",
      letterboxd: data.find(link => link.platform === "letterboxd")?.url ?? "",
    });
  };

  useEffect(() => {
    if (!isAuth) return;
    let current = true;
    setProfileLoading(true);
    setProfileLoadError(false);
    setProfile(null);
    getProfile().then(({ data }) => {
      if (!current) return;
      setProfile(data);
      setDisplayName(data.displayName ?? "");
      setAvatarUrl(data.avatarUrl ?? "");
    }).catch(() => { if (current) setProfileLoadError(true); })
      .finally(() => { if (current) setProfileLoading(false); });
    return () => { current = false; };
  }, [isAuth, profileAttempt, user?.id]);

  useEffect(() => {
    if (!isAuth) return;
    let current = true;
    setNewsletterLoading(true);
    setNewsletterLoadError(false);
    getNewsletterSubscription().then(({ data }) => { if (current) { setNewsletterSubscribed(data.subscribed); setNewsletterRetry(null); setNewsletterSaveError(false); } })
      .catch(() => { if (current) setNewsletterLoadError(true); })
      .finally(() => { if (current) setNewsletterLoading(false); });
    return () => { current = false; };
  }, [isAuth, newsletterAttempt, user?.id]);

  useEffect(() => {
    if (!isAuth) return;
    let current = true;
    setSocialLinksLoading(true);
    setSocialLinksError(false);
    getSocialLinks().then(({ data }) => {
      if (!current) return;
      applySocialLinks(data);
    }).catch(() => { if (current) setSocialLinksError(true); })
      .finally(() => { if (current) setSocialLinksLoading(false); });
    return () => { current = false; };
  }, [isAuth, socialLinksAttempt, user?.id]);

  useEffect(() => {
    if (!isAuth) return;
    let current = true;
    setCollectionLoading(true);
    setCollectionError(false);
    setCollection(null);
    getProfileCollection(collectionKind, collectionPage)
      .then(({ data }) => {
        if (!current) return;
        if (isPageOutOfRange(collectionPage, data.totalPages)) {
          setCollectionPage(getLastPageIndex(data.totalPages));
          return;
        }
        setCollection(data);
      })
      .catch(() => { if (current) setCollectionError(true); })
      .finally(() => { if (current) setCollectionLoading(false); });
    return () => { current = false; };
  }, [isAuth, collectionKind, collectionPage, collectionAttempt, user?.id]);

  useEffect(() => {
    setFavoritePreview(null);
    setFavoritePreviewError(false);
    if (!isAuth || !user?.id) {
      setFavoritePreviewLoading(false);
      return;
    }
    const requestUserId = user.id;
    let current = true;
    const isCurrentRequest = () => current && activeUserId.current === requestUserId;
    setFavoritePreviewLoading(true);
    getProfileCollection("favorites", 0)
      .then(({ data }) => { if (isCurrentRequest()) setFavoritePreview(data); })
      .catch(() => { if (isCurrentRequest()) setFavoritePreviewError(true); })
      .finally(() => { if (isCurrentRequest()) setFavoritePreviewLoading(false); });
    return () => { current = false; };
  }, [isAuth, user?.id, favoritePreviewAttempt]);

  useEffect(() => {
    if (!isAuth) return;
    let current = true;
    setRatingsLoading(true);
    setRatingsError(false);
    setRatingsHistory(null);
    getProfileRatings(ratingsPage)
      .then(({ data }) => {
        if (!current) return;
        if (isPageOutOfRange(ratingsPage, data.totalPages)) {
          setRatingsPage(getLastPageIndex(data.totalPages));
          return;
        }
        setRatingsHistory(data);
      })
      .catch(() => { if (current) setRatingsError(true); })
      .finally(() => { if (current) setRatingsLoading(false); });
    return () => { current = false; };
  }, [isAuth, ratingsPage, ratingsAttempt, user?.id]);

  useEffect(() => {
    if (!isAuth) return;
    let current = true;
    setReviewsLoading(true);
    setReviewsError(false);
    setReviewsHistory(null);
    getProfileReviews(reviewsPage)
      .then(({ data }) => {
        if (!current) return;
        if (isPageOutOfRange(reviewsPage, data.totalPages)) {
          setReviewsPage(getLastPageIndex(data.totalPages));
          return;
        }
        setReviewsHistory(data);
      })
      .catch(() => { if (current) setReviewsError(true); })
      .finally(() => { if (current) setReviewsLoading(false); });
    return () => { current = false; };
  }, [isAuth, reviewsPage, reviewsAttempt, user?.id]);

  useEffect(() => {
    if (!isAuth || !user?.id) return;
    let current = true;
    setFollowingLoading(true);
    setFollowingError(false);
    setFollowing(null);
    getFollowing(user.id, followingPage)
      .then(({ data }) => {
        if (!current) return;
        if (isPageOutOfRange(followingPage, data.totalPages)) {
          setFollowingPage(getLastPageIndex(data.totalPages));
          return;
        }
        setFollowing(data);
      })
      .catch(() => { if (current) setFollowingError(true); })
      .finally(() => { if (current) setFollowingLoading(false); });
    return () => { current = false; };
  }, [isAuth, user?.id, followingPage, followingAttempt]);

  useEffect(() => {
    if (!isAuth || !user?.id) return;
    let current = true;
    setActivityLoading(true);
    setActivityError(false);
    setActivity(null);
    getUserActivity(user.id, activityPage)
      .then(({ data }) => {
        if (!current) return;
        if (isPageOutOfRange(activityPage, data.totalPages)) {
          setActivityPage(getLastPageIndex(data.totalPages));
          return;
        }
        setActivity(data);
      })
      .catch(() => { if (current) setActivityError(true); })
      .finally(() => { if (current) setActivityLoading(false); });
    return () => { current = false; };
  }, [isAuth, user?.id, activityPage, activityAttempt]);

  const chooseCollection = (kind: ProfileCollection) => {
    setCollectionKind(kind);
    setCollectionPage(0);
  };

  const { setTabRef, handleKeyDown } = useRovingTabs(collectionKinds, chooseCollection);

  const focusIdentityForm = () => {
    setProfileActionsOpen(false);
    identityFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.requestAnimationFrame(() => displayNameInputRef.current?.focus({ preventScroll: true }));
  };

  const handleProfileLogout = async () => {
    setProfileActionsOpen(false);
    setError("");
    try {
      await logout();
      navigate(path("/login"));
    } catch {
      setError(t("logoutError"));
    }
  };

  if (!ready) return <main className={styles.page} aria-labelledby="profile-page-title" aria-busy={true}><div className={styles.content}><h1 className={styles.pageTitle} id="profile-page-title">{t("myProfile")}</h1><p className={styles.feedback} role="status">{t("loading")}</p></div></main>;
  if (!isAuth && !accountDeleted && !passwordChanged) return <Navigate to={path("/login")} replace />;

  const saveName = async (event: React.FormEvent) => {
    event.preventDefault();
    if (nameBusy) return;
    const requestId = ++identityMutation.current;
    const requestUserId = activeUserId.current;
    const isCurrentRequest = () => requestUserId !== null && activeUserId.current === requestUserId && identityMutation.current === requestId;
    setNameBusy(true);
    setError("");
    try {
      const normalizedAvatarUrl = safeHttpUrl(avatarUrl);
      if (avatarUrl.trim() && !normalizedAvatarUrl) { if (isCurrentRequest()) setError(t("invalidAvatarUrl")); return; }
      const { data } = await updateProfile({ displayName: displayName.trim(), avatarUrl: normalizedAvatarUrl ?? "" });
      if (!isCurrentRequest()) return;
      setProfile(data);
      setDisplayName(data.displayName ?? "");
      setAvatarUrl(data.avatarUrl ?? "");
      setMessage(t("nameSaved"));
    } catch { if (isCurrentRequest()) setError(t("saveNameError")); }
    finally { if (isCurrentRequest()) setNameBusy(false); }
  };

  const savePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    if (passwordBusy) return;
    if (!isPasswordWithinByteLimit(newPassword)) {
      setError(t("passwordByteLimitError"));
      document.getElementById("profile-new-password")?.focus();
      return;
    }
    const requestId = ++passwordMutation.current;
    const requestUserId = activeUserId.current;
    const isCurrentRequest = () => requestUserId !== null && activeUserId.current === requestUserId && passwordMutation.current === requestId;
    setPasswordBusy(true);
    setError("");
    try {
      await changePassword(currentPassword, newPassword);
      if (!isCurrentRequest()) return;
      setCurrentPassword("");
      setNewPassword("");
      try {
        setPasswordChanged(true);
        setPasswordBusy(false);
        await logout();
        navigate(`${path("/login")}?passwordChanged=1`, { replace: true });
      } catch {
        if (isCurrentRequest()) setError(t("passwordChangedLogoutError"));
      }
    } catch { if (isCurrentRequest()) setError(t("changePasswordError")); }
    finally { if (isCurrentRequest()) setPasswordBusy(false); }
  };
  const removeAccount = async (event: React.FormEvent) => {
    event.preventDefault();
    if (deleteBusy) return;
    setError("");
    if (!window.confirm(t("deleteAccountConfirm"))) return;
    const requestId = ++deleteMutation.current;
    const requestUserId = activeUserId.current;
    const isCurrentRequest = () => requestUserId !== null && activeUserId.current === requestUserId && deleteMutation.current === requestId;
    setDeleteBusy(true);
    try {
      await deleteAccount(deletePassword);
      if (!isCurrentRequest()) return;
      setAccountDeleted(true);
      setDeleteBusy(false);
      await logout();
      navigate(path("/home"), { replace: true });
    }
    catch { if (isCurrentRequest()) setError(t("deleteAccountError")); }
    finally { if (isCurrentRequest()) setDeleteBusy(false); }
  };
  const toggleNewsletter = async (subscribed: boolean) => {
    if (newsletterBusy) return;
    const requestId = ++newsletterMutation.current;
    const requestUserId = activeUserId.current;
    const isCurrentRequest = () => requestUserId !== null && activeUserId.current === requestUserId && newsletterMutation.current === requestId;
    setNewsletterBusy(true);
    setNewsletterRetry(null);
    setNewsletterSaveError(false);
    setError("");
    try {
      const { data } = await updateNewsletterSubscription(subscribed);
      if (!isCurrentRequest()) return;
      setNewsletterSubscribed(data.subscribed);
      setNewsletterRetry(null);
      setMessage(t("newsletterSaved"));
    } catch {
      if (isCurrentRequest()) {
        setNewsletterRetry(subscribed);
        setNewsletterSaveError(true);
      }
    }
    finally { if (isCurrentRequest()) setNewsletterBusy(false); }
  };

  const retryNewsletter = () => {
    if (newsletterRetry !== null) void toggleNewsletter(newsletterRetry);
  };
  const saveSocialLinks = async (event: React.FormEvent) => {
    event.preventDefault();
    if (socialLinksBusy) return;
    const requestId = ++socialLinksMutation.current;
    const requestUserId = activeUserId.current;
    const isCurrentRequest = () => requestUserId !== null && activeUserId.current === requestUserId && socialLinksMutation.current === requestId;
    setSocialLinksBusy(true);
    setError("");
    try {
      const links: SocialLink[] = [];
      for (const platform of socialLinkPlatforms) {
        const value = socialLinkValues[platform].trim();
        if (!value) continue;
        const normalizedUrl = safeHttpUrl(value);
        if (!normalizedUrl) { if (isCurrentRequest()) setError(t("invalidSocialLinkUrl")); return; }
        links.push({ platform, url: normalizedUrl });
      }
      const { data } = await updateSocialLinks(links);
      if (!isCurrentRequest()) return;
      applySocialLinks(data);
      setMessage(t("socialLinksSaved"));
    } catch { if (isCurrentRequest()) setError(t("socialLinksSaveError")); }
    finally { if (isCurrentRequest()) setSocialLinksBusy(false); }
  };

  const pageBusy = profileLoading || followingLoading || activityLoading || newsletterLoading || socialLinksLoading || collectionLoading || favoritePreviewLoading || ratingsLoading || reviewsLoading || nameBusy || passwordBusy || deleteBusy || newsletterBusy || socialLinksBusy;

  return <main className={styles.page} aria-labelledby="profile-page-title" aria-busy={pageBusy}>
    <div className={styles.content}>
    <h1 className={styles.pageTitle} id="profile-page-title">{t("myProfile")}</h1>
    {error && <p className={styles.alert} id="profile-action-error" role="alert">{error}</p>}
    {message && <p className={styles.status} role="status">{message}</p>}
    {profileLoading && <p className={styles.feedback} role="status">{t("loading")}</p>}
    {profileLoadError && <RetryNotice className={styles.feedback} message={t("loadProfileError")} retryLabel={t("retry")} onRetry={() => setProfileAttempt(value => value + 1)} />}
    {profile && <>
      <section className={styles.hero} aria-labelledby="profile-identity">
        <div className={styles.heroActions}>
          <button ref={profileActionsButtonRef} className={styles.heroAction} type="button" aria-label={t("profileActions")} aria-expanded={profileActionsOpen} aria-controls={profileActionsOpen ? "profile-actions-menu" : undefined} onClick={() => setProfileActionsOpen(open => !open)}>
            <i className="fa-solid fa-ellipsis" aria-hidden="true" />
          </button>
          {profileActionsOpen && <div ref={profileActionsMenuRef} className={styles.heroActionsMenu} id="profile-actions-menu" role="menu" aria-label={t("profileActions")}>
            <button type="button" role="menuitem" onClick={focusIdentityForm}>{t("profileIdentity")}</button>
            <button type="button" role="menuitem" onClick={() => { void handleProfileLogout(); }}>{t("logout")}</button>
          </div>}
        </div>
        <button className={styles.heroEdit} type="button" aria-label={t("profileIdentity")} onClick={focusIdentityForm}>
          <i className="fa-solid fa-gear" aria-hidden="true" />
        </button>
        <ResilientImage className={styles.avatar} src={profile.avatarUrl} alt="" width={120} height={120}
          fallback={<span className={styles.avatarFallback} aria-hidden="true">{getUserInitial(profile)}</span>} />
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>{t("profile")}</p>
          <h2 id="profile-identity">{getUserIdentity(profile, t("someone"))}</h2>
          <p className={styles.username}>{getUserHandle(profile, t("someone"))}</p>
          <p className={styles.email}>{profile.email}</p>
        </div>
      </section>
      <section className={`${styles.section} ${styles.overviewSection}`} id="profile-overview" aria-labelledby="profile-stats">
        <h2 id="profile-stats">{t("profileStats")}</h2>
        <div className={styles.stats}>
          <article className={styles.stat}><strong>{profile.stats.watched}</strong><span>{t("watched")}</span></article>
          <article className={styles.stat}><strong>{profile.stats.watchlist}</strong><span>{t("watchlist")}</span></article>
          <article className={styles.stat}><strong>{profile.stats.favorites}</strong><span>{t("favorite")}</span></article>
          <article className={styles.stat}><strong>{profile.stats.reviews}</strong><span>{t("reviews")}</span></article>
          <article className={styles.stat}><strong>{profile.stats.ratings}</strong><span>{t("ratings")}</span></article>
        </div>
      </section>
      <nav className={styles.profileNav} aria-label={t("profile")}>
        {profileNavigation.map(({ id, label }) => <a
          className={activeProfileSection === id ? styles.activeProfileNav : undefined}
          key={id}
          href={`#${id}`}
          aria-current={activeProfileSection === id ? "location" : undefined}
          onClick={() => setActiveProfileSection(id)}
        >{t(label)}</a>)}
      </nav>
      <section className={styles.section} id="profile-favorite-preview" aria-labelledby="profile-favorite-preview-title" aria-busy={favoritePreviewLoading}>
        <h2 id="profile-favorite-preview-title">{t("favoriteFilms")}</h2>
        {favoritePreviewLoading && <p className={styles.feedback} role="status">{t("loading")}</p>}
        {favoritePreviewError && <RetryNotice className={styles.feedback} message={t("loadCollectionError")} retryLabel={t("retry")} onRetry={() => setFavoritePreviewAttempt(value => value + 1)} />}
        {!favoritePreviewLoading && !favoritePreviewError && favoritePreview && (favoritePreview.content.length === 0 ? <p className={styles.empty}>{t("noCollectionFilms")}</p> : <ul className={styles.posterRail}>
          {favoritePreview.content.map(movie => {
            const title = editorialText(movie.title, t("untitledFilm"));
            return <li key={movie.id}><Link className={styles.railPosterLink} to={path(`/films/${movie.id}`)} aria-label={title} title={title}>
              <ResilientImage className={styles.railPoster} src={movie.photoUrl} alt="" loading="lazy" fallback={<span className={styles.railPosterFallback}>{title.slice(0, 1).toUpperCase()}</span>} />
            </Link></li>;
          })}
        </ul>)}
      </section>
      <section className={styles.section} id="profile-activity" aria-labelledby="profile-activity-title" aria-busy={activityLoading}>
        <h2 id="profile-activity-title">{t("recentActivity")}</h2>
        {activityLoading && <p className={styles.feedback} role="status">{t("loading")}</p>}
        {activityError && <RetryNotice className={styles.feedback} message={t("loadActivityError")} retryLabel={t("retry")} onRetry={() => setActivityAttempt(value => value + 1)} />}
        {!activityLoading && !activityError && activity && (activity.content.length === 0 ? <p className={styles.empty}>{t("noActivity")}</p> : <>
          <ul className={styles.activityList}>{activity.content.map(item => <li key={item.id}>
            {item.type === "FOLLOW" && <>{localizeActivityType(item.type, t)} {item.relatedUser && <Link to={path(`/users/${item.relatedUser.id}`)}>{getUserName(item.relatedUser, t("someone"))}</Link>}</>}
            {item.type === "RATING" && <>{localizeActivityType(item.type, t)} {item.movie && <Link to={path(`/films/${item.movie.id}`)}>{editorialText(item.movie.title, t("untitledFilm"))}</Link>}</>}
            {item.type === "REVIEW" && <>{localizeActivityType(item.type, t)} {item.movie && <Link to={path(`/films/${item.movie.id}`)}>{editorialText(item.movie.title, t("untitledFilm"))}</Link>}</>}
            {item.type === "LIST" && <>{localizeActivityType(item.type, t)} {item.list && editorialText(item.list.name, t("lists"))}</>}
            {!(["FOLLOW", "RATING", "REVIEW", "LIST"] as string[]).includes(item.type) && localizeActivityType(item.type, t)}
            <time dateTime={item.createdAt}>{formatDateTime(item.createdAt, lang)}</time>
          </li>)}</ul>
          <Pagination className={styles.pagination} page={activityPage} totalPages={activity.totalPages} label={t("activityPagination")} busy={activityLoading} onPageChange={setActivityPage} />
        </>)}
      </section>
      <section className={styles.section} id="profile-ratings" aria-labelledby="profile-ratings-title" aria-busy={ratingsLoading}>
        <h2 id="profile-ratings-title">{t("allRatings")}</h2>
        {ratingsLoading && <p className={styles.feedback} role="status">{t("loading")}</p>}
        {ratingsError && <RetryNotice className={styles.feedback} message={t("loadRatingsError")} retryLabel={t("retry")} onRetry={() => setRatingsAttempt(value => value + 1)} />}
        {!ratingsLoading && !ratingsError && ratingsHistory && <>
          {ratingsHistory.content.length === 0 ? <p>{t("noRatings")}</p> : <ul className={styles.posterRail}>{ratingsHistory.content.map(item => {
            const title = editorialText(item.movieTitle, t("untitledFilm"));
            return <li key={item.movieId}>
              <Link className={styles.railPosterLink} to={path(`/films/${item.movieId}`)} aria-label={title} title={title}>
                <ResilientImage className={styles.railPoster} src={item.moviePhotoUrl} alt="" loading="lazy" fallback={<span className={styles.railPosterFallback}>{title.slice(0, 1).toUpperCase()}</span>} />
              </Link>
              <p className={styles.railRating}>★ {item.rating}/5</p>
            </li>;
          })}</ul>}
          <Pagination className={styles.pagination} page={ratingsPage} totalPages={ratingsHistory.totalPages} label={t("allRatings")} busy={ratingsLoading} onPageChange={setRatingsPage} />
        </>}
      </section>
      <section className={styles.section} id="profile-reviews" aria-labelledby="profile-reviews-title" aria-busy={reviewsLoading}>
        <h2 id="profile-reviews-title">{t("allReviews")}</h2>
        {reviewsLoading && <p className={styles.feedback} role="status">{t("loading")}</p>}
        {reviewsError && <RetryNotice className={styles.feedback} message={t("loadReviewsError")} retryLabel={t("retry")} onRetry={() => setReviewsAttempt(value => value + 1)} />}
        {!reviewsLoading && !reviewsError && reviewsHistory && <>
          {reviewsHistory.content.length === 0 ? <p>{t("noReviews")}</p> : <ul className={styles.reviewCards}>{reviewsHistory.content.map(item => {
            const title = editorialText(item.movieTitle, t("untitledFilm"));
            const poster = item.moviePhotoUrl === undefined
              ? profile.recentRatings.find(rating => rating.movieId === item.movieId)?.moviePhotoUrl
              : item.moviePhotoUrl;
            return <li key={item.reviewId} className={styles.reviewCard}>
              <Link className={styles.reviewPosterLink} to={path(`/films/${item.movieId}`)} aria-label={title}>
                <ResilientImage className={styles.railPoster} src={poster} alt="" loading="lazy" fallback={<span className={styles.railPosterFallback}>{title.slice(0, 1).toUpperCase()}</span>} />
              </Link>
              <div className={styles.reviewCopy}>
                <h3><Link to={path(`/films/${item.movieId}`)}>{title}</Link></h3>
                <time dateTime={item.updatedAt}>{formatDateTime(item.updatedAt, lang)}</time>
                <Link className={styles.reviewContent} to={path(`/reviews/${item.reviewId}`)}>{item.content}</Link>
              </div>
            </li>;
          })}</ul>}
          <Pagination className={styles.pagination} page={reviewsPage} totalPages={reviewsHistory.totalPages} label={t("allReviews")} busy={reviewsLoading} onPageChange={setReviewsPage} />
        </>}
      </section>
      <section className={styles.section} id="profile-following" aria-labelledby="profile-following-title" aria-busy={followingLoading}>
        <h2 id="profile-following-title">{t("following")}</h2>
        {followingLoading && <p className={styles.feedback} role="status">{t("loading")}</p>}
        {followingError && <RetryNotice className={styles.feedback} message={t("loadNetworkError")} retryLabel={t("retry")} onRetry={() => setFollowingAttempt(value => value + 1)} />}
        {!followingLoading && !followingError && following && (following.content.length === 0 ? <p>{t("noFollowing")}</p> : <ul className={styles.userList}>
          {following.content.map(networkUser => <li key={networkUser.id}>
            <Link className={styles.userRow} to={path(`/users/${networkUser.id}`)}>
              <ResilientImage src={networkUser.avatarUrl} alt="" width={42} height={42} fallback={<span className={styles.userAvatarFallback} aria-hidden="true">{getUserInitial(networkUser)}</span>} />
              <span><strong>{getUserName(networkUser, t("someone"))}</strong><small>{getUserHandle(networkUser, t("someone"))}</small></span>
            </Link>
          </li>)}
        </ul>)}
        {!followingLoading && !followingError && following && <Pagination className={styles.pagination} page={followingPage} totalPages={following.totalPages} label={t("networkPagination")} busy={followingLoading} onPageChange={setFollowingPage} />}
      </section>
      <section className={styles.section} id="profile-lists" aria-labelledby="profile-lists-title">
        <h2 id="profile-lists-title">{t("lists")}</h2>
        {profile.lists.length === 0 ? <p className={styles.empty}>{t("noLists")}</p> : <ul className={styles.listLinks}>{profile.lists.map(list => <li key={list.id}><Link to={path(list.isPublic ? `/lists/public/${list.id}` : "/lists")}>{editorialText(list.name, t("lists"))}</Link></li>)}</ul>}
      </section>
      <section className={styles.section} id="profile-collections" aria-labelledby="profile-collections-title" aria-busy={collectionLoading}>
        <h2 id="profile-collections-title">{t("profileCollections")}</h2>
        <div className={styles.tabs} role="tablist" aria-orientation="horizontal" aria-label={t("profileCollections")}>
          {collectionKinds.map(kind => <button
            id={`profile-collection-tab-${kind}`}
            key={kind}
            ref={setTabRef(kind)}
            type="button"
            role="tab"
            tabIndex={collectionKind === kind ? 0 : -1}
            aria-selected={collectionKind === kind}
            aria-controls="profile-collection-content"
            onClick={() => chooseCollection(kind)}
            onKeyDown={event => handleKeyDown(event, kind)}
          >
            {kind === "favorites" ? t("favorite") : t(kind)}
          </button>)}
        </div>
        <div id="profile-collection-content" role="tabpanel" tabIndex={0} aria-labelledby={`profile-collection-tab-${collectionKind}`}>
          {collectionLoading && <p className={styles.feedback} role="status">{t("loading")}</p>}
          {collectionError && <RetryNotice className={styles.feedback} message={t("loadCollectionError")} retryLabel={t("retry")} onRetry={() => setCollectionAttempt(value => value + 1)} />}
          {!collectionLoading && !collectionError && collection && <>
            {collection.content.length === 0 ? <p>{t("noCollectionFilms")}</p> : <div className={styles.collectionGrid}>
            {collection.content.map(movie => {
              const movieTitle = editorialText(movie.title, t("untitledFilm"));
              return <article className={styles.collectionCard} key={movie.id}>
                <Link className={styles.collectionPosterLink} to={path(`/films/${movie.id}`)} aria-label={`${movieTitle} ${t("poster")}`}>
                  <ResilientImage className={styles.collectionPoster} src={movie.photoUrl} alt="" loading="lazy" fallback={<span className={styles.collectionPosterFallback}>{movieTitle.slice(0, 1).toUpperCase()}</span>} />
                </Link>
                <h3><Link to={path(`/films/${movie.id}`)}>{movieTitle}</Link></h3>
                <p>{formatMovieYear(movie.releaseDate, t("unknownYear"))}{movie.rating !== null ? ` · ★ ${movie.rating}` : ""}</p>
              </article>;
            })}
            </div>}
            <Pagination className={styles.pagination} page={collectionPage} totalPages={collection.totalPages} label={t("profileCollectionPagination")} busy={collectionLoading} onPageChange={setCollectionPage} />
          </>}
        </div>
      </section>
      <section className={`${styles.section} ${styles.settingsSection}`} aria-labelledby="newsletter-settings" aria-busy={newsletterLoading || newsletterBusy}><h2 id="newsletter-settings">{t("newsletter")}</h2>
        {newsletterLoading && <p className={styles.feedback} role="status">{t("loading")}</p>}
        {newsletterLoadError && <RetryNotice className={styles.feedback} message={t("loadNewsletterError")} retryLabel={t("retry")} onRetry={() => setNewsletterAttempt(value => value + 1)} />}
        {newsletterSaveError && newsletterRetry !== null && <RetryNotice className={styles.feedback} message={t("newsletterError")} retryLabel={t("retry")} disabled={newsletterBusy} busy={newsletterBusy} onRetry={retryNewsletter} />}
        {!newsletterLoading && !newsletterLoadError && <label><input type="checkbox" aria-busy={newsletterBusy} checked={newsletterSubscribed} disabled={newsletterBusy} onChange={event => { void toggleNewsletter(event.target.checked); }} /> {t("newsletterEnabled")}</label>}
      </section>
      <section className={`${styles.section} ${styles.settingsSection}`} aria-labelledby="social-links-settings" aria-busy={socialLinksLoading || socialLinksBusy}>
        <h2 id="social-links-settings">{t("socialLinks")}</h2>
        {socialLinksLoading && <p className={styles.feedback} role="status">{t("loading")}</p>}
        {socialLinksError && <RetryNotice className={styles.feedback} message={t("loadSocialLinksError")} retryLabel={t("retry")} onRetry={() => setSocialLinksAttempt(value => value + 1)} />}
        {!socialLinksLoading && !socialLinksError && <form className={styles.inlineForm} aria-labelledby="social-links-settings" aria-busy={socialLinksBusy} onSubmit={saveSocialLinks}>
          {socialLinkPlatforms.map(platform => <label key={platform} htmlFor={`social-link-${platform}`}>{t(socialLinkLabelKeys[platform])} <input id={`social-link-${platform}`} type="url" disabled={socialLinksBusy} value={socialLinkValues[platform]} placeholder="https://…" maxLength={255} onChange={event => setSocialLinkValues(values => ({ ...values, [platform]: event.target.value }))} /></label>)}
          <button className={styles.primaryButton} type="submit" disabled={socialLinksBusy}>{socialLinksBusy ? t("saving") : t("save")}</button>
        </form>}
      </section>
      <form ref={identityFormRef} className={styles.form} aria-labelledby="profile-identity-form-title" onSubmit={saveName} aria-busy={nameBusy}>
        <h2 id="profile-identity-form-title">{t("profileIdentity")}</h2>
        <label htmlFor="profile-display-name">{t("displayName")}</label>
        <input ref={displayNameInputRef} id="profile-display-name" value={displayName} disabled={nameBusy} minLength={displayName.trim() ? 2 : undefined} maxLength={60} onChange={e => setDisplayName(e.target.value)} />
        <label htmlFor="profile-avatar-url">{t("avatarUrl")}</label>
        <input id="profile-avatar-url" type="url" disabled={nameBusy} value={avatarUrl} maxLength={255} placeholder="https://…" onChange={e => setAvatarUrl(e.target.value)} />
        <button className={styles.primaryButton} type="submit" disabled={nameBusy}>{nameBusy ? t("saving") : t("save")}</button>
      </form>
      <form className={styles.form} aria-labelledby="profile-password-form-title" onSubmit={savePassword} aria-busy={passwordBusy}>
        <h2 id="profile-password-form-title">{t("changePassword")}</h2>
        <label htmlFor="profile-current-password">{t("currentPassword")}</label>
        <input id="profile-current-password" type="password" required disabled={passwordBusy} autoComplete="current-password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />
        <label htmlFor="profile-new-password">{t("newPassword")}</label>
        <input id="profile-new-password" type="password" required disabled={passwordBusy} minLength={8} maxLength={MAX_PASSWORD_BYTES} autoComplete="new-password" value={newPassword} onChange={e => setNewPassword(e.target.value)} aria-invalid={Boolean(error) && !isPasswordWithinByteLimit(newPassword)} aria-describedby={`profile-password-hint${error ? " profile-action-error" : ""}`} />
        <p className={styles.passwordHint} id="profile-password-hint">{t("passwordByteLimitHint")}</p>
        <button className={styles.primaryButton} type="submit" disabled={passwordBusy}>{passwordBusy ? t("saving") : t("changePassword")}</button>
      </form>
      <form className={`${styles.form} ${styles.dangerForm}`} aria-labelledby="profile-delete-form-title" onSubmit={removeAccount} aria-busy={deleteBusy}>
        <h2 id="profile-delete-form-title">{t("deleteAccount")}</h2>
        <p>{t("deleteAccountWarning")}</p>
        <label htmlFor="profile-delete-password">{t("currentPassword")}</label>
        <input id="profile-delete-password" type="password" required disabled={deleteBusy} autoComplete="current-password" value={deletePassword} onChange={e => setDeletePassword(e.target.value)} />
        <button className={styles.dangerButton} type="submit" disabled={deleteBusy}>{deleteBusy ? t("deleting") : t("deleteAccount")}</button>
      </form>
    </>}
    </div>
  </main>;
}
