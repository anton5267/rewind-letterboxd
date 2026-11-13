import { isAxiosError } from "axios";
import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { getPublicProfile, type PublicProfileResponse } from "../../api/profile.api";
import { useLocale } from "../../i18n";

export function usePublicProfileIdentity(profileId: number) {
  const { lang } = useLocale();
  const location = useLocation();
  const validProfileId = Number.isSafeInteger(profileId) && profileId > 0;

  const [profile, setProfile] = useState<PublicProfileResponse | null>(null);

  const [error, setError] = useState(false);

  const [notFound, setNotFound] = useState(false);

  const [profileAttempt, setProfileAttempt] = useState(0);

  const profileRetryAlertRef = useRef<HTMLParagraphElement>(null);

  const profileRetryOrigin = useRef<HTMLElement | null>(null);

  useEffect(() => {
    profileRetryOrigin.current = null;
  }, [location.key, lang]);

  useEffect(() => {
    const origin = profileRetryOrigin.current;
    if (!origin || (!error && profile === null)) return;
    const frame = window.requestAnimationFrame(() => {
      if (profileRetryOrigin.current !== origin) return;
      profileRetryOrigin.current = null;
      if (origin.isConnected || (document.activeElement !== document.body && document.activeElement !== null)) return;
      const mobileTitle = document.getElementById("public-profile-view-title");
      const profileTitle = document.getElementById("public-profile-title");
      const target = error ? profileRetryAlertRef.current?.querySelector<HTMLButtonElement>("[data-retry-button]") ?? (notFound ? profileRetryAlertRef.current : null) :
        mobileTitle?.getClientRects().length ? mobileTitle : profileTitle;
      target?.focus();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [error, notFound, profile, location.key, lang]);

  useEffect(() => {
    let current = true;
    setProfile(null);
    setError(false);
    setNotFound(false);
    if (!validProfileId) {
      setError(true);
      return;
    }
    getPublicProfile(profileId)
      .then(({ data }) => { if (current) setProfile(data); })
      .catch(cause => {
        if (!current) return;
        setNotFound(isAxiosError(cause) && cause.response?.status === 404);
        setError(true);
      });
    return () => { current = false; };
  }, [lang, profileAttempt, profileId, validProfileId]);

  const retryProfile = () => {
    profileRetryOrigin.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setProfileAttempt(value => value + 1);
  };

  return { profile, error, notFound, profileRetryAlertRef, retryProfile };
}
