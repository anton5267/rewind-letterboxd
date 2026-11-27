import { useEffect, useState } from "react";
import { getPublicProfileLikedLists, type PublicProfileListPage, type PublicProfileResponse } from "../../api/profile.api";

export function usePublicProfileLikedLists(profileId: number, profile: PublicProfileResponse | null, enabled: boolean) {
  const [page, setPage] = useState(0);
  const [data, setData] = useState<PublicProfileListPage | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => { setPage(0); }, [profileId, enabled]);

  useEffect(() => {
    if (!enabled || profile?.id !== profileId || !Number.isSafeInteger(profileId) || profileId <= 0) {
      setLoading(false);
      return;
    }
    let current = true;
    setLoading(true);
    setData(null);
    setError(false);
    getPublicProfileLikedLists(profileId, page).then(({ data: result }) => {
      if (current) setData(result);
    }).catch(() => { if (current) setError(true); }).finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [attempt, enabled, page, profile?.id, profileId]);

  return { likedLists: data, likedListsPage: page, likedListsLoading: loading, likedListsError: error,
    setLikedListsPage: setPage, retryLikedLists: () => setAttempt(value => value + 1) };
}
