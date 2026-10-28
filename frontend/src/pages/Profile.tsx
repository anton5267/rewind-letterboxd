import ProfileLoading from "../components/ProfileLoading";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { changePassword, deleteAccount, getProfile, getProfileCollection, getProfileRatings, getProfileReviews, getSocialLinks, updateSocialLinks, type ProfileCollection, type ProfilePage, type ProfileRating, type ProfileResponse, type ProfileReview, type SocialLink, updateProfile } from "../api/profile.api";
import { clearMovieFlag } from "../api/movies.api";
import { deleteReview as deleteReviewRequest, getReviewDetails, updateReview } from "../api/reviews.api";
import { getNewsletterSubscription, updateNewsletterSubscription } from "../api/newsletter.api";
import type { MoviePage } from "../api/search.api";
import { getUserLists, type UserList } from "../api/lists.api";
import { getFollowers, getFollowing, getUserActivity, type ActivityPage, type NetworkPage } from "../api/social.api";
import ResilientImage from "../components/ResilientImage";
import Pagination from "../components/Pagination";
import RetryNotice from "../components/RetryNotice";
import ProfileSettingsShell, { type ProfileSettingsFeedback, type ProfileSettingsTab } from "../components/ProfileSettingsShell";
import settingsStyles from "../components/ProfileSettingsShell.module.css";
import ProfileListCard from "../components/ProfileListCard";
import UserFollowRow from "../components/UserFollowRow";
import PublicProfilePoster from "../components/PublicProfilePoster";
import ProfileReviewScore from "../components/ProfileReviewScore";
import ConfirmDialog from "../components/ConfirmDialog";
import { FollowActionsProvider } from "../context/FollowActionsContext";
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
  { id: "profile-overview", label: "profile", collectionKind: null },
  { id: "profile-collections", label: "films", collectionKind: "watched" },
  { id: "profile-collections", label: "watchlist", collectionKind: "watchlist" },
  { id: "profile-collections", label: "likes", collectionKind: "favorites" },
  { id: "profile-lists", label: "searchLists", collectionKind: null },
] as const satisfies readonly { id: string; label: TranslationKey; collectionKind: ProfileCollection | null }[];
const profileSectionIds = ["profile-overview", "profile-collections", "profile-ratings", "profile-reviews", "profile-lists", "profile-following", "profile-followers", "profile-statistics"];
const legacySettingsAnchors = new Set(["profile-identity-form-title", "profile-avatar-url", "social-links-settings", "newsletter-settings", "profile-delete-form-title", "profile-password-form-title"]);
const overviewNavigation = [
  ...profileNavigation.slice(1),
  { id: "profile-following", label: "following", collectionKind: null },
  { id: "profile-followers", label: "followers", collectionKind: null },
] as const;

