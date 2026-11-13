import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { getPublicProfileCollection, getPublicProfileLikedReviews, getPublicProfileLists, type PublicProfileListPage, type PublicProfileResponse, type PublicProfileReviewPage } from "../../api/profile.api";
import type { MoviePage } from "../../api/search.api";
import { getUserActivity, type ActivityPage } from "../../api/social.api";
import { useAuth } from "../../context/AuthContext";
import { useLocale } from "../../i18n";
import { toTagSlug } from "../../utils/tagSlug";
import { isPageOutOfRange, getLastPageIndex } from "../../utils/pagination";
import type { PublicProfileView } from "./publicProfileNavigation";

export function usePublicProfileContent(profileId: number, profile: PublicProfileResponse | null, profileView: PublicProfileView) {
  const { lang } = useLocale();
  const { isAuth, user } = useAuth();
  const location = useLocation();
  const validProfileId = Number.isSafeInteger(profileId) && profileId > 0;

  const [favoritePreview, setFavoritePreview] = useState<MoviePage | null>(null);

  const [favoritePreviewLoading, setFavoritePreviewLoading] = useState(false);

  const [favoritePreviewError, setFavoritePreviewError] = useState(false);

  const [favoritePreviewAttempt, setFavoritePreviewAttempt] = useState(0);

  const [expandedActivity, setExpandedActivity] = useState(false);

  const [expandedReviews, setExpandedReviews] = useState(false);

  const [activity, setActivity] = useState<ActivityPage | null>(null);

  const [activityPage, setActivityPage] = useState(0);

  const [activityLoading, setActivityLoading] = useState(false);

  const [activityError, setActivityError] = useState(false);

  const [activityAttempt, setActivityAttempt] = useState(0);

  const [publicLists, setPublicLists] = useState<PublicProfileListPage | null>(null);

  const [publicListsLoading, setPublicListsLoading] = useState(false);

  const [publicListsError, setPublicListsError] = useState(false);

  const [publicListsPage, setPublicListsPage] = useState(0);

  const [publicListsAttempt, setPublicListsAttempt] = useState(0);

  const [expandedProfileListTagsKey, setExpandedProfileListTagsKey] = useState<string | null>(null);

  const [likedReviews, setLikedReviews] = useState<PublicProfileReviewPage | null>(null);

  const [likedReviewsPage, setLikedReviewsPage] = useState(0);

  const [likedReviewsLoading, setLikedReviewsLoading] = useState(false);

  const [likedReviewsError, setLikedReviewsError] = useState(false);

  const [likedReviewsAttempt, setLikedReviewsAttempt] = useState(0);

  useEffect(() => {
    if (!validProfileId || profile?.id !== profileId) return;
    let current = true;
    setFavoritePreview(null);
    setFavoritePreviewLoading(true);
    setFavoritePreviewError(false);
    getPublicProfileCollection(profileId, "favorites", 0)
      .then(({ data }) => { if (current) setFavoritePreview(data); })
      .catch(() => { if (current) setFavoritePreviewError(true); })
      .finally(() => { if (current) setFavoritePreviewLoading(false); });
    return () => { current = false; };
  }, [favoritePreviewAttempt, lang, profile?.id, profileId, validProfileId]);

  useEffect(() => {
    setExpandedActivity(false);
    setExpandedReviews(false);
    setActivityPage(0);
    setPublicListsPage(0);
    setLikedReviewsPage(0);
  }, [profileId, isAuth, user?.id]);

  useEffect(() => {
    if (!validProfileId || profile?.id !== profileId) return;
    let current = true;
    setActivityLoading(true);
    setActivity(null);
    setActivityError(false);
    getUserActivity(profileId, activityPage).then(({ data }) => {
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
  }, [activityAttempt, activityPage, lang, profile?.id, profileId, validProfileId]);

  useEffect(() => {
    if (!validProfileId || profile?.id !== profileId) return;
    let current = true;
    setPublicListsLoading(true);
    setPublicLists(null);
    setPublicListsError(false);
    getPublicProfileLists(profileId, publicListsPage)
      .then(({ data }) => {
        if (!current) return;
        if (isPageOutOfRange(publicListsPage, data.totalPages)) {
          setPublicListsPage(getLastPageIndex(data.totalPages));
          return;
        }
        setPublicLists(data);
      })
      .catch(() => { if (current) setPublicListsError(true); })
      .finally(() => { if (current) setPublicListsLoading(false); });
    return () => { current = false; };
  }, [lang, profile?.id, profileId, publicListsAttempt, publicListsPage, validProfileId]);

  useEffect(() => {
    if (!validProfileId || profile?.id !== profileId) return;
    let current = true;
    setLikedReviewsLoading(true);
    setLikedReviews(null);
    setLikedReviewsError(false);
    getPublicProfileLikedReviews(profileId, likedReviewsPage)
      .then(({ data }) => {
        if (!current) return;
        if (isPageOutOfRange(likedReviewsPage, data.totalPages)) {
          setLikedReviewsPage(getLastPageIndex(data.totalPages));
          return;
        }
        setLikedReviews(data);
      })
      .catch(() => { if (current) setLikedReviewsError(true); })
      .finally(() => { if (current) setLikedReviewsLoading(false); });
    return () => { current = false; };
  }, [lang, likedReviewsAttempt, likedReviewsPage, profile?.id, profileId, validProfileId]);

  useEffect(() => {
    if (profileView !== "lists") setPublicListsPage(0);
  }, [profileView, profileId, location.hash]);

  const currentPublicListTags = Array.from(new Map(
    (publicLists?.content ?? []).flatMap(list => list.tags ?? []).map(tag => [toTagSlug(tag), tag] as const),
  ).values());

  const profileListTagsKey = `${String(profileId)}:${publicListsPage}`;

  const profileListTagsExpanded = expandedProfileListTagsKey === profileListTagsKey;

  const retryFavorites = () => {
    setFavoritePreviewLoading(true);
    setFavoritePreviewError(false);
    setFavoritePreviewAttempt(value => value + 1);
  };
  const retryActivity = () => {
    setActivityLoading(true);
    setActivityError(false);
    setActivityAttempt(value => value + 1);
  };
  const retryPublicLists = () => {
    setPublicListsLoading(true);
    setPublicListsError(false);
    setPublicListsAttempt(value => value + 1);
  };
  const retryLikedReviews = () => {
    setLikedReviewsLoading(true);
    setLikedReviewsError(false);
    setLikedReviewsAttempt(value => value + 1);
  };

  return {
    favoritePreview, favoritePreviewLoading, favoritePreviewError, retryFavorites,
    activity, activityPage, activityLoading, activityError, setActivityPage, retryActivity,
    expandedActivity, expandedReviews, setExpandedActivity, setExpandedReviews,
    publicLists, publicListsLoading, publicListsError, publicListsPage, setPublicListsPage, retryPublicLists,
    currentPublicListTags, profileListTagsKey, profileListTagsExpanded, setExpandedProfileListTagsKey,
    likedReviews, likedReviewsPage, likedReviewsLoading, likedReviewsError, setLikedReviewsPage, retryLikedReviews,
  };
}
