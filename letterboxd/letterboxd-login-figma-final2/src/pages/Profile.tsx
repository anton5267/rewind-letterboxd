import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { changePassword, deleteAccount, getProfile, getProfileCollection, getProfileRatings, getProfileReviews, getSocialLinks, updateSocialLinks, type ProfileCollection, type ProfilePage, type ProfileRating, type ProfileReview, type SocialLink, updateProfile } from "../api/profile.api";
import { getNewsletterSubscription, updateNewsletterSubscription } from "../api/newsletter.api";
import type { MoviePage } from "../api/search.api";
import { useAuth } from "../context/AuthContext";
import { useLocale } from "../i18n";

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
  const { isAuth, ready, logout } = useAuth();
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
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);
  const [newsletterLoading, setNewsletterLoading] = useState(false);
  const [newsletterLoadError, setNewsletterLoadError] = useState(false);
  const [newsletterAttempt, setNewsletterAttempt] = useState(0);
  const [newsletterBusy, setNewsletterBusy] = useState(false);
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [socialLinkValues, setSocialLinkValues] = useState<Record<string, string>>({ website: "", instagram: "", tiktok: "", letterboxd: "" });
  const [socialLinksLoading, setSocialLinksLoading] = useState(false);
  const [socialLinksError, setSocialLinksError] = useState(false);
  const [socialLinksBusy, setSocialLinksBusy] = useState(false);
  const [nameBusy, setNameBusy] = useState(false);
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [accountDeleted, setAccountDeleted] = useState(false);
  const [passwordChanged, setPasswordChanged] = useState(false);
  const socialLinkLabelKeys: Record<string, string> = { website: "socialWebsite", instagram: "socialInstagram", tiktok: "socialTiktok", letterboxd: "socialLetterboxd" };

  const applySocialLinks = (data: SocialLink[]) => {
    setSocialLinks(data);
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
    getNewsletterSubscription().then(({ data }) => { if (current) setNewsletterSubscribed(data.subscribed); })
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
  }, [isAuth]);

  useEffect(() => {
    if (!isAuth) return;
    let current = true;
    setCollectionLoading(true);
    setCollectionError(false);
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
    getProfileReviews(reviewsPage)
      .then(({ data }) => { if (current) setReviewsHistory(data); })
      .catch(() => { if (current) setReviewsError(true); })
      .finally(() => { if (current) setReviewsLoading(false); });
    return () => { current = false; };
  }, [isAuth, reviewsPage, reviewsAttempt]);

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
      const { data } = await updateProfile({ displayName, avatarUrl });
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
    setNewsletterBusy(true);
    setError("");
    try {
      const { data } = await updateNewsletterSubscription(subscribed);
      setNewsletterSubscribed(data.subscribed);
      setMessage(t("newsletterSaved"));
    } catch { setError(t("newsletterError")); }
    finally { setNewsletterBusy(false); }
  };
  const saveSocialLinks = async (event: React.FormEvent) => {
    event.preventDefault();
    if (socialLinksBusy) return;
    setSocialLinksBusy(true);
    setError("");
    try {
      const links = Object.entries(socialLinkValues).filter(([, url]) => url.trim()).map(([platform, url]) => ({ platform, url: url.trim() }));
      const { data } = await updateSocialLinks(links);
      setSocialLinks(data);
      setMessage(t("socialLinksSaved"));
    } catch { setError(t("socialLinksSaveError")); }
    finally { setSocialLinksBusy(false); }
  };

  return <main style={{ background: "#151515", color: "white", minHeight: "70vh", padding: "110px 5% 40px" }}>
    <h1>{t("myProfile")}</h1>
    {error && <p role="alert">{error}</p>}
    {message && <p role="status">{message}</p>}
    {profileLoading && <p aria-live="polite">{t("loading")}</p>}
    {profileLoadError && <p role="alert">{t("loadProfileError")} <button type="button" onClick={() => setProfileAttempt(value => value + 1)}>{t("retry")}</button></p>}
    {profile && <>
      {profile.avatarUrl && <img src={profile.avatarUrl} alt="" width="96" height="96" />}
      <p>@{profile.username} · {profile.email}</p>
      <section><h2>{t("profileStats")}</h2><p>{t("watched")}: {profile.stats.watched} · {t("watchlist")}: {profile.stats.watchlist} · {t("favorite")}: {profile.stats.favorites} · {t("reviews")}: {profile.stats.reviews} · {t("ratings")}: {profile.stats.ratings}</p></section>
      <section style={{ marginTop: 24 }} aria-labelledby="newsletter-settings"><h2 id="newsletter-settings">{t("newsletter")}</h2>
        {newsletterLoading && <p role="status">{t("loading")}</p>}
        {newsletterLoadError && <p role="alert">{t("loadNewsletterError")} <button type="button" onClick={() => setNewsletterAttempt(value => value + 1)}>{t("retry")}</button></p>}
        {!newsletterLoading && !newsletterLoadError && <label><input type="checkbox" checked={newsletterSubscribed} disabled={newsletterBusy} onChange={event => { void toggleNewsletter(event.target.checked); }} /> {t("newsletterEnabled")}</label>}
      </section>
      <section style={{ marginTop: 24 }} aria-labelledby="social-links-settings">
        <h2 id="social-links-settings">{t("socialLinks")}</h2>
        {socialLinksLoading && <p role="status">{t("loading")}</p>}
        {socialLinksError && <p role="alert">{t("loadSocialLinksError")} <button type="button" onClick={() => { setSocialLinksError(false); void getSocialLinks().then(({ data }) => { applySocialLinks(data); }).catch(() => setSocialLinksError(true)); }}>{t("retry")}</button></p>}
        {!socialLinksLoading && !socialLinksError && <form onSubmit={saveSocialLinks}>
          {Object.keys(socialLinkValues).map(platform => <label key={platform} htmlFor={`social-link-${platform}`}>{t(socialLinkLabelKeys[platform] ?? platform)} <input id={`social-link-${platform}`} type="url" value={socialLinkValues[platform]} placeholder="https://…" maxLength={255} onChange={event => setSocialLinkValues(values => ({ ...values, [platform]: event.target.value }))} /></label>)}
          <button type="submit" disabled={socialLinksBusy}>{socialLinksBusy ? t("saving") : t("save")}</button>
        </form>}
      </section>
      <form onSubmit={saveName}>
        <label>{t("displayName")} <input value={displayName} minLength={2} maxLength={60} onChange={e => setDisplayName(e.target.value)} /></label>
        <label> {t("avatarUrl")} <input type="url" value={avatarUrl} maxLength={255} placeholder="https://…" onChange={e => setAvatarUrl(e.target.value)} /></label>
        <button type="submit" disabled={nameBusy}>{nameBusy ? t("saving") : t("save")}</button>
      </form>
      <form onSubmit={savePassword} style={{ marginTop: 24 }}>
        <h2>{t("changePassword")}</h2>
        <label>{t("currentPassword")} <input type="password" required value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} /></label>
        <label> {t("newPassword")} <input type="password" required value={newPassword} onChange={e => setNewPassword(e.target.value)} /></label>
        <button type="submit" disabled={passwordBusy}>{passwordBusy ? t("saving") : t("changePassword")}</button>
      </form>
      <form onSubmit={removeAccount} style={{ marginTop: 24 }}>
        <h2>{t("deleteAccount")}</h2>
        <p>{t("deleteAccountWarning")}</p>
        <label>{t("currentPassword")} <input type="password" required value={deletePassword} onChange={e => setDeletePassword(e.target.value)} /></label>
        <button type="submit" disabled={deleteBusy}>{deleteBusy ? t("deleting") : t("deleteAccount")}</button>
      </form>
      <section style={{ marginTop: 24 }}>
        <h2>{t("profileCollections")}</h2>
        <div role="tablist" aria-label={t("profileCollections")} style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {(["watched", "watchlist", "favorites"] as const).map(kind => <button key={kind} type="button" role="tab" aria-selected={collectionKind === kind} onClick={() => chooseCollection(kind)}>
            {kind === "favorites" ? t("favorite") : t(kind)}
          </button>)}
        </div>
        {collectionLoading && <p>{t("loading")}</p>}
        {collectionError && <p role="alert">{t("loadCollectionError")} <button type="button" onClick={() => setCollectionAttempt(value => value + 1)}>{t("retry")}</button></p>}
        {!collectionLoading && !collectionError && collection && <>
          {collection.content.length === 0 ? <p>{t("noCollectionFilms")}</p> : <ul>
            {collection.content.map(movie => <li key={movie.id}><Link to={path(`/films/${movie.id}`)}>{movie.title}</Link>{movie.releaseDate ? ` (${movie.releaseDate.slice(0, 4)})` : ""}{movie.rating !== null ? ` · ★ ${movie.rating}` : ""}</li>)}
          </ul>}
          {collection.totalPages > 1 && <nav aria-label={t("pagination")} style={{ display: "flex", gap: 8 }}>
            <button type="button" disabled={collectionPage === 0} onClick={() => setCollectionPage(page => page - 1)}>{t("previous")}</button>
            <span>{t("page")} {collectionPage + 1} {t("of")} {collection.totalPages}</span>
            <button type="button" disabled={collectionPage + 1 >= collection.totalPages} onClick={() => setCollectionPage(page => page + 1)}>{t("next")}</button>
          </nav>}
        </>}
      </section>
      <h2>{t("lists")}</h2>
      {profile.lists.length === 0 ? <p>{t("noLists")}</p> : <ul>{profile.lists.map(list => <li key={list.id}><Link to={path("/lists")}>{list.name}</Link></li>)}</ul>}
      <section>
        <h2>{t("allRatings")}</h2>
        {ratingsLoading && <p>{t("loading")}</p>}
        {ratingsError && <p role="alert">{t("loadRatingsError")} <button type="button" onClick={() => setRatingsAttempt(value => value + 1)}>{t("retry")}</button></p>}
        {!ratingsLoading && !ratingsError && ratingsHistory && <>
          {ratingsHistory.content.length === 0 ? <p>{t("noRatings")}</p> : <ul>{ratingsHistory.content.map(item => <li key={item.movieId}><Link to={path(`/films/${item.movieId}`)}>{item.movieTitle}</Link> — {item.rating}/5</li>)}</ul>}
          {ratingsHistory.totalPages > 1 && <nav aria-label={t("allRatings")} style={{ display: "flex", gap: 8 }}>
            <button type="button" disabled={ratingsPage === 0} onClick={() => setRatingsPage(page => page - 1)}>{t("previous")}</button>
            <span>{t("page")} {ratingsPage + 1} {t("of")} {ratingsHistory.totalPages}</span>
            <button type="button" disabled={ratingsPage + 1 >= ratingsHistory.totalPages} onClick={() => setRatingsPage(page => page + 1)}>{t("next")}</button>
          </nav>}
        </>}
      </section>
      <section>
        <h2>{t("allReviews")}</h2>
        {reviewsLoading && <p>{t("loading")}</p>}
        {reviewsError && <p role="alert">{t("loadReviewsError")} <button type="button" onClick={() => setReviewsAttempt(value => value + 1)}>{t("retry")}</button></p>}
        {!reviewsLoading && !reviewsError && reviewsHistory && <>
          {reviewsHistory.content.length === 0 ? <p>{t("noReviews")}</p> : <ul>{reviewsHistory.content.map(item => <li key={item.reviewId}><Link to={path(`/films/${item.movieId}`)}>{item.movieTitle}</Link>: {item.content}</li>)}</ul>}
          {reviewsHistory.totalPages > 1 && <nav aria-label={t("allReviews")} style={{ display: "flex", gap: 8 }}>
            <button type="button" disabled={reviewsPage === 0} onClick={() => setReviewsPage(page => page - 1)}>{t("previous")}</button>
            <span>{t("page")} {reviewsPage + 1} {t("of")} {reviewsHistory.totalPages}</span>
            <button type="button" disabled={reviewsPage + 1 >= reviewsHistory.totalPages} onClick={() => setReviewsPage(page => page + 1)}>{t("next")}</button>
          </nav>}
        </>}
      </section>
    </>}
  </main>;
}
