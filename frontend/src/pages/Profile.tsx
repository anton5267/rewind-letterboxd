import { profileBannerStyle } from "../utils/profileBannerStyle";
import PinnedProfileList from "../components/PinnedProfileList";
import { useAuth } from "../context/AuthContext";
import { useNavigate, useLocation, Navigate, Link } from "react-router-dom";
import { useLocale } from "../i18n";
import { getProfileRoute } from "./profile/profileRoute";
import { useProfileFeedback } from "./profile/useProfileFeedback";
import { useProfileIdentity } from "./profile/useProfileIdentity";
import { useProfileAccount } from "./profile/useProfileAccount";
import { useProfileConnections } from "./profile/useProfileConnections";
import { useProfileNewsletter } from "./profile/useProfileNewsletter";
import { useProfileCollections } from "./profile/useProfileCollections";
import { useProfileFavorites } from "./profile/useProfileFavorites";
import { useProfileLists } from "./profile/useProfileLists";
import { useProfileRatings } from "./profile/useProfileRatings";
import { useProfileReviews } from "./profile/useProfileReviews";
import { useProfileNetwork } from "./profile/useProfileNetwork";
import { useProfileActivity } from "./profile/useProfileActivity";
import { useActiveSection } from "../hooks/useActiveSection";
import { profileSectionIds, legacySettingsAnchors, profileNavigation, overviewNavigation, socialLinkPlatforms } from "./profile/profileConstants";
import { useState, useRef, useEffect } from "react";
import { type ProfileCollection } from "../api/profile.api";
import styles from "./Profile.module.css";
import { FollowActionsProvider } from "../context/FollowActionsContext";
import ProfileLoading from "../components/ProfileLoading";
import RetryNotice from "../components/RetryNotice";
import ResilientImage from "../components/ResilientImage";
import { getUserInitial, getUserIdentity, getUserHandle } from "../utils/userIdentity";
import ProfileSocialLinks from "../components/ProfileSocialLinks";
import ConfirmDialog from "../components/ConfirmDialog";
import ProfilePasswordForm from "./profile/ProfilePasswordForm";
import ProfileHostedLinkForm from "./profile/ProfileHostedLinkForm";
import ProfileSettingsView from "./profile/ProfileSettingsView";
import ProfileFavoritesSection from "./profile/ProfileFavoritesSection";
import ProfileActivitySection from "./profile/ProfileActivitySection";
import ProfileRatingsSection from "./profile/ProfileRatingsSection";
import ProfileReviewsSection from "./profile/ProfileReviewsSection";
import ProfileFollowingPreview from "./profile/ProfileFollowingPreview";
import ProfileFollowingSection from "./profile/ProfileFollowingSection";
import ProfileFollowersSection from "./profile/ProfileFollowersSection";
import ProfileListsSection from "./profile/ProfileListsSection";
import ProfileCollectionsSection from "./profile/ProfileCollectionsSection";

