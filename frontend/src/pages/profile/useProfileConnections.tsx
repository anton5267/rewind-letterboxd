import { useAuth } from "../../context/AuthContext";
import { useLocation } from "react-router-dom";
import { useLocale, type TranslationKey } from "../../i18n";
import { useState, useRef, useLayoutEffect, useEffect } from "react";
import { getSocialLinks, updateSocialLinks, type SocialLink } from "../../api/profile.api";
import { safeHttpUrl } from "../../utils/externalUrl";
import { type ProfileRoute } from "./profileRoute";
import { type ProfileFeedbackModel } from "./useProfileFeedback";
import { SocialLinkPlatform, socialLinkPlatforms } from "./profileConstants";

export function useProfileConnections({ route, feedback }: {
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

  const [socialLinkValues, setSocialLinkValues] = useState<Record<SocialLinkPlatform, string>>({ website: "", instagram: "", tiktok: "", letterboxd: "" });

  const [savedSocialLinks, setSavedSocialLinks] = useState<{ userId: number | null; links: SocialLink[] } | null>(null);

  const [socialLinksLoading, setSocialLinksLoading] = useState(false);

  const [socialLinksError, setSocialLinksError] = useState(false);

  const [socialLinksAttempt, setSocialLinksAttempt] = useState(0);

  const socialLinksRequest = useRef(0);

  const socialLinksFocusScope = JSON.stringify([location.key, lang, isAuth, user?.id ?? null, settingsTab]);

  const currentSocialLinksFocusScope = useRef(socialLinksFocusScope);

  currentSocialLinksFocusScope.current = socialLinksFocusScope;

  const pendingSocialLinksFocus = useRef<{ origin: HTMLElement | null; attempt: number; scope: string; request: number } | null>(null);

  useLayoutEffect(() => {
    if (pendingSocialLinksFocus.current?.scope !== socialLinksFocusScope) pendingSocialLinksFocus.current = null;
  }, [socialLinksFocusScope]);

  const [socialLinksBusy, setSocialLinksBusy] = useState(false);

  const socialLinksMutation = useRef(0);

  const socialLinkLabelKeys: Record<SocialLinkPlatform, TranslationKey> = { website: "socialWebsite", instagram: "socialInstagram", tiktok: "socialTiktok", letterboxd: "socialLetterboxd" };

  const applySocialLinks = (data: SocialLink[]) => {
    setSavedSocialLinks({ userId: user?.id ?? null, links: data });
    setSocialLinkValues({
      website: data.find(link => link.platform === "website")?.url ?? "",
      instagram: data.find(link => link.platform === "instagram")?.url ?? "",
      tiktok: data.find(link => link.platform === "tiktok")?.url ?? "",
      letterboxd: data.find(link => link.platform === "letterboxd")?.url ?? "",
    });
  };

  useEffect(() => {
    socialLinksMutation.current += 1;
    setSocialLinksBusy(false);
  }, [isAuth, user?.id]);

  useEffect(() => {
    if (!isAuth) return;
    let current = true;
    const request = ++socialLinksRequest.current;
    const isCurrentRequest = () => current && socialLinksRequest.current === request;
    setSocialLinksLoading(true);
    setSocialLinksError(false);
    getSocialLinks().then(({ data }) => {
      if (!isCurrentRequest()) return;
      applySocialLinks(data);
    }).catch(() => { if (isCurrentRequest()) setSocialLinksError(true); })
      .finally(() => { if (isCurrentRequest()) setSocialLinksLoading(false); });
    return () => { current = false; };
  }, [isAuth, socialLinksAttempt, user?.id]);

  useEffect(() => {
    const pending = pendingSocialLinksFocus.current;
    if (!pending || pending.attempt !== socialLinksAttempt || pending.scope !== currentSocialLinksFocusScope.current || pending.request !== socialLinksRequest.current || socialLinksLoading) return;
    const frame = window.requestAnimationFrame(() => {
      if (pendingSocialLinksFocus.current !== pending) return;
      pendingSocialLinksFocus.current = null;
      if (pending.scope !== currentSocialLinksFocusScope.current || pending.request !== socialLinksRequest.current) return;
      const active = document.activeElement;
      if (active !== document.body && active !== pending.origin) return;
      if (socialLinksError) {
        const root = settingsTab ? '[aria-labelledby="account-settings-title"]' : '[aria-labelledby="social-links-settings"]';
        document.querySelector<HTMLElement>(`${root} [data-retry-button]:not(:disabled)`)?.focus();
      } else {
        [...document.querySelectorAll<HTMLElement>("#social-links-settings")].find(heading => heading.getClientRects().length > 0)?.focus();
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, [socialLinksAttempt, socialLinksError, socialLinksLoading, socialLinkValues, settingsTab, location.key, lang, isAuth, user?.id]);

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

  return {
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
  };
}

export type ProfileConnectionsModel = ReturnType<typeof useProfileConnections>;
