import { useAuth } from "../../context/AuthContext";
import { useState, useRef, useEffect } from "react";
import { getUserActivity, type ActivityPage } from "../../api/social.api";
import { isPageOutOfRange, getLastPageIndex } from "../../utils/pagination";

export function useProfileActivity() {
  const { isAuth, user } = useAuth();

  const [activity, setActivity] = useState<ActivityPage | null>(null);

  const [activityPage, setActivityPage] = useState(0);

  const [activityLoading, setActivityLoading] = useState(false);

  const [activityError, setActivityError] = useState(false);

  const [activityAttempt, setActivityAttempt] = useState(0);

  const [activityExpanded, setActivityExpanded] = useState(false);

  const activityHeadingRef = useRef<HTMLHeadingElement>(null);

  const activityRetryFocus = useRef<{ origin: HTMLElement | null; attempt: number } | null>(null);

  useEffect(() => {
    setActivityPage(0);
    setActivityExpanded(false);
  }, [user?.id]);

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

  useEffect(() => {
    const pending = activityRetryFocus.current;
    if (!pending || pending.attempt !== activityAttempt || activityLoading) return;
    const frame = window.requestAnimationFrame(() => {
      if (activityRetryFocus.current !== pending) return;
      activityRetryFocus.current = null;
      const active = document.activeElement;
      if (active !== document.body && active !== pending.origin) return;
      if (activityError) document.querySelector<HTMLButtonElement>("#profile-activity [data-retry-button]:not(:disabled)")?.focus();
      else activityHeadingRef.current?.focus();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [activityAttempt, activityError, activityLoading, activity]);

  return {
    activityLoading,
    activityHeadingRef,
    activityError,
    activityRetryFocus,
    activityAttempt,
    setActivityLoading,
    setActivityError,
    setActivityAttempt,
    activity,
    activityExpanded,
    setActivityPage,
    setActivityExpanded,
    activityPage,
  };
}

export type ProfileActivityModel = ReturnType<typeof useProfileActivity>;