export default function Profile() {
  const { isAuth, ready, logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const requestedSettings = new URLSearchParams(location.search).get("settings");
  const settingsTab: ProfileSettingsTab | null = requestedSettings === "profile" || requestedSettings === "authentication" || requestedSettings === "avatar" || requestedSettings === "connections" ? requestedSettings : null;
  const requestedView = new URLSearchParams(location.search).get("view");
  const profileView = requestedView === "collection" || requestedView === "reviews" || requestedView === "lists" || requestedView === "following" || requestedView === "followers" || requestedView === "ratings" ? requestedView : null;
  const requestedReviewValue = profileView === "reviews" ? new URLSearchParams(location.search).get("review") : null;
  const requestedReviewId = requestedReviewValue !== null && /^\d+$/.test(requestedReviewValue) && Number.isSafeInteger(Number(requestedReviewValue)) && Number(requestedReviewValue) > 0 ? Number(requestedReviewValue) : null;
  const [reviewDetail, setReviewDetail] = useState<ProfileReview | null>(null);
  const [reviewDetailLoading, setReviewDetailLoading] = useState(false);
  const [reviewDetailError, setReviewDetailError] = useState(false);
  const networkView = profileView === "following" || profileView === "followers";
  const requestedCollection = new URLSearchParams(location.search).get("collection");
  const collectionKind: ProfileCollection = requestedCollection === "watchlist" || requestedCollection === "favorites" ? requestedCollection : "watched";
  const [collectionFiltersOpen, setCollectionFiltersOpen] = useState(false);
  const collectionFilterButtonRef = useRef<HTMLButtonElement | null>(null);
  const { path, t, lang } = useLocale();
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [activeProfileSection, setActiveProfileSection] = useActiveSection(profileSectionIds, "profile-overview", { enabled: profile !== null && !settingsTab, rootMargin: "-88px 0px -55% 0px", scopeKey: `${profile?.id ?? "loading"}:${profileView ?? "overview"}:${location.hash}` });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileLoadError, setProfileLoadError] = useState(false);
  const [profileAttempt, setProfileAttempt] = useState(0);
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordConfirmError, setPasswordConfirmError] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [message, setMessage] = useState("");
  const [settingsFeedback, setSettingsFeedback] = useState<ProfileSettingsFeedback | null>(null);
  const [error, setError] = useState("");
  const [collection, setCollection] = useState<MoviePage | null>(null);
  const [collectionPage, setCollectionPage] = useState(0);
  const [collectionLoading, setCollectionLoading] = useState(false);
  const [collectionError, setCollectionError] = useState(false);
  const [collectionAttempt, setCollectionAttempt] = useState(0);
  const collectionHeadingRef = useRef<HTMLHeadingElement>(null);
  const collectionMounted = useRef(false);
  const collectionScopeGeneration = useRef(0);
  const collectionRequest = useRef(0);
  const pendingCollectionFocus = useRef<{ scope: number; request: number; origin: HTMLElement | null } | null>(null);
  const collectionPageCarry = useRef<{ key: string; page: number; focus: NonNullable<typeof pendingCollectionFocus.current> } | null>(null);
  const collectionScopeKey = JSON.stringify([lang, isAuth, user?.id ?? null, user?.role ?? null, settingsTab, profileView, collectionKind]);
  const collectionToolbarHeadingRef = useRef<HTMLHeadingElement>(null);

  const [favoritePreview, setFavoritePreview] = useState<MoviePage | null>(null);
  const [favoritePreviewLoading, setFavoritePreviewLoading] = useState(false);
  const [favoritePreviewError, setFavoritePreviewError] = useState(false);
  const [favoritePreviewAttempt, setFavoritePreviewAttempt] = useState(0);
  const [favoriteRemovalId, setFavoriteRemovalId] = useState<number | null>(null);
  const favoriteSettingsRef = useRef<HTMLElement | null>(null);
  const [listMetadata, setListMetadata] = useState<UserList[] | null>(null);
  const [listMetadataLoading, setListMetadataLoading] = useState(false);
  const [listMetadataError, setListMetadataError] = useState(false);
  const [listMetadataAttempt, setListMetadataAttempt] = useState(0);
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
  const [editingReviewId, setEditingReviewId] = useState<number | null>(null);
  const [reviewDraft, setReviewDraft] = useState("");
  const [reviewActionBusy, setReviewActionBusy] = useState<"save" | "delete" | null>(null);
  const [pendingReviewDelete, setPendingReviewDelete] = useState<{ item: ProfileReview; trigger: HTMLButtonElement } | null>(null);
  const [reviewActionMessage, setReviewActionMessage] = useState<"reviewUpdated" | "reviewDeleted" | null>(null);
  const [reviewActionError, setReviewActionError] = useState<"updateReviewError" | "deleteReviewError" | null>(null);
  const reviewEditButtonRefs = useRef(new Map<number, HTMLButtonElement>());
  const reviewHeadingRef = useRef<HTMLHeadingElement>(null);
  const reviewDetailMobileHeadingRef = useRef<HTMLHeadingElement>(null);
  const detailFocusPending = useRef(false);
  const detailRetryOrigin = useRef<HTMLElement | null>(null);
  const reviewErrorRef = useRef<HTMLParagraphElement>(null);
  const reviewMounted = useRef(false);
  const reviewScopeGeneration = useRef(0);
  const reviewsRequest = useRef(0);
  const reviewMutation = useRef<object | null>(null);
  const reviewActor = user?.id ?? null;
  const currentReviewActor = useRef(reviewActor);
  const pendingReviewFocus = useRef<{ scope: number; request: number; origin: HTMLElement | null; target: "edit" | "heading" | "error"; id?: number } | null>(null);
  const reviewPageCarry = useRef<{ page: number; lang: string; actor: number | null; focus: NonNullable<typeof pendingReviewFocus.current> } | null>(null);
  const [following, setFollowing] = useState<NetworkPage | null>(null);
  const [followingPage, setFollowingPage] = useState(0);
  const [followingLoading, setFollowingLoading] = useState(false);
  const [followingError, setFollowingError] = useState(false);
  const [followingAttempt, setFollowingAttempt] = useState(0);
  const [followers, setFollowers] = useState<NetworkPage | null>(null);
  const [followersPage, setFollowersPage] = useState(0);
  const [followersLoading, setFollowersLoading] = useState(false);
  const [followersError, setFollowersError] = useState(false);
  const [followersAttempt, setFollowersAttempt] = useState(0);
  const networkMounted = useRef(false);
  const networkToolbarHeadingRef = useRef<HTMLHeadingElement>(null);
  const networkRequests = useRef({ following: 0, followers: 0 });
  const networkFocusScope = JSON.stringify([location.key, lang, isAuth, user?.id ?? null, user?.role ?? null, profileView, settingsTab, followingPage, followersPage]);
  const currentNetworkFocusScope = useRef(networkFocusScope);
  currentNetworkFocusScope.current = networkFocusScope;
  const networkFocusOrigin = useRef<{ element: HTMLElement; scope: string } | null>(null);
  const pendingNetworkFocus = useRef<{ origin: HTMLElement; memberId: string; action: "more" | "follow"; sectionId: "profile-following" | "profile-followers"; scope: string; request: number } | null>(null);
  const refreshNetwork = useCallback(() => {
    const captured = networkFocusOrigin.current;
    const origin = captured?.element;
    const sectionId = origin?.closest("section")?.id;
    const memberId = origin?.closest<HTMLElement>("[data-network-member-id]")?.dataset.networkMemberId;
    const action = origin?.dataset.networkAction;
    pendingNetworkFocus.current = captured?.scope === currentNetworkFocusScope.current && origin && memberId && (action === "more" || action === "follow") &&
      (sectionId === "profile-following" || sectionId === "profile-followers") && (document.activeElement === origin || document.activeElement === document.body)
      ? { origin, memberId, action, sectionId, scope: currentNetworkFocusScope.current, request: networkRequests.current[sectionId === "profile-following" ? "following" : "followers"] + 1 } : null;
    setFollowingLoading(true);
    setFollowersLoading(true);
    setFollowingAttempt(value => value + 1);
    setFollowersAttempt(value => value + 1);
  }, []);
  const [activity, setActivity] = useState<ActivityPage | null>(null);
  const [activityPage, setActivityPage] = useState(0);
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityError, setActivityError] = useState(false);
  const [activityAttempt, setActivityAttempt] = useState(0);
  const [activityExpanded, setActivityExpanded] = useState(false);
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
  const [accountDeletePending, setAccountDeletePending] = useState(false);
  const deleteAccountButton = useRef<HTMLButtonElement>(null);
  const [accountDeleted, setAccountDeleted] = useState(false);
  const [passwordChanged, setPasswordChanged] = useState(false);
  const [profileActionsOpen, setProfileActionsOpen] = useState(false);
  const activeUserId = useRef<number | null>(null);
  const profileActionsButtonRef = useRef<HTMLButtonElement>(null);
  const profileActionsMenuRef = useRef<HTMLDivElement>(null);
  const identityMutation = useRef(0);
  const newsletterMutation = useRef(0);
  const socialLinksMutation = useRef(0);
  const passwordMutation = useRef(0);
  const deleteMutation = useRef(0);
  const previousSettingsView = useRef(Boolean(settingsTab));
  const settingsMounted = useRef(false);
  const settingsFeedbackGeneration = useRef(0);
  const settingsFeedbackSequence = useRef(0);
  const socialLinkLabelKeys: Record<SocialLinkPlatform, TranslationKey> = { website: "socialWebsite", instagram: "socialInstagram", tiktok: "socialTiktok", letterboxd: "socialLetterboxd" };

  useLayoutEffect(() => {
    collectionMounted.current = true;
    return () => {
      collectionMounted.current = false;
      collectionScopeGeneration.current += 1;
      pendingCollectionFocus.current = null;
    };
  }, []);

  useLayoutEffect(() => {
    collectionScopeGeneration.current += 1;
    const carry = collectionPageCarry.current;
    pendingCollectionFocus.current = carry && carry.key === collectionScopeKey && carry.page === collectionPage && pendingCollectionFocus.current === carry.focus
      ? { ...carry.focus, scope: collectionScopeGeneration.current } : null;
    collectionPageCarry.current = null;
  }, [collectionScopeKey, collectionPage]);

  const changeCollectionPage = (nextPage: number) => {
    if (nextPage === collectionPage || collectionLoading) return;
    const focus = { scope: collectionScopeGeneration.current, request: collectionRequest.current + 1, origin: document.activeElement instanceof HTMLElement ? document.activeElement : null };
    pendingCollectionFocus.current = focus;
    collectionPageCarry.current = { key: collectionScopeKey, page: nextPage, focus };
    setCollectionLoading(true);
    setCollectionPage(nextPage);
  };

  const retryCollection = () => {
    pendingCollectionFocus.current = { scope: collectionScopeGeneration.current, request: collectionRequest.current + 1, origin: document.activeElement instanceof HTMLElement ? document.activeElement : null };
    setCollectionLoading(true);
    setCollectionAttempt(value => value + 1);
  };

  activeUserId.current = user?.id ?? null;

  useLayoutEffect(() => {
    networkMounted.current = true;
    return () => {
      networkMounted.current = false;
      pendingNetworkFocus.current = null;
      networkFocusOrigin.current = null;
    };
  }, []);

  useLayoutEffect(() => {
    pendingNetworkFocus.current = null;
    networkFocusOrigin.current = null;
  }, [networkFocusScope]);

  useEffect(() => {
    const pending = pendingNetworkFocus.current;
    if (!pending) return;
    const followingSection = pending.sectionId === "profile-following";
    const request = networkRequests.current[followingSection ? "following" : "followers"];
    const settled = followingSection ? !followingLoading && (followingError || following !== null) : !followersLoading && (followersError || followers !== null);
    if (!settled || request !== pending.request) return;
    const frame = window.requestAnimationFrame(() => {
      if (!networkMounted.current || pendingNetworkFocus.current !== pending || pending.scope !== currentNetworkFocusScope.current) return;
      pendingNetworkFocus.current = null;
      if (networkRequests.current[followingSection ? "following" : "followers"] !== pending.request) return;
      if (document.activeElement !== document.body && document.activeElement !== pending.origin) return;
      const section = document.getElementById(pending.sectionId);
      const row = Array.from(section?.querySelectorAll<HTMLElement>("[data-network-member-id]") ?? []).find(item => item.dataset.networkMemberId === pending.memberId);
      const action = row?.querySelector<HTMLButtonElement>(`[data-network-action="${pending.action}"]:not(:disabled)`);
      const mobileTitle = networkToolbarHeadingRef.current;
      const mobileBounds = mobileTitle?.getBoundingClientRect();
      const target = action?.getClientRects().length ? action : mobileBounds && mobileBounds.width > 1 && mobileBounds.height > 1 ? mobileTitle : section?.querySelector<HTMLElement>("h2");
      if (target) {
        if (!target.hasAttribute("tabindex") && !target.matches("button, a, input, select, textarea")) target.tabIndex = -1;
        target.focus();
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, [following, followingError, followingLoading, followers, followersError, followersLoading, networkFocusScope]);

  useLayoutEffect(() => {
    reviewMounted.current = true;
    return () => {
      reviewMounted.current = false;
      reviewScopeGeneration.current += 1;
      pendingReviewFocus.current = null;
      reviewMutation.current = null;
    };
  }, []);

  useLayoutEffect(() => {
    reviewScopeGeneration.current += 1;
    detailRetryOrigin.current = null;
    const carry = reviewPageCarry.current;
    pendingReviewFocus.current = carry && profileView === "reviews" && !settingsTab && carry.page === reviewsPage && carry.lang === lang && carry.actor === reviewActor && pendingReviewFocus.current === carry.focus
      ? { ...carry.focus, scope: reviewScopeGeneration.current } : null;
    reviewPageCarry.current = null;
    setEditingReviewId(null);
    setReviewDraft("");
    setReviewActionMessage(null);
    setReviewActionError(null);
    if (currentReviewActor.current !== reviewActor) {
      reviewMutation.current = null;
      setReviewActionBusy(null);
    }
    currentReviewActor.current = reviewActor;
  }, [isAuth, user?.id, lang, settingsTab, profileView, reviewsPage, requestedReviewValue]);

  useEffect(() => {
    setReviewDetail(null);
    setReviewDetailError(false);
    if (requestedReviewValue === null) { setReviewDetailLoading(false); return; }
    if (!isAuth || !user?.id) return;
    if (requestedReviewId === null) { setReviewDetailLoading(false); setReviewDetailError(true); return; }
    let active = true;
    setReviewDetailLoading(true);
    getReviewDetails(requestedReviewId).then(({ data }) => {
      if (!active) return;
      if (data.author.id !== user.id) { setReviewDetailError(true); return; }
      setReviewDetail({ reviewId: data.id, movieId: data.movie.id, movieTitle: data.movie.title, moviePhotoUrl: data.movie.photoUrl, content: data.content, updatedAt: data.createdAt });
    }).catch(() => { if (active) setReviewDetailError(true); })
      .finally(() => { if (active) setReviewDetailLoading(false); });
    return () => { active = false; };
  }, [isAuth, user?.id, requestedReviewValue, requestedReviewId, reviewsAttempt]);

  useLayoutEffect(() => {
    settingsMounted.current = true;
    return () => {
      settingsMounted.current = false;
      settingsFeedbackGeneration.current += 1;
    };
  }, []);

  useLayoutEffect(() => {
    settingsFeedbackGeneration.current += 1;
    setSettingsFeedback(null);
    setMessage("");
    setError("");
  }, [settingsTab, profileView, lang, user?.id]);

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
    setCurrentPassword("");
    setNewPassword("");
    setConfirmNewPassword("");
    setPasswordConfirmError(false);
  }, [isAuth, user?.id]);

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
    const scope = collectionScopeGeneration.current;
    const request = ++collectionRequest.current;
    const isCurrent = () => current && collectionMounted.current && collectionScopeGeneration.current === scope && collectionRequest.current === request;
    setCollectionLoading(true);
    setCollection(null);
    setCollectionError(false);
    getProfileCollection(collectionKind, collectionPage)
      .then(({ data }) => {
        if (!isCurrent()) return;
        if (isPageOutOfRange(collectionPage, data.totalPages)) {
          const page = getLastPageIndex(data.totalPages);
          const pending = pendingCollectionFocus.current;
          if (pending && pending.scope === scope && pending.request === request) {
            const focus = { ...pending, request: request + 1 };
            pendingCollectionFocus.current = focus;
            collectionPageCarry.current = { key: collectionScopeKey, page, focus };
          }
          setCollectionPage(page);
          return;
        }
        setCollection(data);
      })
      .catch(() => { if (isCurrent()) setCollectionError(true); })
      .finally(() => { if (isCurrent()) setCollectionLoading(false); });
    return () => { current = false; };
  }, [collectionAttempt, collectionPage, collectionScopeKey, isAuth]);

  useEffect(() => {
    const pending = pendingCollectionFocus.current;
    if (!pending || collectionLoading || collectionRequest.current !== pending.request || (!collectionError && collection === null)) return;
    const frame = window.requestAnimationFrame(() => {
      if (pendingCollectionFocus.current !== pending) return;
      pendingCollectionFocus.current = null;
      if (!collectionMounted.current || collectionScopeGeneration.current !== pending.scope || collectionRequest.current !== pending.request) return;
      if (document.activeElement !== document.body && document.activeElement !== pending.origin) return;
      const mobileTitle = collectionToolbarHeadingRef.current;
      const mobileBounds = mobileTitle?.getBoundingClientRect();
      const target = mobileBounds && mobileBounds.width > 1 && mobileBounds.height > 1 ? mobileTitle : collectionHeadingRef.current;
      target?.focus();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [collection, collectionError, collectionLoading, collectionPage, collectionScopeKey]);

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
    const request = ++reviewsRequest.current;
    const actor = reviewActor;
    const isCurrent = () => current && reviewMounted.current && currentReviewActor.current === actor && reviewsRequest.current === request;
    setReviewsLoading(true);
    setReviewsError(false);
    setReviewsHistory(null);
    getProfileReviews(reviewsPage)
      .then(({ data }) => {
        if (!isCurrent()) return;
        if (isPageOutOfRange(reviewsPage, data.totalPages)) {
          const page = getLastPageIndex(data.totalPages);
          const pending = pendingReviewFocus.current;
          if (pending && pending.target !== "error" && pending.scope === reviewScopeGeneration.current && pending.request === request) {
            const focus = { ...pending, request: request + 1 };
            pendingReviewFocus.current = focus;
            reviewPageCarry.current = { page, lang, actor, focus };
          }
          setReviewsPage(page);
          return;
        }
        setReviewsHistory(data);
      })
      .catch(() => { if (isCurrent()) setReviewsError(true); })
      .finally(() => { if (isCurrent()) setReviewsLoading(false); });
    return () => { current = false; };
  }, [isAuth, reviewsPage, reviewsAttempt, user?.id, lang]);

  useEffect(() => {
    const pending = pendingReviewFocus.current;
    if (!pending || reviewActionBusy !== null) return;
    if (pending.target !== "error" && (editingReviewId !== null || reviewsLoading || reviewDetailLoading || reviewsRequest.current !== pending.request || (!reviewsError && reviewsHistory === null))) return;
    const frame = window.requestAnimationFrame(() => {
      if (pendingReviewFocus.current !== pending) return;
      pendingReviewFocus.current = null;
      if (!reviewMounted.current || reviewScopeGeneration.current !== pending.scope) return;
      if (pending.target !== "error" && reviewsRequest.current !== pending.request) return;
      if (document.activeElement !== document.body && document.activeElement !== pending.origin) return;
      if (pending.target === "error") reviewErrorRef.current?.focus();
      else if (pending.target === "edit" && pending.id !== undefined) {
        const button = reviewEditButtonRefs.current.get(pending.id);
        if (button && !button.disabled) button.focus();
        else reviewHeadingRef.current?.focus();
      } else reviewHeadingRef.current?.focus();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [editingReviewId, reviewActionBusy, reviewActionError, reviewsError, reviewsHistory, reviewsLoading, reviewDetailLoading, reviewsPage, profileView, settingsTab, lang, user?.id]);

  useEffect(() => {
    detailFocusPending.current = requestedReviewValue !== null || Boolean(location.state?.reviewDeleted);
  }, [requestedReviewValue, profile?.id, location.state?.reviewDeleted]);
  useEffect(() => {
    if (!detailFocusPending.current || reviewDetailLoading || reviewsLoading || !profile || editingReviewId !== null) return;
    detailFocusPending.current = false;
    const target = requestedReviewValue !== null && window.matchMedia("(max-width: 767px)").matches ? reviewDetailMobileHeadingRef.current : reviewHeadingRef.current;
    target?.focus();
  }, [requestedReviewValue, profile?.id, reviewDetailLoading, reviewsLoading, location.state?.reviewDeleted]);

  useEffect(() => {
    const origin = detailRetryOrigin.current;
    if (!origin || reviewDetailLoading || reviewsLoading) return;
    detailRetryOrigin.current = null;
    if (document.activeElement !== document.body && document.activeElement !== origin) return;
    const mobileHeading = reviewDetailMobileHeadingRef.current;
    const target = mobileHeading?.getClientRects().length ? mobileHeading : reviewHeadingRef.current;
    target?.focus();
  }, [reviewDetailLoading, reviewsLoading]);

  useEffect(() => {
    if (!isAuth || !user?.id) return;
    let current = true;
    const request = ++networkRequests.current.following;
    const isCurrent = () => current && networkMounted.current && networkRequests.current.following === request;
    setFollowingLoading(true);
    setFollowingError(false);
    setFollowing(null);
    getFollowing(user.id, followingPage)
      .then(({ data }) => {
        if (!isCurrent()) return;
        if (isPageOutOfRange(followingPage, data.totalPages)) {
          setFollowingPage(getLastPageIndex(data.totalPages));
          return;
        }
        setFollowing(data);
      })
      .catch(() => { if (isCurrent()) setFollowingError(true); })
      .finally(() => { if (isCurrent()) setFollowingLoading(false); });
    return () => { current = false; };
  }, [isAuth, user?.id, followingPage, followingAttempt]);

  useEffect(() => {
    if (!isAuth || !user?.id) return;
    let current = true;
    const request = ++networkRequests.current.followers;
    const isCurrent = () => current && networkMounted.current && networkRequests.current.followers === request;
    setFollowers(null); setFollowersLoading(true); setFollowersError(false);
    getFollowers(user.id, followersPage).then(({ data }) => {
      if (!isCurrent()) return;
      if (isPageOutOfRange(followersPage, data.totalPages)) { setFollowersPage(getLastPageIndex(data.totalPages)); return; }
      setFollowers(data);
    }).catch(() => { if (isCurrent()) setFollowersError(true); })
      .finally(() => { if (isCurrent()) setFollowersLoading(false); });
    return () => { current = false; };
  }, [isAuth, user?.id, followersPage, followersAttempt]);

  useEffect(() => { setFollowingPage(0); setFollowersPage(0); setActivityPage(0); setActivityExpanded(false); }, [user?.id]);

  useEffect(() => {
    let current = true;
    setListMetadata(null); setListMetadataError(false); setListMetadataLoading(false);
    if (!isAuth || !user?.id || settingsTab || (profileView && profileView !== "lists")) return;
    setListMetadataLoading(true);
    getUserLists().then(({ data }) => { if (current) setListMetadata(data); })
      .catch(() => { if (current) setListMetadataError(true); })
      .finally(() => { if (current) setListMetadataLoading(false); });
    return () => { current = false; };
  }, [settingsTab, isAuth, listMetadataAttempt, profileView, user?.id]);

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
    setCollectionPage(0);
    const search = new URLSearchParams(location.search);
    search.set("collection", kind);
    navigate({ search: `?${search}`, hash: "#profile-collections" }, { preventScrollReset: true });
  };

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

  useEffect(() => { setCollectionPage(0); }, [collectionKind, user?.id]);
  useEffect(() => { setCollectionFiltersOpen(false); }, [profileView, user?.id]);
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

  const { setTabRef, handleKeyDown } = useRovingTabs(collectionKinds, chooseCollection);

  const closeCollectionFiltersOnEscape = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.key !== "Escape" || !collectionFiltersOpen) return false;
    event.preventDefault();
    setCollectionFiltersOpen(false);
    window.requestAnimationFrame(() => collectionFilterButtonRef.current?.focus());
    return true;
  };

  const handleCollectionTabKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, kind: ProfileCollection) => {
    if (closeCollectionFiltersOnEscape(event)) return;
    handleKeyDown(event, kind);
  };

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

  const saveName = async (event: React.FormEvent, fields: "name" | "avatar" | "both" = "both") => {
    event.preventDefault();
    if (nameBusy) return;
    const requestId = ++identityMutation.current;
    const requestUserId = activeUserId.current;
    const scope = ++settingsFeedbackGeneration.current;
    const submitter = (event.nativeEvent as SubmitEvent).submitter;
    const origin = submitter instanceof HTMLElement ? submitter : document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const isCurrentRequest = () => settingsMounted.current && requestUserId !== null && activeUserId.current === requestUserId && identityMutation.current === requestId;
    const report = (kind: "success" | "error", text: string) => {
      if (!isCurrentRequest() || settingsFeedbackGeneration.current !== scope) return;
      if (kind === "success") { setError(""); setMessage(text); }
      else { setMessage(""); setError(text); }
      setSettingsFeedback({ id: ++settingsFeedbackSequence.current, origin, kind });
    };
    setNameBusy(true);
    setSettingsFeedback(null);
    setMessage("");
    setError("");
    try {
      const normalizedAvatarUrl = safeHttpUrl(avatarUrl);
      if (fields !== "name" && avatarUrl.trim() && !normalizedAvatarUrl) { report("error", t("invalidAvatarUrl")); return; }
      const { data } = await updateProfile({
        ...(fields !== "avatar" ? { displayName: displayName.trim() } : {}),
        ...(fields !== "name" ? { avatarUrl: normalizedAvatarUrl ?? "" } : {}),
      });
      if (!isCurrentRequest()) return;
      setProfile(data);
      if (fields !== "avatar") setDisplayName(data.displayName ?? "");
      if (fields !== "name") setAvatarUrl(data.avatarUrl ?? "");
      report("success", fields === "avatar" ? (lang === "uk" ? "Аватар оновлено." : "Avatar updated.") : t("nameSaved"));
    } catch { report("error", t(fields === "avatar" ? "saveAvatarError" : "saveNameError")); }
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
    if (newPassword !== confirmNewPassword) {
      setPasswordConfirmError(true);
      setError(t("confirmMismatch"));
      document.getElementById("profile-confirm-new-password")?.focus();
      return;
    }
    const requestId = ++passwordMutation.current;
    const requestUserId = activeUserId.current;
    const isCurrentRequest = () => requestUserId !== null && activeUserId.current === requestUserId && passwordMutation.current === requestId;
    setPasswordBusy(true);
    setPasswordConfirmError(false);
    setError("");
    try {
      await changePassword(currentPassword, newPassword);
      if (!isCurrentRequest()) return;
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
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
    setAccountDeletePending(true);
  };
  const confirmRemoveAccount = async () => {
    if (deleteBusy) return;
    setAccountDeletePending(false);
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
    const scope = ++settingsFeedbackGeneration.current;
    const submitter = (event.nativeEvent as SubmitEvent).submitter;
    const origin = submitter instanceof HTMLElement ? submitter : document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const isCurrentRequest = () => settingsMounted.current && requestUserId !== null && activeUserId.current === requestUserId && socialLinksMutation.current === requestId;
    const report = (kind: "success" | "error", text: string) => {
      if (!isCurrentRequest() || settingsFeedbackGeneration.current !== scope) return;
      if (kind === "success") { setError(""); setMessage(text); }
      else { setMessage(""); setError(text); }
      setSettingsFeedback({ id: ++settingsFeedbackSequence.current, origin, kind });
    };
    setSocialLinksBusy(true);
    setSettingsFeedback(null);
    setMessage("");
    setError("");
    try {
      const links: SocialLink[] = [];
      for (const platform of socialLinkPlatforms) {
        const value = socialLinkValues[platform].trim();
        if (!value) continue;
        const normalizedUrl = safeHttpUrl(value);
        if (!normalizedUrl) { report("error", t("invalidSocialLinkUrl")); return; }
        links.push({ platform, url: normalizedUrl });
      }
      const { data } = await updateSocialLinks(links);
      if (!isCurrentRequest()) return;
      applySocialLinks(data);
      report("success", t("socialLinksSaved"));
    } catch { report("error", t("socialLinksSaveError")); }
    finally { if (isCurrentRequest()) setSocialLinksBusy(false); }
  };

  const removeFavorite = async (movieId: number, index: number) => {
    if (favoriteRemovalId !== null) return;
    setFavoriteRemovalId(movieId);
    setError("");
    setMessage("");
    try {
      await clearMovieFlag(movieId, "favorite");
      setFavoritePreview(current => current ? {
        ...current,
        content: current.content.filter(movie => movie.id !== movieId),
        totalElements: Math.max(0, current.totalElements - 1),
      } : current);
      setProfile(current => current ? { ...current, stats: { ...current.stats, favorites: Math.max(0, current.stats.favorites - 1) } } : current);
      setMessage(t("favoriteRemoved"));
      requestAnimationFrame(() => {
        const section = favoriteSettingsRef.current;
        const buttons = section?.querySelectorAll<HTMLButtonElement>("[data-favorite-remove]");
        const next = buttons?.item(Math.min(index, (buttons?.length ?? 1) - 1));
        (next ?? section?.querySelector<HTMLElement>("h2"))?.focus();
      });
    } catch {
      setError(t("removeItemError"));
    } finally {
      setFavoriteRemovalId(null);
    }
  };

  const passwordForm = <form id="settings-form-authentication" className={styles.form} aria-labelledby="profile-password-form-title" onSubmit={savePassword} aria-busy={passwordBusy}>
    <h2 id="profile-password-form-title">{t("changePassword")}</h2>
    <div className={styles.passwordField}>
      <label htmlFor="profile-current-password">{t("currentPassword")}</label>
      <input id="profile-current-password" type="password" required disabled={passwordBusy} autoComplete="current-password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />
    </div>
    <div className={styles.passwordField}>
      <label htmlFor="profile-new-password">{t("newPassword")}</label>
      <input id="profile-new-password" type="password" required disabled={passwordBusy} minLength={8} maxLength={MAX_PASSWORD_BYTES} autoComplete="new-password" value={newPassword} onChange={e => { setNewPassword(e.target.value); setPasswordConfirmError(false); setError(current => current === t("confirmMismatch") ? "" : current); }} aria-invalid={Boolean(error) && !isPasswordWithinByteLimit(newPassword)} aria-describedby={`profile-password-hint${error ? " profile-action-error" : ""}`} />
    </div>
    <div className={styles.passwordField}>
      <label htmlFor="profile-confirm-new-password">{t("confirmNewPassword")}</label>
      <input id="profile-confirm-new-password" type="password" required disabled={passwordBusy} maxLength={MAX_PASSWORD_BYTES} autoComplete="new-password" value={confirmNewPassword} onChange={e => { setConfirmNewPassword(e.target.value); setPasswordConfirmError(false); setError(current => current === t("confirmMismatch") ? "" : current); }} aria-invalid={passwordConfirmError} aria-describedby={passwordConfirmError ? "profile-action-error" : undefined} />
    </div>
    <button className={styles.primaryButton} type="submit" disabled={passwordBusy}>{passwordBusy ? t("saving") : t("changePassword")}</button>
    <p className={styles.passwordHint} id="profile-password-hint">{t("passwordByteLimitHint")}</p>
  </form>;

  if (settingsTab) return <ProfileSettingsShell
    activeTab={settingsTab}
    loading={profileLoading || (!profile && !profileLoadError)}
    loadError={profileLoadError}
    busy={passwordBusy || nameBusy || socialLinksBusy}
    error={error}
    message={message}
    feedback={settingsFeedback}
    onRetry={() => setProfileAttempt(value => value + 1)}
  >{profile && <>
    {settingsTab === "authentication" && passwordForm}
    {settingsTab === "profile" && <>
      <form id="settings-form-profile" data-settings-form="profile" aria-labelledby="profile-identity-form-title" aria-busy={nameBusy} onSubmit={event => { void saveName(event, "name"); }}>
        <h2 id="profile-identity-form-title">{t("profileIdentity")}</h2>
        <div><label htmlFor="settings-username">{t("username")}</label><output id="settings-username">{profile.username}</output></div>
        <div><label htmlFor="profile-display-name">{t("displayName")}</label><input id="profile-display-name" value={displayName} disabled={nameBusy} minLength={displayName.trim() ? 2 : undefined} maxLength={60} autoComplete="nickname" onChange={event => setDisplayName(event.target.value)} /></div>
        <div><label htmlFor="settings-email">{t("email")}</label><output id="settings-email">{profile.email}</output></div>
        <button type="submit" disabled={nameBusy}>{nameBusy ? t("saving") : t("save")}</button>
      </form>
      <section ref={favoriteSettingsRef} className={settingsStyles.favorites} aria-labelledby="settings-favorites-title" aria-busy={favoritePreviewLoading || favoriteRemovalId !== null}>
        <h2 id="settings-favorites-title" tabIndex={-1}>{t("favoriteFilms")}</h2>
        {favoritePreviewLoading && <p role="status">{t("loading")}</p>}
        {favoritePreviewError && <RetryNotice className={settingsStyles.error} message={t("loadCollectionError")} retryLabel={t("retry")} onRetry={() => setFavoritePreviewAttempt(value => value + 1)} />}
        {!favoritePreviewLoading && !favoritePreviewError && favoritePreview && (favoritePreview.content.length === 0 ? <p>{t("noCollectionFilms")}</p> : <ul>
          {favoritePreview.content.slice(0, 4).map((movie, index) => {
            const title = editorialText(movie.title, t("untitledFilm"));
            return <li key={movie.id}>
              <Link to={path(`/films/${movie.id}`)} aria-label={title}><ResilientImage src={movie.photoUrl} alt="" loading="lazy" fallback={<span>{title.slice(0, 1).toUpperCase()}</span>} /></Link>
              <button className={settingsStyles.favoriteRemove} data-favorite-remove type="button" aria-label={`${t("remove")} ${title}`} disabled={favoriteRemovalId !== null} onClick={() => void removeFavorite(movie.id, index)}>{favoriteRemovalId === movie.id ? <span role="status">{t("loading")}</span> : <span aria-hidden="true">×</span>}</button>
            </li>;
          })}
        </ul>)}
        <Link className={settingsStyles.manageLink} to={`${path("/profile")}?view=collection&collection=favorites#profile-collections`}>{t("favoriteFilms")} <span aria-hidden="true">→</span></Link>
      </section>
    </>}
    {(settingsTab === "avatar" || settingsTab === "profile") && <form id={settingsTab === "avatar" ? "settings-form-avatar" : undefined} className={settingsTab === "profile" ? settingsStyles.mobileOnly : undefined} data-settings-form="avatar" aria-labelledby="settings-avatar-title" aria-busy={nameBusy} onSubmit={event => { void saveName(event, "avatar"); }}>
      <h2 id="settings-avatar-title">{t("avatarUrl")}</h2>
      <div className={settingsStyles.avatarPreview}><ResilientImage src={profile.avatarUrl} alt={getUserName(profile)} fallback={<span className={settingsStyles.avatarInitial}>{getUserInitial(profile)}</span>} /></div>
      <div className={settingsStyles.avatarField}><label htmlFor="profile-avatar-url">{t("avatarUrl")}</label><input id="profile-avatar-url" type="url" disabled={nameBusy} value={avatarUrl} maxLength={255} placeholder="https://…" onChange={event => setAvatarUrl(event.target.value)} /></div>
      <button type="submit" disabled={nameBusy}>{nameBusy ? t("saving") : t("save")}</button>
    </form>}
    {(settingsTab === "connections" || settingsTab === "profile") && <>
      {socialLinksLoading && <p className={settingsTab === "profile" ? settingsStyles.mobileOnly : undefined} role="status">{t("loading")}</p>}
      {socialLinksError && <RetryNotice className={`${settingsStyles.error} ${settingsTab === "profile" ? settingsStyles.mobileOnly : ""}`} message={t("loadSocialLinksError")} retryLabel={t("retry")} onRetry={() => setSocialLinksAttempt(value => value + 1)} />}
      {!socialLinksLoading && !socialLinksError && <form id={settingsTab === "connections" ? "settings-form-connections" : undefined} className={settingsTab === "profile" ? settingsStyles.mobileOnly : undefined} aria-labelledby="social-links-settings" aria-busy={socialLinksBusy} onSubmit={saveSocialLinks}>
        <h2 id="social-links-settings">{t("socialLinks")}</h2>
        {socialLinkPlatforms.map(platform => <div key={platform}><label htmlFor={`social-link-${platform}`}>{t(socialLinkLabelKeys[platform])}</label><input id={`social-link-${platform}`} type="url" disabled={socialLinksBusy} value={socialLinkValues[platform]} placeholder="https://…" maxLength={255} onChange={event => setSocialLinkValues(values => ({ ...values, [platform]: event.target.value }))} /></div>)}
        <button type="submit" disabled={socialLinksBusy}>{socialLinksBusy ? t("saving") : t("save")}</button>
      </form>}
    </>}
  </>}</ProfileSettingsShell>;

  const pageBusy = profileLoading || followingLoading || activityLoading || newsletterLoading || socialLinksLoading || collectionLoading || favoritePreviewLoading || ratingsLoading || reviewsLoading || reviewDetailLoading || listMetadataLoading || nameBusy || passwordBusy || deleteBusy || newsletterBusy || socialLinksBusy;

  const renderReviewCards = (items: ProfileReview[], withScore = true, editable = false) => items.map(item => {
    const title = editorialText(item.movieTitle, t("untitledFilm"));
    const isEditing = editable && editingReviewId === item.reviewId;
    const poster = item.moviePhotoUrl === undefined
      ? profile?.recentRatings.find(rating => rating.movieId === item.movieId)?.moviePhotoUrl
      : item.moviePhotoUrl;
    return <li key={item.reviewId} className={styles.reviewCard} data-review-editing={isEditing || undefined}>
      <Link className={styles.reviewPosterLink} to={path(`/films/${item.movieId}`)} aria-label={title}>
        <ResilientImage className={styles.railPoster} src={poster} alt="" loading="lazy" fallback={<span className={styles.railPosterFallback}>{title.slice(0, 1).toUpperCase()}</span>} />
      </Link>
      <div className={styles.reviewCopy}>
        <div className={styles.reviewHeading}>
          <h3><Link to={path(`/films/${item.movieId}`)}>{title}</Link></h3>
          <div className={styles.reviewHeadingActions}>
            {withScore && profile && <ProfileReviewScore movieId={item.movieId} ownerId={profile.id} title={title} />}
            {editable && profileView === "reviews" && !isEditing && <div className={styles.reviewActions}>
              <button ref={button => { if (button) reviewEditButtonRefs.current.set(item.reviewId, button); else reviewEditButtonRefs.current.delete(item.reviewId); }} type="button" disabled={reviewActionBusy !== null} aria-label={`${t("editReview")}: ${title}`} title={t("editReview")} onClick={() => { pendingReviewFocus.current = null; setReviewDraft(item.content); setEditingReviewId(item.reviewId); setReviewActionMessage(null); setReviewActionError(null); }}><picture><source media="(max-width: 767px)" srcSet="/images/profile-review-edit-phone.png" /><img className={styles.reviewActionIcon} src="/images/profile-review-edit.png" alt="" /></picture><span className={styles.mobileReviewActionLabel}>{t("editReview")}</span></button>
              <button type="button" disabled={reviewActionBusy !== null} aria-label={`${t("deleteReview")}: ${title}`} title={t("deleteReview")} onClick={event => requestProfileReviewDelete(item, event.currentTarget)}><picture><source media="(max-width: 767px)" srcSet="/images/profile-review-delete-phone.png" /><img className={styles.reviewActionIcon} src="/images/profile-review-delete.png" alt="" /></picture><span className={styles.mobileReviewActionLabel}>{t("deleteReview")}</span></button>
            </div>}
          </div>
        </div>
        <time dateTime={item.updatedAt}>{formatDateTime(item.updatedAt, lang)}</time>
        {isEditing ? <form className={styles.reviewEditor} onSubmit={event => { void saveProfileReview(event, item); }} aria-busy={reviewActionBusy === "save"}>
          <label className="srOnly" htmlFor={`profile-review-content-${item.reviewId}`}>{t("review")}</label>
          <textarea id={`profile-review-content-${item.reviewId}`} aria-label={t("review")} autoFocus required minLength={1} maxLength={5000} disabled={reviewActionBusy !== null} value={reviewDraft} onChange={event => setReviewDraft(event.target.value)} onKeyDown={event => { if (event.key === "Escape" && reviewActionBusy === null) { event.preventDefault(); pendingReviewFocus.current = { scope: reviewScopeGeneration.current, request: reviewsRequest.current, origin: event.currentTarget, target: "edit", id: item.reviewId }; setEditingReviewId(null); setReviewDraft(""); } }} />
          <div className={styles.reviewEditorActions}>
            <button type="button" disabled={reviewActionBusy !== null} onClick={event => { pendingReviewFocus.current = { scope: reviewScopeGeneration.current, request: reviewsRequest.current, origin: event.currentTarget, target: "edit", id: item.reviewId }; setEditingReviewId(null); setReviewDraft(""); }}>{t("cancel")}</button>
            <button type="button" className={styles.reviewDeleteButton} disabled={reviewActionBusy !== null} onClick={event => requestProfileReviewDelete(item, event.currentTarget)}>{reviewActionBusy === "delete" ? t("deleting") : t("deleteReview")}</button>
            <button type="submit" className={styles.reviewSaveButton} disabled={reviewActionBusy !== null || reviewDraft.trim().length === 0}>{reviewActionBusy === "save" ? t("saving") : t("saveReview")}</button>
          </div>
        </form> : requestedReviewValue !== null ? <p className={styles.reviewContent}>{item.content}</p> : <Link className={styles.reviewContent} to={path(`/profile?view=reviews&review=${item.reviewId}`)}>{item.content}</Link>}
        {requestedReviewValue !== null && <Link className={styles.globalReviewLink} to={path(`/reviews/${item.reviewId}`)}>{t("review")}<span aria-hidden="true"> ↗</span></Link>}
      </div>
    </li>;
  });

  const saveProfileReview = async (event: React.FormEvent<HTMLFormElement>, item: ProfileReview) => {
    event.preventDefault();
    const content = reviewDraft.trim();
    if (reviewActionBusy !== null || reviewMutation.current !== null || !content || content.length > 5000) return;
    const token = {};
    reviewMutation.current = token;
    const actor = reviewActor;
    const scope = reviewScopeGeneration.current;
    const submitter = (event.nativeEvent as SubmitEvent).submitter;
    const origin = submitter instanceof HTMLElement ? submitter : document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const sameActor = () => reviewMounted.current && actor !== null && currentReviewActor.current === actor && reviewMutation.current === token;
    const sameScope = () => sameActor() && reviewScopeGeneration.current === scope;
    pendingReviewFocus.current = null;
    setReviewActionBusy("save");
    setReviewActionMessage(null);
    setReviewActionError(null);
    try {
      const { data: updated } = await updateReview(item.reviewId, { content });
      if (!sameActor()) return;
      // Preserve cached poster/timestamp fields: the PATCH DTO only supplies content/createdAt.
      setProfile(current => current?.id === actor ? { ...current, recentReviews: current.recentReviews.map(review => review.reviewId === item.reviewId ? { ...review, content: updated.content } : review) } : current);
      setReviewDetail(current => current?.reviewId === item.reviewId ? { ...current, content: updated.content } : current);
      if (sameScope()) {
        setReviewActionMessage("reviewUpdated");
        pendingReviewFocus.current = { scope, request: reviewsRequest.current + 1, origin, target: "edit", id: item.reviewId };
        setEditingReviewId(null);
        setReviewDraft("");
      }
      setReviewsLoading(true);
      setReviewsAttempt(value => value + 1);
    } catch {
      if (!sameScope()) return;
      setReviewActionError("updateReviewError");
      pendingReviewFocus.current = { scope, request: reviewsRequest.current, origin, target: "error" };
    } finally {
      if (sameActor()) { reviewMutation.current = null; setReviewActionBusy(null); }
    }
  };

  const requestProfileReviewDelete = (item: ProfileReview, trigger: HTMLButtonElement) => {
    if (reviewActionBusy !== null || reviewMutation.current !== null) return;
    setPendingReviewDelete({ item, trigger });
  };
  const confirmProfileReviewDelete = async (item: ProfileReview, origin: HTMLButtonElement) => {
    if (reviewActionBusy !== null || reviewMutation.current !== null) return;
    const token = {};
    reviewMutation.current = token;
    const actor = reviewActor;
    const scope = reviewScopeGeneration.current;
    const sameActor = () => reviewMounted.current && actor !== null && currentReviewActor.current === actor && reviewMutation.current === token;
    const sameScope = () => sameActor() && reviewScopeGeneration.current === scope;
    pendingReviewFocus.current = null;
    setReviewActionBusy("delete");
    setReviewActionMessage(null);
    setReviewActionError(null);
    try {
      await deleteReviewRequest(item.reviewId);
      if (!sameActor()) return;
      setProfile(current => current?.id === actor ? { ...current, recentReviews: current.recentReviews.filter(review => review.reviewId !== item.reviewId), stats: { ...current.stats, reviews: Math.max(0, current.stats.reviews - 1) } } : current);
      if (sameScope()) {
        setReviewActionMessage("reviewDeleted");
        pendingReviewFocus.current = { scope, request: reviewsRequest.current + 1, origin, target: "heading" };
        setEditingReviewId(null);
        setReviewDraft("");
      }
      setReviewsLoading(true);
      setReviewsAttempt(value => value + 1);
      if (sameScope() && requestedReviewValue !== null) navigate(path("/profile?view=reviews"), { replace: true, state: { reviewDeleted: true } });
    } catch {
      if (!sameScope()) return;
      setReviewActionError("deleteReviewError");
      pendingReviewFocus.current = { scope, request: reviewsRequest.current, origin, target: "error" };
    } finally {
      if (sameActor()) { reviewMutation.current = null; setReviewActionBusy(null); }
    }
  };

  const filmsView = profileView === "collection" && collectionKind === "watched";
  const viewTitle = networkView ? t(profileView === "followers" ? "followers" : "following") : profileView === "ratings" ? t("allRatings") : profileView === "lists" ? t("searchLists") : profileView === "reviews" ? t(requestedReviewValue === null ? "reviews" : "review") : filmsView ? t("films") : collectionKind === "favorites" ? t("likes") : t("watchlist");
  return <FollowActionsProvider><main className={styles.page} data-profile-view={profileView ?? undefined} data-review-detail={requestedReviewValue !== null || undefined} data-network-view={networkView || undefined} data-films-view={filmsView || undefined} onFocusCapture={event => {
    const target = event.target;
    if (target instanceof HTMLElement && !target.closest('[role="dialog"]')) networkFocusOrigin.current = target.matches("[data-network-action]") ? { element: target, scope: currentNetworkFocusScope.current } : null;
  }} aria-labelledby="profile-page-title" aria-busy={pageBusy || followersLoading}>
    <div className={styles.content}>
    {requestedReviewValue !== null && <div className={styles.reviewDetailToolbar}><Link to={path("/profile?view=reviews")} aria-label={t("allReviews")}>←</Link><h2 ref={reviewDetailMobileHeadingRef} tabIndex={-1}>{t("review")}</h2><span aria-hidden="true" /></div>}
    <h1 className={profileView === "reviews" || filmsView || networkView ? "srOnly" : styles.pageTitle} id="profile-page-title">{profileView ? viewTitle : t("myProfile")}</h1>
    {error && <p className={styles.alert} id="profile-action-error" role="alert">{error}</p>}
    {message && <p className={styles.status} role="status">{message}</p>}
    {profileLoading && <ProfileLoading label={t("loading")} layout="identity" />}
    {profileLoadError && <RetryNotice className={styles.feedback} message={t("loadProfileError")} retryLabel={t("retry")} onRetry={() => setProfileAttempt(value => value + 1)} />}
    {profile && <>
      {(filmsView || networkView) && <div className={styles.collectionToolbar}>
        <Link to={sectionTarget("profile-overview", null)} aria-label={t("profile")}>←</Link>
        <h2 ref={filmsView ? collectionToolbarHeadingRef : networkView ? networkToolbarHeadingRef : undefined} tabIndex={filmsView || networkView ? -1 : undefined}>{viewTitle}</h2>
        {filmsView ? <button ref={collectionFilterButtonRef} type="button" aria-label={t("filters")} aria-expanded={collectionFiltersOpen} aria-controls="profile-collection-filters" onClick={() => setCollectionFiltersOpen(value => !value)} onKeyDown={event => { closeCollectionFiltersOnEscape(event); }}><i className="fa-solid fa-sliders" aria-hidden="true" /></button> : <span className={styles.toolbarAdornment} aria-hidden="true"><i className="fa-solid fa-sliders" /></span>}
      </div>}
      <section className={styles.hero} aria-labelledby="profile-identity">
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
        {(profileView === "reviews" || networkView) && <button className={styles.heroProfileEdit} type="button" onClick={openProfileSettings}>{t("editProfile")}</button>}
        {profileView ? <Link className={`${styles.heroEdit} ${profileView === "reviews" ? styles.reviewsMobileBack : ""}`} to={sectionTarget("profile-overview", null)} aria-label={t("profile")}>←</Link> : <button className={styles.heroEdit} type="button" aria-label={t("accountSettings")} onClick={openProfileSettings}>
          <i className="fa-solid fa-gear" aria-hidden="true" />
        </button>}
        <ResilientImage className={styles.avatar} src={profile.avatarUrl} alt="" width={120} height={120}
          fallback={<span className={styles.avatarFallback} aria-hidden="true">{getUserInitial(profile)}</span>} />
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>{t("profile")}</p>
          <h2 id="profile-identity">{getUserIdentity(profile, t("someone"))}</h2>
          <p className={styles.username}>{getUserHandle(profile, t("someone"))}</p>
        </div>
        <dl className={styles.heroMetrics}>
          <div><dt>{t("watched")}</dt><dd>{profile.stats.watched}</dd></div>
          <div><dt><Link to={sectionTarget("profile-following", null)}>{t("following")}</Link></dt><dd>{following?.totalElements ?? "—"}</dd></div>
          <div><dt><Link to={sectionTarget("profile-followers", null)}>{t("followers")}</Link></dt><dd>{followers?.totalElements ?? "—"}</dd></div>
        </dl>
        {followingError && <RetryNotice className={styles.metricRetry} message={t("loadNetworkError")} retryLabel={t("retry")} onRetry={() => setFollowingAttempt(value => value + 1)} />}
        {followersError && <RetryNotice className={styles.metricRetry} message={t("loadNetworkError")} retryLabel={t("retry")} onRetry={() => setFollowersAttempt(value => value + 1)} />}
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
      <section className={`${styles.section} ${styles.previewSection}`} id="profile-overview" aria-labelledby="profile-favorite-preview-title" aria-busy={favoritePreviewLoading}>
        <span id="profile-favorite-preview" aria-hidden="true" /><h2 id="profile-favorite-preview-title"><Link to={sectionTarget("profile-collections", "favorites")}>{t("favoriteFilms")}</Link></h2>
        {favoritePreviewLoading && <ProfileLoading label={t("loading")} layout="films" />}
        {favoritePreviewError && <RetryNotice className={styles.feedback} message={t("loadCollectionError")} retryLabel={t("retry")} onRetry={() => setFavoritePreviewAttempt(value => value + 1)} />}
        {!favoritePreviewLoading && !favoritePreviewError && favoritePreview && (favoritePreview.content.length === 0 ? <p className={styles.empty}>{t("noCollectionFilms")}</p> : <ul className={styles.overviewPosterGrid}>
          {favoritePreview.content.slice(0, 4).map(movie => {
            const title = editorialText(movie.title, t("untitledFilm"));
            return <li key={movie.id}><Link className={styles.railPosterLink} to={path(`/films/${movie.id}`)} aria-label={title} title={title}>
              <ResilientImage className={styles.railPoster} src={movie.photoUrl} alt="" loading="lazy" fallback={<span className={styles.railPosterFallback}>{title.slice(0, 1).toUpperCase()}</span>} />
            </Link></li>;
          })}
        </ul>)}
      </section>
      <section className={`${styles.section} ${styles.previewSection}`} id="profile-activity" aria-labelledby="profile-activity-title" aria-busy={activityLoading}>
        <h2 id="profile-activity-title">{t("recentActivity")}</h2>
        {activityLoading && <ProfileLoading label={t("loading")} layout="films" />}
        {activityError && <RetryNotice className={styles.feedback} message={t("loadActivityError")} retryLabel={t("retry")} onRetry={() => setActivityAttempt(value => value + 1)} />}
        {!activityLoading && !activityError && activity && (activity.content.length === 0 ? <p className={styles.empty}>{t("noActivity")}</p> : <>
          <ul className={styles.overviewPosterGrid} id="profile-activity-preview">{(activityExpanded ? activity.content : activity.content.slice(0, 4)).map(item => {
            const title = item.movie ? editorialText(item.movie.title, t("untitledFilm")) : item.relatedUser ? getUserName(item.relatedUser, t("someone")) : item.list ? editorialText(item.list.name, t("lists")) : localizeActivityType(item.type, t);
            return <li key={item.id}>
              {item.movie ? <PublicProfilePoster movieId={item.movie.id} title={title} /> : item.relatedUser ? <Link className={styles.railPosterLink} to={path(`/users/${item.relatedUser.id}`)} aria-label={title}><span className={styles.railPosterFallback} aria-hidden="true">{title.slice(0, 1).toUpperCase()}</span></Link> : <div className={styles.railPosterFallback} role="img" aria-label={title}>{title.slice(0, 1).toUpperCase()}</div>}
              <p className={styles.activityCaption}><span>{localizeActivityType(item.type, t)}</span><span className="srOnly">{title}</span><time dateTime={item.createdAt}>{formatDateTime(item.createdAt, lang)}</time></p>
            </li>;
          })}</ul>
          {(activity.content.length > 4 || activity.totalPages > 1) && <button className={styles.previewAction} type="button" aria-expanded={activityExpanded} aria-controls="profile-activity-preview" onClick={() => { if (activityExpanded) setActivityPage(0); setActivityExpanded(value => !value); }}>{activityExpanded ? t("close") : t("viewAll")}<span className="srOnly">: {t("recentActivity")}</span></button>}
          {activityExpanded && <Pagination className={styles.pagination} page={activityPage} totalPages={activity.totalPages} label={t("activityPagination")} busy={activityLoading} onPageChange={setActivityPage} />}
        </>)}
      </section>
      {(profileView === "ratings" || (!profileView && location.hash.startsWith("#profile-ratings"))) && <>
      <section className={styles.section} id="profile-ratings" aria-labelledby="profile-ratings-title" aria-busy={ratingsLoading}>
        <h2 id="profile-ratings-title">{t("allRatings")}</h2>
        {ratingsLoading && <ProfileLoading label={t("loading")} layout="films" />}
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
      </>}
      <section className={`${styles.section} ${styles.previewSection}`} id="profile-review-preview" aria-labelledby="profile-review-preview-title">
        <h2 id="profile-review-preview-title"><Link to={sectionTarget("profile-reviews", null)}>{t("recentReviews")}</Link></h2>
        {profile.recentReviews.length === 0 ? <p className={styles.empty}>{t("noReviews")}</p> : <ul className={styles.reviewCards}>{renderReviewCards(profile.recentReviews.slice(0, 2), !profileView)}</ul>}
      </section>
      {(profileView === "reviews" || (!profileView && location.hash.startsWith("#profile-reviews"))) && <>
      <section className={styles.section} id="profile-reviews" aria-labelledby="profile-reviews-title" aria-busy={reviewsLoading || reviewDetailLoading || reviewActionBusy !== null}>
        <h2 ref={reviewHeadingRef} id="profile-reviews-title" tabIndex={profileView === "reviews" ? -1 : undefined}>{profileView === "reviews" ? <><span className={styles.mobileReviewsHeading}>{t(requestedReviewValue === null ? "reviews" : "review")}</span><span className={styles.desktopReviewsHeading}>{requestedReviewValue === null ? t("reviewsByUser").replace("{name}", getUserName(profile, t("someone"))) : `${t("reviewBy")} ${getUserName(profile, t("someone"))}`}</span></> : <Link to={sectionTarget("profile-reviews", null)}>{t("allReviews")}</Link>}</h2>
        {profileView === "reviews" && (reviewActionMessage || location.state?.reviewDeleted) && <p className={styles.status} role="status">{t(reviewActionMessage ?? "reviewDeleted")}</p>}
        {profileView === "reviews" && reviewActionError && <p ref={reviewErrorRef} tabIndex={-1} className={`${styles.alert} ${styles.reviewFeedbackFocus}`} role="alert">{t(reviewActionError)}</p>}
        {(requestedReviewValue !== null ? reviewDetailLoading : reviewsLoading) && <div role="status" aria-label={t("loading")}><span className="srOnly">{t("loading")}</span><div className={styles.reviewLoading} aria-hidden="true"><span /><div><span /><span /><span /></div></div></div>}
        {(requestedReviewValue !== null ? reviewDetailError : reviewsError) && <RetryNotice className={styles.feedback} message={t(requestedReviewValue !== null ? "reviewUnavailable" : "loadReviewsError")} retryLabel={t("retry")} disabled={reviewDetailLoading || reviewsLoading} busy={reviewDetailLoading || reviewsLoading} onRetry={() => {
          detailRetryOrigin.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
          if (requestedReviewValue !== null && requestedReviewId === null) {
            (window.matchMedia("(max-width: 767px)").matches ? reviewDetailMobileHeadingRef.current : reviewHeadingRef.current)?.focus();
            detailRetryOrigin.current = null;
            return;
          }
          setReviewDetailLoading(requestedReviewValue !== null);
          setReviewsAttempt(value => value + 1);
        }} />}
        {requestedReviewValue !== null && !reviewDetailLoading && !reviewDetailError && reviewDetail && <ul className={styles.reviewCards}>{renderReviewCards([reviewDetail], true, true)}</ul>}
        {requestedReviewValue === null && !reviewsLoading && !reviewsError && reviewsHistory && <>
          {reviewsHistory.content.length === 0 ? <p>{t("noReviews")}</p> : <ul className={styles.reviewCards}>{renderReviewCards(reviewsHistory.content, true, true)}</ul>}
          <Pagination className={styles.pagination} page={reviewsPage} totalPages={reviewsHistory.totalPages} label={t("allReviews")} busy={reviewsLoading} onPageChange={setReviewsPage} />
        </>}
      </section>
      </>}
      <section className={`${styles.section} ${styles.previewSection}`} id="profile-following-preview" aria-labelledby="profile-following-preview-title" aria-busy={followingLoading}>
        <h2 id="profile-following-preview-title"><Link to={sectionTarget("profile-following", null)}>{t("following")}</Link></h2>
        {followingLoading && <ProfileLoading label={t("loading")} layout="rows" />}
        {followingError && <RetryNotice className={styles.feedback} message={t("loadNetworkError")} retryLabel={t("retry")} onRetry={() => setFollowingAttempt(value => value + 1)} />}
        {!followingLoading && !followingError && following && (following.content.length === 0 ? <p>{t("noFollowing")}</p> : <ul className={styles.followingPreview}>{following.content.map(networkUser => <li key={networkUser.id}><Link to={path(`/users/${networkUser.id}`)} aria-label={getUserName(networkUser, t("someone"))} title={getUserName(networkUser, t("someone"))}><ResilientImage src={networkUser.avatarUrl} alt="" width={80} height={80} loading="lazy" fallback={<span className={styles.followingInitial} aria-hidden="true">{getUserInitial(networkUser)}</span>} /></Link></li>)}</ul>)}
      </section>
      {(profileView === "following" || (!profileView && location.hash.startsWith("#profile-following"))) && <>
      <section className={styles.section} id="profile-following" aria-labelledby="profile-following-title" aria-busy={followingLoading}>
        <h2 id="profile-following-title">{t("following")}</h2>
        {followingLoading && <ProfileLoading label={t("loading")} layout="rows" />}
        {followingError && <RetryNotice className={styles.feedback} message={t("loadNetworkError")} retryLabel={t("retry")} onRetry={() => setFollowingAttempt(value => value + 1)} />}
        {!followingLoading && !followingError && following && (following.content.length === 0 ? <p>{t("noFollowing")}</p> : <ul className={styles.networkList}>
          {(!profileView || profileView === "following") && following.content.map(networkUser => <UserFollowRow key={networkUser.id} user={networkUser} href={path(`/users/${networkUser.id}`)} presentation="profileNetwork" onFollowSettled={refreshNetwork} />)}
        </ul>)}
        {!followingLoading && !followingError && following && <Pagination className={styles.pagination} page={followingPage} totalPages={following.totalPages} label={t("networkPagination")} busy={followingLoading} onPageChange={setFollowingPage} />}
      </section>
      </>}
      {(profileView === "followers" || (!profileView && location.hash.startsWith("#profile-followers"))) && <>
      <section className={styles.section} id="profile-followers" aria-labelledby="profile-followers-title" aria-busy={followersLoading}>
        <h2 id="profile-followers-title">{t("followers")}</h2>
        {followersLoading && <ProfileLoading label={t("loading")} layout="rows" />}
        {followersError && <RetryNotice className={styles.feedback} message={t("loadNetworkError")} retryLabel={t("retry")} onRetry={() => setFollowersAttempt(value => value + 1)} />}
        {!followersLoading && !followersError && followers && (followers.content.length === 0 ? <p>{t("noFollowers")}</p> : <ul className={styles.networkList}>{(!profileView || profileView === "followers") && followers.content.map(networkUser => <UserFollowRow key={networkUser.id} user={networkUser} href={path(`/users/${networkUser.id}`)} presentation="profileNetwork" onFollowSettled={refreshNetwork} />)}</ul>)}
        {followers && <Pagination className={styles.pagination} page={followersPage} totalPages={followers.totalPages} label={t("networkPagination")} busy={followersLoading} onPageChange={setFollowersPage} />}
      </section>
      </>}
      <section className={`${styles.section} ${!profileView ? styles.previewSection : ""}`} id="profile-lists" aria-labelledby="profile-lists-title" aria-busy={listMetadataLoading}>
        <h2 id="profile-lists-title">{profileView ? t("lists") : <Link to={sectionTarget("profile-lists", null)}>{t("searchLists")}</Link>}</h2>
        {listMetadataError && <RetryNotice className={styles.feedback} message={t("loadListsError")} retryLabel={t("retry")} onRetry={() => setListMetadataAttempt(value => value + 1)} />}
        {profile.lists.length === 0 ? <p className={styles.empty}>{t("noLists")}</p> : <ul className={styles.listCards}>{(profileView === "lists" ? profile.lists : profile.lists.slice(0, 1)).map(list => {
          const metadata = listMetadata?.find(item => item.id === list.id);
          return <ProfileListCard key={`${profile.id}:${list.id}`} list={metadata ?? list} description={metadata?.description} tags={metadata?.tags} ownerId={profile.id} enabled={user?.id === profile.id && (!profileView || profileView === "lists")} />;
        })}</ul>}
      </section>
      {!profileView && <nav className={styles.overviewLinks} aria-label={t("profileCollections")}>{overviewNavigation.map(({ id, label, collectionKind: kind }) => <Link key={label} to={sectionTarget(id, kind)} onClick={event => { if (!event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey && kind) setCollectionPage(0); }}>{t(label)}<span aria-hidden="true">›</span></Link>)}</nav>}
      {(profileView === "collection" || (!profileView && location.hash.startsWith("#profile-collection"))) && <>
      <section className={styles.section} id="profile-collections" aria-labelledby="profile-collections-title" aria-busy={collectionLoading}>
        <h2 id="profile-collections-title" ref={collectionHeadingRef} tabIndex={-1}>{filmsView ? t("watched") : profileView ? viewTitle : t("profileCollections")}</h2>
        <div className={styles.tabs} data-filters-open={collectionFiltersOpen} id="profile-collection-filters" role="tablist" aria-orientation="horizontal" aria-label={t("profileCollections")}>
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
            onKeyDown={event => handleCollectionTabKeyDown(event, kind)}
          >
            {kind === "favorites" ? t("favorite") : t(kind)}
          </button>)}
        </div>
        <div id="profile-collection-content" role="tabpanel" tabIndex={collection && collection.content.length > 0 ? -1 : 0} aria-labelledby={`profile-collection-tab-${collectionKind}`}>
          {collectionLoading && <ProfileLoading label={t("loading")} layout="films" />}
          {collectionError && <RetryNotice className={styles.feedback} message={t("loadCollectionError")} retryLabel={t("retry")} onRetry={retryCollection} />}
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
            <Pagination className={styles.pagination} page={collectionPage} totalPages={collection.totalPages} label={t("profileCollectionPagination")} busy={collectionLoading} onPageChange={changeCollectionPage} />
          </>}
        </div>
      </section>
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
      <form className={styles.form} aria-labelledby="profile-identity-form-title" onSubmit={saveName} aria-busy={nameBusy}>
        <h2 id="profile-identity-form-title">{t("profileIdentity")}</h2>
        <label htmlFor="profile-display-name">{t("displayName")}</label>
        <input id="profile-display-name" value={displayName} disabled={nameBusy} minLength={displayName.trim() ? 2 : undefined} maxLength={60} onChange={e => setDisplayName(e.target.value)} />
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
