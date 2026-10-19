import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { changePassword, deleteAccount, getProfile, getProfileCollection, getProfileRatings, getProfileReviews, getSocialLinks, updateSocialLinks, type ProfileCollection, type ProfilePage, type ProfileRating, type ProfileReview, type SocialLink, updateProfile } from "../api/profile.api";
import { getNewsletterSubscription, updateNewsletterSubscription } from "../api/newsletter.api";
import type { MoviePage } from "../api/search.api";
import { getFollowing, type NetworkPage } from "../api/social.api";
import ResilientImage from "../components/ResilientImage";
import { useAuth } from "../context/AuthContext";
import { useLocale } from "../i18n";
import styles from "./Profile.module.css";

interface ProfileData {
  username: string;
  displayName: string;
  email: string;
  avatarUrl: string | null;
  stats: { ratings: number; reviews: number; watched: number; watchlist: number; favorites: number };
  lists: { id: number; name: string }[];
  recentRatings: { movieId: number; movieTitle: string; rating: number }[];
  recentReviews: { reviewId: number; movieId: number; movieTitle: string; content: string }[];
}

export default function Profile() {
  const { isAuth, ready, logout, user } = useAuth();
  const navigate = useNavigate();
  const { path, t } = useLocale();
  const [profile, setProfile] = useState<ProfileData | null>(null);
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
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);
  const [newsletterLoading, setNewsletterLoading] = useState(false);
  const [newsletterLoadError, setNewsletterLoadError] = useState(false);
  const [newsletterAttempt, setNewsletterAttempt] = useState(0);
  const [newsletterBusy, setNewsletterBusy] = useState(false);
  const [newsletterRetry, setNewsletterRetry] = useState<boolean | null>(null);
  const [newsletterSaveError, setNewsletterSaveError] = useState(false);
  const [socialLinkValues, setSocialLinkValues] = useState<Record<string, string>>({ website: "", instagram: "", tiktok: "", letterboxd: "" });
  const [socialLinksLoading, setSocialLinksLoading] = useState(false);
  const [socialLinksError, setSocialLinksError] = useState(false);
  const [socialLinksAttempt, setSocialLinksAttempt] = useState(0);
  const [socialLinksBusy, setSocialLinksBusy] = useState(false);
  const [nameBusy, setNameBusy] = useState(false);
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [accountDeleted, setAccountDeleted] = useState(false);
  const [passwordChanged, setPasswordChanged] = useState(false);
  const socialLinkLabelKeys: Record<string, string> = { website: "socialWebsite", instagram: "socialInstagram", tiktok: "socialTiktok", letterboxd: "socialLetterboxd" };

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
  }, [isAuth, profileAttempt]);

  useEffect(() => {
    if (!isAuth) return;
    let current = true;
    setNewsletterLoading(true);
    setNewsletterLoadError(false);
    getNewsletterSubscription().then(({ data }) => { if (current) { setNewsletterSubscribed(data.subscribed); setNewsletterRetry(null); setNewsletterSaveError(false); } })
      .catch(() => { if (current) setNewsletterLoadError(true); })
      .finally(() => { if (current) setNewsletterLoading(false); });
    return () => { current = false; };
  }, [isAuth, newsletterAttempt]);

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
  }, [isAuth, socialLinksAttempt]);

  useEffect(() => {
    if (!isAuth) return;
    let current = true;
    setCollectionLoading(true);
    setCollectionError(false);
    setCollection(null);
    getProfileCollection(collectionKind, collectionPage)
      .then(({ data }) => { if (current) setCollection(data); })
      .catch(() => { if (current) setCollectionError(true); })
      .finally(() => { if (current) setCollectionLoading(false); });
    return () => { current = false; };
  }, [isAuth, collectionKind, collectionPage, collectionAttempt]);

  useEffect(() => {
    if (!isAuth) return;
    let current = true;
    setRatingsLoading(true);
    setRatingsError(false);
    setRatingsHistory(null);
    getProfileRatings(ratingsPage)
      .then(({ data }) => { if (current) setRatingsHistory(data); })
      .catch(() => { if (current) setRatingsError(true); })
      .finally(() => { if (current) setRatingsLoading(false); });
    return () => { current = false; };
  }, [isAuth, ratingsPage, ratingsAttempt]);

  useEffect(() => {
    if (!isAuth) return;
    let current = true;
    setReviewsLoading(true);
    setReviewsError(false);
    setReviewsHistory(null);
    getProfileReviews(reviewsPage)
      .then(({ data }) => { if (current) setReviewsHistory(data); })
      .catch(() => { if (current) setReviewsError(true); })
      .finally(() => { if (current) setReviewsLoading(false); });
    return () => { current = false; };
  }, [isAuth, reviewsPage, reviewsAttempt]);

  useEffect(() => {
    if (!isAuth || !user?.id) return;
    let current = true;
    setFollowingLoading(true);
    setFollowingError(false);
    setFollowing(null);
    getFollowing(user.id, followingPage)
      .then(({ data }) => { if (current) setFollowing(data); })
      .catch(() => { if (current) setFollowingError(true); })
      .finally(() => { if (current) setFollowingLoading(false); });
    return () => { current = false; };
  }, [isAuth, user?.id, followingPage, followingAttempt]);

  const chooseCollection = (kind: ProfileCollection) => {
    setCollectionKind(kind);
    setCollectionPage(0);
  };

  if (!ready) return <main>{t("loading")}</main>;
  if (!isAuth && !accountDeleted && !passwordChanged) return <Navigate to={path("/login")} replace />;

  const saveName = async (event: React.FormEvent) => {
    event.preventDefault();
    if (nameBusy) return;
    setNameBusy(true);
    setError("");
    try {
      if (avatarUrl && !/^https?:\/\//i.test(avatarUrl)) { setError(t("invalidAvatarUrl")); return; }
      const { data } = await updateProfile({ displayName: displayName.trim(), avatarUrl: avatarUrl.trim() });
      setProfile(data);
      setMessage(t("nameSaved"));
    } catch { setError(t("saveNameError")); }
    finally { setNameBusy(false); }
  };

  const savePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    if (passwordBusy) return;
    setPasswordBusy(true);
    setError("");
    try {
      await changePassword(currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      try {
        setPasswordChanged(true);
        await logout();
        navigate(`${path("/login")}?passwordChanged=1`, { replace: true });
      } catch {
        setError(t("passwordChangedLogoutError"));
      }
    } catch { setError(t("changePasswordError")); }
    finally { setPasswordBusy(false); }
  };
  const removeAccount = async (event: React.FormEvent) => {
    event.preventDefault();
    if (deleteBusy) return;
    setError("");
    if (!window.confirm(t("deleteAccountConfirm"))) return;
    setDeleteBusy(true);
    try { await deleteAccount(deletePassword); setAccountDeleted(true); await logout(); navigate(path("/home"), { replace: true }); }
    catch { setError(t("deleteAccountError")); }
    finally { setDeleteBusy(false); }
  };
  const toggleNewsletter = async (subscribed: boolean) => {
    if (newsletterBusy) return;
    setNewsletterBusy(true);
    setNewsletterRetry(null);
    setNewsletterSaveError(false);
    setError("");
    try {
      const { data } = await updateNewsletterSubscription(subscribed);
      setNewsletterSubscribed(data.subscribed);
      setNewsletterRetry(null);
      setMessage(t("newsletterSaved"));
    } catch {
      setNewsletterRetry(subscribed);
      setNewsletterSaveError(true);
    }
    finally { setNewsletterBusy(false); }
  };

  const retryNewsletter = () => {
    if (newsletterRetry !== null) void toggleNewsletter(newsletterRetry);
  };
  const saveSocialLinks = async (event: React.FormEvent) => {
    event.preventDefault();
    if (socialLinksBusy) return;
    setSocialLinksBusy(true);
    setError("");
    try {
      const links = Object.entries(socialLinkValues).filter(([, url]) => url.trim()).map(([platform, url]) => ({ platform, url: url.trim() }));
      const { data } = await updateSocialLinks(links);
      applySocialLinks(data);
      setMessage(t("socialLinksSaved"));
    } catch { setError(t("socialLinksSaveError")); }
    finally { setSocialLinksBusy(false); }
  };

  return <main className={styles.page} aria-busy={profileLoading}>
    <div className={styles.content}>
    <h1 className={styles.pageTitle}>{t("myProfile")}</h1>
    {error && <p className={styles.alert} role="alert">{error}</p>}
    {message && <p className={styles.status} role="status">{message}</p>}
    {profileLoading && <p className={styles.feedback} role="status">{t("loading")}</p>}
    {profileLoadError && <p className={styles.feedback} role="alert">{t("loadProfileError")} <button type="button" onClick={() => setProfileAttempt(value => value + 1)}>{t("retry")}</button></p>}
    {profile && <>
      <section className={styles.hero} aria-labelledby="profile-identity">
        <ResilientImage className={styles.avatar} src={profile.avatarUrl} alt="" width={96} height={96}
          fallback={<span className={styles.avatarFallback} aria-hidden="true">{(profile.displayName || profile.username).slice(0, 1).toUpperCase()}</span>} />
        <div><h2 id="profile-identity">@{profile.username}</h2><p>{profile.email}</p></div>
      </section>
      <section className={styles.section} aria-labelledby="profile-following" aria-busy={followingLoading}>
        <h2 id="profile-following">{t("following")}</h2>
        {followingLoading && <p className={styles.feedback} role="status">{t("loading")}</p>}
        {followingError && <p className={styles.feedback} role="alert">{t("loadNetworkError")} <button type="button" onClick={() => setFollowingAttempt(value => value + 1)}>{t("retry")}</button></p>}
        {!followingLoading && !followingError && following && (following.content.length === 0 ? <p>{t("noFollowing")}</p> : <ul className={styles.userList}>
          {following.content.map(networkUser => <li key={networkUser.id}>
            <Link className={styles.userRow} to={path(`/users/${networkUser.id}`)}>
              <ResilientImage src={networkUser.avatarUrl} alt="" width={42} height={42} fallback={<span className={styles.userAvatarFallback} aria-hidden="true">{(networkUser.displayName || networkUser.username).slice(0, 1).toUpperCase()}</span>} />
              <span><strong>{networkUser.displayName || networkUser.username}</strong><small>@{networkUser.username}</small></span>
            </Link>
          </li>)}
        </ul>)}
        {!followingLoading && !followingError && following && following.totalPages > 1 && <nav className={styles.pagination} aria-label={t("networkPagination")}>
          <button type="button" disabled={followingPage === 0} onClick={() => setFollowingPage(page => page - 1)}>{t("previous")}</button>
          <span>{t("page")} {followingPage + 1} {t("of")} {following.totalPages}</span>
          <button type="button" disabled={followingPage + 1 >= following.totalPages} onClick={() => setFollowingPage(page => page + 1)}>{t("next")}</button>
        </nav>}
      </section>
      <section className={styles.section} aria-labelledby="profile-stats"><h2 id="profile-stats">{t("profileStats")}</h2><div className={styles.stats}><span>{t("watched")}: {profile.stats.watched}</span><span>{t("watchlist")}: {profile.stats.watchlist}</span><span>{t("favorite")}: {profile.stats.favorites}</span><span>{t("reviews")}: {profile.stats.reviews}</span><span>{t("ratings")}: {profile.stats.ratings}</span></div></section>
      <section className={styles.section} aria-labelledby="newsletter-settings" aria-busy={newsletterLoading || newsletterBusy}><h2 id="newsletter-settings">{t("newsletter")}</h2>
        {newsletterLoading && <p className={styles.feedback} role="status">{t("loading")}</p>}
        {newsletterLoadError && <p className={styles.feedback} role="alert">{t("loadNewsletterError")} <button type="button" onClick={() => setNewsletterAttempt(value => value + 1)}>{t("retry")}</button></p>}
        {newsletterSaveError && newsletterRetry !== null && <p className={styles.feedback} role="alert">{t("newsletterError")} <button type="button" disabled={newsletterBusy} aria-busy={newsletterBusy} onClick={retryNewsletter}>{t("retry")}</button></p>}
        {!newsletterLoading && !newsletterLoadError && <label><input type="checkbox" aria-busy={newsletterBusy} checked={newsletterSubscribed} disabled={newsletterBusy} onChange={event => { void toggleNewsletter(event.target.checked); }} /> {t("newsletterEnabled")}</label>}
      </section>
      <section className={styles.section} aria-labelledby="social-links-settings" aria-busy={socialLinksLoading || socialLinksBusy}>
        <h2 id="social-links-settings">{t("socialLinks")}</h2>
        {socialLinksLoading && <p className={styles.feedback} role="status">{t("loading")}</p>}
        {socialLinksError && <p className={styles.feedback} role="alert">{t("loadSocialLinksError")} <button type="button" onClick={() => setSocialLinksAttempt(value => value + 1)}>{t("retry")}</button></p>}
        {!socialLinksLoading && !socialLinksError && <form className={styles.inlineForm} onSubmit={saveSocialLinks}>
          {Object.keys(socialLinkValues).map(platform => <label key={platform} htmlFor={`social-link-${platform}`}>{t(socialLinkLabelKeys[platform] ?? platform)} <input id={`social-link-${platform}`} type="url" value={socialLinkValues[platform]} placeholder="https://…" maxLength={255} onChange={event => setSocialLinkValues(values => ({ ...values, [platform]: event.target.value }))} /></label>)}
          <button className={styles.primaryButton} type="submit" disabled={socialLinksBusy}>{socialLinksBusy ? t("saving") : t("save")}</button>
        </form>}
      </section>
      <form className={styles.form} onSubmit={saveName} aria-busy={nameBusy}>
        <h2>{t("profileIdentity")}</h2>
        <label htmlFor="profile-display-name">{t("displayName")}</label>
        <input id="profile-display-name" value={displayName} minLength={displayName.trim() ? 2 : undefined} maxLength={60} onChange={e => setDisplayName(e.target.value)} />
        <label htmlFor="profile-avatar-url">{t("avatarUrl")}</label>
        <input id="profile-avatar-url" type="url" value={avatarUrl} maxLength={255} placeholder="https://…" onChange={e => setAvatarUrl(e.target.value)} />
        <button className={styles.primaryButton} type="submit" disabled={nameBusy}>{nameBusy ? t("saving") : t("save")}</button>
      </form>
      <form className={styles.form} onSubmit={savePassword} aria-busy={passwordBusy}>
        <h2>{t("changePassword")}</h2>
        <label htmlFor="profile-current-password">{t("currentPassword")}</label>
        <input id="profile-current-password" type="password" required value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />
        <label htmlFor="profile-new-password">{t("newPassword")}</label>
        <input id="profile-new-password" type="password" required value={newPassword} onChange={e => setNewPassword(e.target.value)} />
        <button className={styles.primaryButton} type="submit" disabled={passwordBusy}>{passwordBusy ? t("saving") : t("changePassword")}</button>
      </form>
      <form className={`${styles.form} ${styles.dangerForm}`} onSubmit={removeAccount} aria-busy={deleteBusy}>
        <h2>{t("deleteAccount")}</h2>
        <p>{t("deleteAccountWarning")}</p>
        <label htmlFor="profile-delete-password">{t("currentPassword")}</label>
        <input id="profile-delete-password" type="password" required value={deletePassword} onChange={e => setDeletePassword(e.target.value)} />
        <button className={styles.dangerButton} type="submit" disabled={deleteBusy}>{deleteBusy ? t("deleting") : t("deleteAccount")}</button>
      </form>
      <section className={styles.section} aria-labelledby="profile-collections" aria-busy={collectionLoading}>
        <h2 id="profile-collections">{t("profileCollections")}</h2>
        <div className={styles.tabs} role="tablist" aria-label={t("profileCollections")}>
          {(["watched", "watchlist", "favorites"] as const).map(kind => <button id={`profile-collection-tab-${kind}`} key={kind} type="button" role="tab" aria-selected={collectionKind === kind} aria-controls="profile-collection-content" onClick={() => chooseCollection(kind)}>
            {kind === "favorites" ? t("favorite") : t(kind)}
          </button>)}
        </div>
        <div id="profile-collection-content" role="tabpanel" tabIndex={0} aria-labelledby={`profile-collection-tab-${collectionKind}`}>
          {collectionLoading && <p className={styles.feedback} role="status">{t("loading")}</p>}
          {collectionError && <p className={styles.feedback} role="alert">{t("loadCollectionError")} <button type="button" onClick={() => setCollectionAttempt(value => value + 1)}>{t("retry")}</button></p>}
          {!collectionLoading && !collectionError && collection && <>
            {collection.content.length === 0 ? <p>{t("noCollectionFilms")}</p> : <div className={styles.collectionGrid}>
            {collection.content.map(movie => <article className={styles.collectionCard} key={movie.id}>
              <Link className={styles.collectionPosterLink} to={path(`/films/${movie.id}`)} aria-label={`${movie.title} ${t("poster")}`}>
                <ResilientImage className={styles.collectionPoster} src={movie.photoUrl} alt="" loading="lazy" fallback={<span className={styles.collectionPosterFallback}>{movie.title.slice(0, 1).toUpperCase()}</span>} />
              </Link>
              <h3><Link to={path(`/films/${movie.id}`)}>{movie.title}</Link></h3>
              <p>{movie.releaseDate ? movie.releaseDate.slice(0, 4) : "—"}{movie.rating !== null ? ` · ★ ${movie.rating}` : ""}</p>
            </article>)}
            </div>}
            {collection.totalPages > 1 && <nav className={styles.pagination} aria-label={t("pagination")}>
              <button type="button" disabled={collectionPage === 0} onClick={() => setCollectionPage(page => page - 1)}>{t("previous")}</button>
              <span>{t("page")} {collectionPage + 1} {t("of")} {collection.totalPages}</span>
              <button type="button" disabled={collectionPage + 1 >= collection.totalPages} onClick={() => setCollectionPage(page => page + 1)}>{t("next")}</button>
            </nav>}
          </>}
        </div>
      </section>
      <section className={styles.section} aria-labelledby="profile-lists">
        <h2 id="profile-lists">{t("lists")}</h2>
        {profile.lists.length === 0 ? <p className={styles.empty}>{t("noLists")}</p> : <ul className={styles.listLinks}>{profile.lists.map(list => <li key={list.id}><Link to={path("/lists")}>{list.name}</Link></li>)}</ul>}
      </section>
      <section className={styles.section} aria-labelledby="profile-ratings" aria-busy={ratingsLoading}>
        <h2 id="profile-ratings">{t("allRatings")}</h2>
        {ratingsLoading && <p className={styles.feedback} role="status">{t("loading")}</p>}
        {ratingsError && <p className={styles.feedback} role="alert">{t("loadRatingsError")} <button type="button" onClick={() => setRatingsAttempt(value => value + 1)}>{t("retry")}</button></p>}
        {!ratingsLoading && !ratingsError && ratingsHistory && <>
          {ratingsHistory.content.length === 0 ? <p>{t("noRatings")}</p> : <ul>{ratingsHistory.content.map(item => <li key={item.movieId}><Link to={path(`/films/${item.movieId}`)}>{item.movieTitle}</Link> — {item.rating}/5</li>)}</ul>}
          {ratingsHistory.totalPages > 1 && <nav className={styles.pagination} aria-label={t("allRatings")}>
            <button type="button" disabled={ratingsPage === 0} onClick={() => setRatingsPage(page => page - 1)}>{t("previous")}</button>
            <span>{t("page")} {ratingsPage + 1} {t("of")} {ratingsHistory.totalPages}</span>
            <button type="button" disabled={ratingsPage + 1 >= ratingsHistory.totalPages} onClick={() => setRatingsPage(page => page + 1)}>{t("next")}</button>
          </nav>}
        </>}
      </section>
      <section className={styles.section} aria-labelledby="profile-reviews" aria-busy={reviewsLoading}>
        <h2 id="profile-reviews">{t("allReviews")}</h2>
        {reviewsLoading && <p className={styles.feedback} role="status">{t("loading")}</p>}
        {reviewsError && <p className={styles.feedback} role="alert">{t("loadReviewsError")} <button type="button" onClick={() => setReviewsAttempt(value => value + 1)}>{t("retry")}</button></p>}
        {!reviewsLoading && !reviewsError && reviewsHistory && <>
          {reviewsHistory.content.length === 0 ? <p>{t("noReviews")}</p> : <ul>{reviewsHistory.content.map(item => <li key={item.reviewId}><Link to={path(`/films/${item.movieId}`)}>{item.movieTitle}</Link>: {item.content}</li>)}</ul>}
          {reviewsHistory.totalPages > 1 && <nav className={styles.pagination} aria-label={t("allReviews")}>
            <button type="button" disabled={reviewsPage === 0} onClick={() => setReviewsPage(page => page - 1)}>{t("previous")}</button>
            <span>{t("page")} {reviewsPage + 1} {t("of")} {reviewsHistory.totalPages}</span>
            <button type="button" disabled={reviewsPage + 1 >= reviewsHistory.totalPages} onClick={() => setReviewsPage(page => page + 1)}>{t("next")}</button>
          </nav>}
        </>}
      </section>
    </>}
    </div>
  </main>;
}