export default function Profile() {
  const { isAuth, ready, logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { path, t } = useLocale();
  const route = getProfileRoute(location.search);
  const { settingsTab, profileView, requestedReviewValue, networkView, collectionKind } = route;
  const feedback = useProfileFeedback({ route });
  const { setError, error, message } = feedback;
  const identity = useProfileIdentity({ route, feedback });
  const {
    profile,
    profileLoading,
    profileLoadError,
    nameBusy,
    pendingProfileLoadFocus,
    profileAttempt,
    currentProfileLoadFocusScope,
    profileLoadRequest,
    setProfileLoading,
    setProfileLoadError,
    setProfileAttempt,
    saveName,
    displayName,
    setDisplayName,
    bio,
    setBio,
    avatarUrl,
    setAvatarUrl,
  } = identity;

  const [activeProfileSection, setActiveProfileSection] = useActiveSection(profileSectionIds, "profile-overview", { enabled: profile !== null && !settingsTab, rootMargin: "-88px 0px -55% 0px", scopeKey: `${profile?.id ?? "loading"}:${profileView ?? "overview"}:${location.hash}` });

  const [profileActionsOpen, setProfileActionsOpen] = useState(false);

  const profileActionsButtonRef = useRef<HTMLButtonElement>(null);

  const profileActionsMenuRef = useRef<HTMLDivElement>(null);

  const previousSettingsView = useRef(Boolean(settingsTab));

  useEffect(() => {
    if (settingsTab) {
      previousSettingsView.current = true;
      return;
    }
    if (!profile) return;
    const returningToProfile = previousSettingsView.current;
    previousSettingsView.current = false;
    const anchor = location.hash.slice(1);
    const targetId = legacySettingsAnchors.has(anchor) ? anchor : returningToProfile ? "profile-identity" : null;
    if (!targetId) return;
    const frame = window.requestAnimationFrame(() => {
      const target = document.getElementById(targetId);
      if (!target) return;
      if (anchor) target.scrollIntoView({ block: "center" });
      else window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      if (!target.hasAttribute("tabindex") && !target.matches("input, button, a")) target.setAttribute("tabindex", "-1");
      target.focus({ preventScroll: true });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [settingsTab, location.hash, profile?.id]);

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

  const account = useProfileAccount({ feedback, identity });
  const {
    accountDeleted,
    passwordChanged,
    passwordBusy,
    deleteBusy,
    removeAccount,
    deletePassword,
    setDeletePassword,
    deleteAccountButton,
    accountDeletePending,
    setAccountDeletePending,
    confirmRemoveAccount,
  } = account;
  const connections = useProfileConnections({ route, feedback });
  const {
    socialLinksBusy,
    socialLinksLoading,
    socialLinksError,
    pendingSocialLinksFocus,
    socialLinksAttempt,
    currentSocialLinksFocusScope,
    socialLinksRequest,
    setSocialLinksLoading,
    setSocialLinksError,
    setSocialLinksAttempt,
    saveSocialLinks,
    socialLinkLabelKeys,
    socialLinkValues,
    setSocialLinkValues,
    savedSocialLinks,
  } = connections;
  const newsletter = useProfileNewsletter({ feedback });
  const {
    newsletterLoading,
    newsletterBusy,
    newsletterLoadError,
    pendingNewsletterFocus,
    currentNewsletterFocusScope,
    newsletterLoadRequest,
    newsletterAttempt,
    setNewsletterLoading,
    setNewsletterLoadError,
    setNewsletterAttempt,
    newsletterSaveError,
    newsletterRetry,
    retryNewsletter,
    newsletterSubscribed,
    toggleNewsletter,
  } = newsletter;
  const collections = useProfileCollections({ route });
  const {
    collectionLoading,
    collectionToolbarHeadingRef,
    collectionFilterButtonRef,
    collectionFiltersOpen,
    setCollectionFiltersOpen,
    closeCollectionFiltersOnEscape,
    setCollectionPage,
  } = collections;
  const favorites = useProfileFavorites({ feedback, identity });
  const { favoritePreviewLoading } = favorites;
  const lists = useProfileLists({ route });
  const { listMetadataLoading } = lists;
  const ratings = useProfileRatings({ route });
  const { ratingsLoading } = ratings;
  const reviews = useProfileReviews({ route, identity });
  const {
    reviewsLoading,
    reviewDetailLoading,
    reviewDetailMobileHeadingRef,
    renderReviewCards,
    reviewActionBusy,
    pendingReviewDelete,
    setPendingReviewDelete,
    confirmProfileReviewDelete,
  } = reviews;
  const network = useProfileNetwork({ route });
  const {
    followingLoading,
    networkFocusOrigin,
    currentNetworkFocusScope,
    followersLoading,
    networkToolbarHeadingRef,
    following,
    followers,
    followingError,
    retryNetwork,
    followersError,
  } = network;
  const activityModel = useProfileActivity();
  const { activityLoading } = activityModel;

  const sectionTarget = (id: string, kind: ProfileCollection | null) => {
    const search = new URLSearchParams(location.search);
    search.delete("settings");
    search.delete("review");
    if (kind !== null) { search.set("view", "collection"); search.set("collection", kind); }
    else if (id === "profile-reviews") search.set("view", "reviews");
    else if (id === "profile-lists") search.set("view", "lists");
    else if (id === "profile-following") search.set("view", "following");
    else if (id === "profile-followers") search.set("view", "followers");
    else if (id === "profile-ratings") search.set("view", "ratings");
    else search.delete("view");
    return { search: search.size ? `?${search}` : "", hash: `#${id}` };
  };

  useEffect(() => {
    if (!profile) return;
    const id = location.hash.slice(1);
    if (!profileSectionIds.includes(id)) return;
    const frame = requestAnimationFrame(() => {
      const section = document.getElementById(id);
      if (section?.contains(document.activeElement) && document.activeElement?.matches('[role="tab"]')) return;
      const heading = section?.querySelector<HTMLElement>("h2");
      if (profileView && window.matchMedia("(max-width: 767px)").matches) window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      else section?.scrollIntoView({ block: "start", behavior: "instant" });
      if (heading) { heading.tabIndex = -1; heading.focus({ preventScroll: true }); }
    });
    return () => cancelAnimationFrame(frame);
  }, [location.key, location.hash, profile?.id, profileView]);

  const focusIdentityForm = () => {
    setProfileActionsOpen(false);
    navigate(`${path("/profile")}?settings=profile`);
  };

  const openProfileSettings = () => {
    setProfileActionsOpen(false);
    navigate(`${path("/profile")}?settings=profile`);
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

  if (!isAuth && !accountDeleted && !passwordChanged) return <Navigate to={path("/login")} state={{ returnTo: `${location.pathname}${location.search}${location.hash}` }} replace />;

  const passwordForm = <ProfilePasswordForm account={account} feedback={feedback} />;

  const supabaseLinkForm = <ProfileHostedLinkForm identity={identity} account={account} />;

  if (settingsTab) return <ProfileSettingsView settingsTab={settingsTab} identity={identity} account={account} connections={connections} feedback={feedback} favorites={favorites} passwordForm={passwordForm} supabaseLinkForm={supabaseLinkForm} />;

  const pageBusy = profileLoading || followingLoading || activityLoading || newsletterLoading || socialLinksLoading || collectionLoading || favoritePreviewLoading || ratingsLoading || reviewsLoading || reviewDetailLoading || listMetadataLoading || nameBusy || passwordBusy || deleteBusy || newsletterBusy || socialLinksBusy;

  const filmsView = profileView === "collection" && collectionKind === "watched";

  const viewTitle = networkView ? t(profileView === "followers" ? "followers" : "following") : profileView === "ratings" ? t("allRatings") : profileView === "lists" ? t("searchLists") : profileView === "reviews" ? t(requestedReviewValue === null ? "reviews" : "review") : filmsView ? t("films") : collectionKind === "favorites" ? t("likes") : t("watchlist");

  return <FollowActionsProvider><main className={styles.page} data-profile-view={profileView ?? undefined} data-review-detail={requestedReviewValue !== null || undefined} data-network-view={networkView || undefined} data-films-view={filmsView || undefined} onFocusCapture={event => {
    const target = event.target;
    if (target instanceof HTMLElement && !target.closest('[role="dialog"]')) networkFocusOrigin.current = target.matches("[data-network-action]") ? { element: target, scope: currentNetworkFocusScope.current } : null;
  }} aria-labelledby="profile-page-title" aria-busy={pageBusy || followersLoading}>
    <div className={styles.content}>
    {requestedReviewValue !== null && <div className={styles.reviewDetailToolbar}><Link to={path("/profile?view=reviews")} aria-label={t("allReviews")}>←</Link><h2 ref={reviewDetailMobileHeadingRef} tabIndex={-1}>{t("review")}</h2><span aria-hidden="true" /></div>}
    <h1 className={`${!profileView || profileView === "reviews" || filmsView || networkView ? "srOnly" : styles.pageTitle} ${styles.retryFocusHeading}`} id="profile-page-title" tabIndex={-1}>{profileView ? viewTitle : t("myProfile")}</h1>
    {error && <p className={styles.alert} id="profile-action-error" role="alert">{error}</p>}
    {message && <p className={styles.status} role="status">{message}</p>}
    {profileLoading && <ProfileLoading label={t("loading")} layout="identity" />}
    {profileLoadError && <RetryNotice className={styles.feedback} message={t("loadProfileError")} retryLabel={t("retry")} onRetry={() => { pendingProfileLoadFocus.current = { origin: document.activeElement instanceof HTMLElement ? document.activeElement : null, attempt: profileAttempt + 1, scope: currentProfileLoadFocusScope.current, request: profileLoadRequest.current + 1 }; setProfileLoading(true); setProfileLoadError(false); setProfileAttempt(value => value + 1); }} />}
    {profile && <>
      {(filmsView || networkView) && <div className={styles.collectionToolbar}>
        <Link to={sectionTarget("profile-overview", null)} aria-label={t("profile")}>←</Link>
        <h2 ref={filmsView ? collectionToolbarHeadingRef : networkView ? networkToolbarHeadingRef : undefined} tabIndex={filmsView || networkView ? -1 : undefined}>{viewTitle}</h2>
        {filmsView ? <button ref={collectionFilterButtonRef} type="button" aria-label={t("filters")} aria-expanded={collectionFiltersOpen} aria-controls="profile-collection-filters" onClick={() => setCollectionFiltersOpen(value => !value)} onKeyDown={event => { closeCollectionFiltersOnEscape(event); }}><i className="fa-solid fa-sliders" aria-hidden="true" /></button> : <span className={styles.toolbarAdornment} aria-hidden="true"><i className="fa-solid fa-sliders" /></span>}
      </div>}
      <section style={profileBannerStyle(profile.bannerUrl)} className={styles.hero} aria-labelledby="profile-identity">
        {profileView === "lists" && <Link className={styles.heroCreate} to={path("/lists")} aria-label={t("newList")}>＋</Link>}
        <div className={styles.heroActions}>
          <button ref={profileActionsButtonRef} className={styles.heroAction} type="button" aria-label={t("profileActions")} aria-expanded={profileActionsOpen} aria-controls={profileActionsOpen ? "profile-actions-menu" : undefined} onClick={() => setProfileActionsOpen(open => !open)}>
            <i className="fa-solid fa-ellipsis" aria-hidden="true" />
          </button>
          {profileActionsOpen && <div ref={profileActionsMenuRef} className={styles.heroActionsMenu} id="profile-actions-menu" role="menu" aria-label={t("profileActions")}>
            <button type="button" role="menuitem" onClick={focusIdentityForm}>{t("profileIdentity")}</button>
            <button type="button" role="menuitem" onClick={openProfileSettings}>{t("accountSettings")}</button>
            <button type="button" role="menuitem" onClick={() => { void handleProfileLogout(); }}>{t("logout")}</button>
          </div>}
        </div>
        {(!profileView || profileView === "reviews" || networkView) && <button className={styles.heroProfileEdit} type="button" onClick={openProfileSettings}>{t("editProfile")}</button>}
        {profileView ? <Link className={`${styles.heroEdit} ${profileView === "reviews" ? styles.reviewsMobileBack : ""}`} to={sectionTarget("profile-overview", null)} aria-label={t("profile")}>←</Link> : <button className={styles.heroEdit} type="button" aria-label={t("accountSettings")} onClick={openProfileSettings}>
          <i className="fa-solid fa-gear" aria-hidden="true" />
        </button>}
        <ResilientImage className={styles.avatar} src={profile.avatarUrl} alt="" width={120} height={120}
          fallback={<span className={styles.avatarFallback} aria-hidden="true">{getUserInitial(profile)}</span>} />
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>{t("profile")}</p>
          <h2 id="profile-identity">{getUserIdentity(profile, t("someone"))}</h2>
          <p className={styles.username}>{getUserHandle(profile, t("someone"))}</p>
          {profile.location?.trim() && <p className={styles.username} aria-label={t("profileLocation")}><i className="fa-solid fa-location-dot" aria-hidden="true" /> {profile.location}</p>}
          {savedSocialLinks && savedSocialLinks.userId === user?.id && <ProfileSocialLinks links={savedSocialLinks.links} />}
          {profile.bio?.trim() && <p className={styles.bio}>{profile.bio}</p>}
        </div>
        <dl className={styles.heroMetrics}>
          <div><dt>{t("watched")}</dt><dd>{profile.stats.watched}</dd></div>
          <div><dt><Link to={sectionTarget("profile-following", null)}>{t("following")}</Link></dt><dd>{following?.totalElements ?? "—"}</dd></div>
          <div><dt><Link to={sectionTarget("profile-followers", null)}>{t("followers")}</Link></dt><dd>{followers?.totalElements ?? "—"}</dd></div>
        </dl>
        {followingError && <RetryNotice className={styles.metricRetry} message={t("loadNetworkError")} retryLabel={t("retry")} onRetry={() => retryNetwork("profile-following")} />}
        {followersError && <RetryNotice className={styles.metricRetry} message={t("loadNetworkError")} retryLabel={t("retry")} onRetry={() => retryNetwork("profile-followers")} />}
      </section>
      <nav className={styles.profileNav} aria-label={t("profile")}>
        {profileNavigation.map(({ id, label, collectionKind: itemKind }) => {
          const visibleSection = profileView === "collection" ? "profile-collections" : profileView === "lists" ? "profile-lists" : profileView === "reviews" ? "profile-overview" : profileView || ["profile-ratings", "profile-reviews", "profile-following", "profile-followers", "profile-statistics"].includes(activeProfileSection) ? "profile-overview" : activeProfileSection;
          const active = visibleSection === id && (id !== "profile-collections" || itemKind === collectionKind);
          return <Link
            className={active ? styles.activeProfileNav : undefined}
            key={`${id}-${label}`}
            data-collection-kind={itemKind ?? undefined}
            to={sectionTarget(id, itemKind)}
            aria-current={active ? "location" : undefined}
            onClick={event => { if (!event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) { if (itemKind) setCollectionPage(0); setActiveProfileSection(id); } }}
          >{t(label)}</Link>;
        })}
      </nav>
      {profileView === "reviews" && <div className={styles.reviewsBack}><Link to={requestedReviewValue !== null ? path("/profile?view=reviews") : sectionTarget("profile-overview", null)} aria-label={requestedReviewValue !== null ? t("allReviews") : t("backToProfile")}>←</Link></div>}
      {networkView && <Link className={styles.networkBack} to={sectionTarget("profile-overview", null)} aria-label={t("profile")}>←</Link>}
      {!profileView && profile.pinnedListId != null && <PinnedProfileList key={`${profile.id}:${profile.pinnedListId}`} ownerId={profile.id} listId={profile.pinnedListId} />}
      <ProfileFavoritesSection favorites={favorites} sectionTarget={sectionTarget} />
      <ProfileActivitySection activityModel={activityModel} />
      {(profileView === "ratings" || (!profileView && location.hash.startsWith("#profile-ratings"))) && <>
      <ProfileRatingsSection ratings={ratings} />
      </>}
      <section className={`${styles.section} ${styles.previewSection}`} id="profile-review-preview" aria-labelledby="profile-review-preview-title">
        <h2 id="profile-review-preview-title"><Link to={sectionTarget("profile-reviews", null)}>{t("recentReviews")}</Link></h2>
        {profile.recentReviews.length === 0 ? <p className={styles.empty}>{t("noReviews")}</p> : <ul className={styles.reviewCards}>{renderReviewCards(profile.recentReviews.slice(0, 2), !profileView)}</ul>}
      </section>
      {(profileView === "reviews" || (!profileView && location.hash.startsWith("#profile-reviews"))) && <>
      <ProfileReviewsSection reviews={reviews} route={route} profile={profile} sectionTarget={sectionTarget} />
      </>}
      <ProfileFollowingPreview network={network} sectionTarget={sectionTarget} />
      {(profileView === "following" || (!profileView && location.hash.startsWith("#profile-following"))) && <>
      <ProfileFollowingSection network={network} route={route} />
      </>}
      {(profileView === "followers" || (!profileView && location.hash.startsWith("#profile-followers"))) && <>
      <ProfileFollowersSection network={network} route={route} />
      </>}
      <ProfileListsSection route={route} lists={lists} profile={profile} sectionTarget={sectionTarget} />
      {!profileView && <nav className={styles.overviewLinks} aria-label={t("profileCollections")}>{overviewNavigation.map(({ id, label, collectionKind: kind }) => <Link key={label} to={sectionTarget(id, kind)} onClick={event => { if (!event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey && kind) setCollectionPage(0); }}>{t(label)}<span aria-hidden="true">›</span></Link>)}</nav>}
      {(profileView === "collection" || (!profileView && location.hash.startsWith("#profile-collection"))) && <>
      <ProfileCollectionsSection collections={collections} route={route} filmsView={filmsView} viewTitle={viewTitle} />
      </>}
      <section className={styles.section} id="profile-statistics" aria-labelledby="profile-stats">
        <h2 id="profile-stats">{t("profileStats")}</h2>
        <div className={styles.stats}>
          <article className={styles.stat}><strong>{profile.stats.watched}</strong><span>{t("watched")}</span></article>
          <article className={styles.stat}><strong>{profile.stats.watchlist}</strong><span>{t("watchlist")}</span></article>
          <article className={styles.stat}><strong>{profile.stats.favorites}</strong><span>{t("favorite")}</span></article>
          <article className={styles.stat}><strong>{profile.stats.reviews}</strong><Link to={sectionTarget("profile-reviews", null)}>{t("reviews")}</Link></article>
          <article className={styles.stat}><strong>{profile.stats.ratings}</strong><Link to={sectionTarget("profile-ratings", null)}>{t("ratings")}</Link></article>
        </div>
      </section>
      {legacySettingsAnchors.has(location.hash.slice(1)) && <>
      <section className={`${styles.section} ${styles.settingsSection}`} aria-labelledby="newsletter-settings" aria-busy={newsletterLoading || newsletterBusy}><h2 id="newsletter-settings" tabIndex={-1} className={styles.retryFocusHeading}>{t("newsletter")}</h2>
        {newsletterLoading && <p className={styles.feedback} role="status">{t("loading")}</p>}
        {newsletterLoadError && <RetryNotice className={styles.feedback} message={t("loadNewsletterError")} retryLabel={t("retry")} onRetry={() => { pendingNewsletterFocus.current = { origin: document.activeElement instanceof HTMLElement ? document.activeElement : null, scope: currentNewsletterFocusScope.current, target: "load", request: newsletterLoadRequest.current + 1, attempt: newsletterAttempt + 1 }; setNewsletterLoading(true); setNewsletterLoadError(false); setNewsletterAttempt(value => value + 1); }} />}
        {newsletterSaveError && newsletterRetry !== null && <RetryNotice className={styles.feedback} message={t("newsletterError")} retryLabel={t("retry")} disabled={newsletterBusy} busy={newsletterBusy} onRetry={retryNewsletter} />}
        {!newsletterLoading && !newsletterLoadError && <label><input type="checkbox" aria-busy={newsletterBusy} checked={newsletterSubscribed} disabled={newsletterBusy} onChange={event => { void toggleNewsletter(event.target.checked); }} /> {t("newsletterEnabled")}</label>}
      </section>
      <section className={`${styles.section} ${styles.settingsSection}`} aria-labelledby="social-links-settings" aria-busy={socialLinksLoading || socialLinksBusy}>
        <h2 id="social-links-settings" tabIndex={-1} className={styles.retryFocusHeading}>{t("socialLinks")}</h2>
        {socialLinksLoading && <p className={styles.feedback} role="status">{t("loading")}</p>}
        {socialLinksError && <RetryNotice className={styles.feedback} message={t("loadSocialLinksError")} retryLabel={t("retry")} onRetry={() => { pendingSocialLinksFocus.current = { origin: document.activeElement instanceof HTMLElement ? document.activeElement : null, attempt: socialLinksAttempt + 1, scope: currentSocialLinksFocusScope.current, request: socialLinksRequest.current + 1 }; setSocialLinksLoading(true); setSocialLinksError(false); setSocialLinksAttempt(value => value + 1); }} />}
        {!socialLinksLoading && !socialLinksError && <form className={styles.inlineForm} aria-labelledby="social-links-settings" aria-busy={socialLinksBusy} onSubmit={saveSocialLinks}>
          {socialLinkPlatforms.map(platform => <label key={platform} htmlFor={`social-link-${platform}`}>{t(socialLinkLabelKeys[platform])} <input id={`social-link-${platform}`} type="url" disabled={socialLinksBusy} value={socialLinkValues[platform]} placeholder="https://…" maxLength={255} onChange={event => setSocialLinkValues(values => ({ ...values, [platform]: event.target.value }))} /></label>)}
          <button className={styles.primaryButton} type="submit" disabled={socialLinksBusy}>{socialLinksBusy ? t("saving") : t("save")}</button>
        </form>}
      </section>
      <form className={styles.form} aria-labelledby="profile-identity-form-title" onSubmit={saveName} aria-busy={nameBusy}>
        <h2 id="profile-identity-form-title">{t("profileIdentity")}</h2>
        <label htmlFor="profile-display-name">{t("displayName")}</label>
        <input id="profile-display-name" value={displayName} disabled={nameBusy} minLength={displayName.trim() ? 2 : undefined} maxLength={60} onChange={e => setDisplayName(e.target.value)} />
        <label htmlFor="profile-bio">{t("bio")}</label>
        <textarea id="profile-bio" value={bio} disabled={nameBusy} maxLength={500} aria-describedby="profile-bio-hint" onChange={e => setBio(e.target.value)} />
        <p id="profile-bio-hint">{t("bioHint")} {bio.length}/500</p>
        <label htmlFor="profile-avatar-url">{t("avatarUrl")}</label>
        <input id="profile-avatar-url" type="url" disabled={nameBusy} value={avatarUrl} maxLength={255} placeholder="https://…" onChange={e => setAvatarUrl(e.target.value)} />
        <button className={styles.primaryButton} type="submit" disabled={nameBusy}>{nameBusy ? t("saving") : t("save")}</button>
      </form>
      {passwordForm}
      <form className={`${styles.form} ${styles.dangerForm}`} aria-labelledby="profile-delete-form-title" onSubmit={removeAccount} aria-busy={deleteBusy}>
        <h2 id="profile-delete-form-title">{t("deleteAccount")}</h2>
        <p>{t("deleteAccountWarning")}</p>
        <label htmlFor="profile-delete-password">{t("currentPassword")}</label>
        <input id="profile-delete-password" type="password" required disabled={deleteBusy} autoComplete="current-password" value={deletePassword} onChange={e => setDeletePassword(e.target.value)} />
              <button ref={deleteAccountButton} className={styles.dangerButton} type="submit" disabled={deleteBusy}>{deleteBusy ? t("deleting") : t("deleteAccount")}</button>
      </form>
      </>}
    </>}
    </div>
    <ConfirmDialog open={accountDeletePending} title={t("deleteAccount")} description={t("deleteAccountConfirm")} cancelLabel={t("cancel")} confirmLabel={t("deleteAccount")} trigger={deleteAccountButton.current} onCancel={() => setAccountDeletePending(false)} onConfirm={() => void confirmRemoveAccount()} busy={deleteBusy} />
    <ConfirmDialog open={pendingReviewDelete !== null} title={t("deleteReview")} description={t("deleteReviewConfirm")} cancelLabel={t("cancel")} confirmLabel={t("deleteReview")} trigger={pendingReviewDelete?.trigger ?? null} onCancel={() => setPendingReviewDelete(null)} onConfirm={() => { const pending = pendingReviewDelete; setPendingReviewDelete(null); if (pending) void confirmProfileReviewDelete(pending.item, pending.trigger); }} busy={reviewActionBusy !== null} />
  </main></FollowActionsProvider>;
}
