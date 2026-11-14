import { usesHostedSupabaseAuth } from "../../api/supabaseClient";
import { useAuth } from "../../context/AuthContext";
import { useLocation } from "react-router-dom";
import { useLocale } from "../../i18n";
import { useState, useRef, useLayoutEffect, useEffect } from "react";
import { getProfile, updateProfile, type ProfileResponse, type ProfileReplyPreference } from "../../api/profile.api";
import { safeHttpUrl } from "../../utils/externalUrl";
import { type ProfileRoute } from "./profileRoute";
import { type ProfileFeedbackModel } from "./useProfileFeedback";

export function useProfileIdentity({ route, feedback }: {
  route: Pick<ProfileRoute, "settingsTab">;
  feedback: Pick<
    ProfileFeedbackModel,
    | "activeUserId"
    | "settingsFeedbackGeneration"
    | "settingsMounted"
    | "setError"
    | "setMessage"
    | "setSettingsFeedback"
    | "settingsFeedbackSequence"
  >;
}) {
  const { isAuth, user } = useAuth();
  const location = useLocation();
  const { t, lang } = useLocale();
  const { settingsTab } = route;
  const {
    activeUserId,
    settingsFeedbackGeneration,
    settingsMounted,
    setError,
    setMessage,
    setSettingsFeedback,
    settingsFeedbackSequence,
  } = feedback;

  const [profile, setProfile] = useState<ProfileResponse | null>(null);

  const [profileLoading, setProfileLoading] = useState(false);

  const [profileLoadError, setProfileLoadError] = useState(false);

  const [profileAttempt, setProfileAttempt] = useState(0);

  const profileLoadRequest = useRef(0);

  const profileLoadFocusScope = JSON.stringify([location.key, lang, isAuth, user?.id ?? null, settingsTab]);

  const currentProfileLoadFocusScope = useRef(profileLoadFocusScope);

  currentProfileLoadFocusScope.current = profileLoadFocusScope;

  const pendingProfileLoadFocus = useRef<{ origin: HTMLElement | null; attempt: number; scope: string; request: number } | null>(null);

  useLayoutEffect(() => {
    if (pendingProfileLoadFocus.current?.scope !== profileLoadFocusScope) pendingProfileLoadFocus.current = null;
  }, [profileLoadFocusScope]);

  const [displayName, setDisplayName] = useState("");

  const [avatarUrl, setAvatarUrl] = useState("");

  const [bio, setBio] = useState("");

  const [profileLocation, setProfileLocation] = useState("");

  const [pronoun, setPronoun] = useState("");

  const [replyPreference, setReplyPreference] = useState<ProfileReplyPreference>("ANYONE");

  const [givenName, setGivenName] = useState("");
  const [familyName, setFamilyName] = useState("");

  const [nameBusy, setNameBusy] = useState(false);

  const identityMutation = useRef(0);

  useEffect(() => {
    identityMutation.current += 1;
    setNameBusy(false);
    setGivenName("");
    setFamilyName("");
  }, [isAuth, user?.id]);

  useEffect(() => {
    if (!isAuth) return;
    let current = true;
    const request = ++profileLoadRequest.current;
    const isCurrentRequest = () => current && profileLoadRequest.current === request;
    setProfileLoading(true);
    setProfileLoadError(false);
    setProfile(null);
    getProfile().then(({ data }) => {
      if (!isCurrentRequest()) return;
      setProfile(data);
      setDisplayName(data.displayName ?? "");
      setGivenName(data.givenName ?? "");
      setFamilyName(data.familyName ?? "");
      setAvatarUrl(data.avatarUrl ?? "");
      setBio(data.bio ?? "");
      setProfileLocation(data.location ?? "");
      setPronoun(data.pronoun ?? "");
      setReplyPreference(data.replyPreference ?? "ANYONE");
    }).catch(() => { if (isCurrentRequest()) setProfileLoadError(true); })
      .finally(() => { if (isCurrentRequest()) setProfileLoading(false); });
    return () => { current = false; };
  }, [isAuth, profileAttempt, user?.id]);

  useEffect(() => {
    const pending = pendingProfileLoadFocus.current;
    if (!pending || pending.attempt !== profileAttempt || pending.scope !== currentProfileLoadFocusScope.current || pending.request !== profileLoadRequest.current || profileLoading) return;
    const frame = window.requestAnimationFrame(() => {
      if (pendingProfileLoadFocus.current !== pending) return;
      pendingProfileLoadFocus.current = null;
      if (pending.scope !== currentProfileLoadFocusScope.current || pending.request !== profileLoadRequest.current) return;
      const active = document.activeElement;
      if (active !== document.body && active !== pending.origin) return;
      if (profileLoadError) {
        const root = settingsTab ? '[aria-labelledby="account-settings-title"]' : '[aria-labelledby="profile-page-title"]';
        document.querySelector<HTMLElement>(`${root} [data-retry-button]:not(:disabled)`)?.focus();
      } else if (settingsTab) {
        const headingId = window.matchMedia("(max-width: 767px)").matches ? "account-settings-mobile-title" : "account-settings-title";
        document.getElementById(headingId)?.focus();
      } else document.getElementById("profile-page-title")?.focus();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [profileAttempt, profileLoading, profileLoadError, settingsTab, profile?.id, location.key, lang, isAuth, user?.id]);

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
        ...(fields !== "avatar" ? { bio: bio.trim(), location: profileLocation.trim(), pronoun, replyPreference } : {}),
        ...(fields !== "avatar" && usesHostedSupabaseAuth ? { givenName: givenName.trim(), familyName: familyName.trim() } : {}),
      });
      if (!isCurrentRequest()) return;
      setProfile(data);
      if (fields !== "avatar") setDisplayName(data.displayName ?? "");
      if (fields !== "name") setAvatarUrl(data.avatarUrl ?? "");
      if (fields !== "avatar") {
        setGivenName(data.givenName ?? "");
        setFamilyName(data.familyName ?? "");
        setBio(data.bio ?? "");
        setProfileLocation(data.location ?? "");
        setPronoun(data.pronoun ?? "");
        setReplyPreference(data.replyPreference ?? "ANYONE");
      }
      report("success", fields === "avatar" ? (lang === "uk" ? "Аватар оновлено." : "Avatar updated.") : t("nameSaved"));
    } catch { report("error", t(fields === "avatar" ? "saveAvatarError" : "saveNameError")); }
    finally { if (isCurrentRequest()) setNameBusy(false); }
  };

  return {
    profile,
    setProfile,
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
    givenName,
    setGivenName,
    familyName,
    setFamilyName,
    bio,
    setBio,
    profileLocation,
    setProfileLocation,
    pronoun,
    setPronoun,
    replyPreference,
    setReplyPreference,
    avatarUrl,
    setAvatarUrl,
  };
}

export type ProfileIdentityModel = ReturnType<typeof useProfileIdentity>;
