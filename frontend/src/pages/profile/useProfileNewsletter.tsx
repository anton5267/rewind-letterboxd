import { useAuth } from "../../context/AuthContext";
import { useLocation } from "react-router-dom";
import { useLocale } from "../../i18n";
import { useState, useRef, useLayoutEffect, useEffect } from "react";
import { getNewsletterSubscription, updateNewsletterSubscription } from "../../api/newsletter.api";
import { type ProfileFeedbackModel } from "./useProfileFeedback";

export function useProfileNewsletter({ feedback }: {
  feedback: Pick<ProfileFeedbackModel, "activeUserId" | "setError" | "setMessage">;
}) {
  const { isAuth, user } = useAuth();
  const location = useLocation();
  const { t, lang } = useLocale();
  const { activeUserId, setError, setMessage } = feedback;

  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);

  const [newsletterLoading, setNewsletterLoading] = useState(false);

  const [newsletterLoadError, setNewsletterLoadError] = useState(false);

  const [newsletterAttempt, setNewsletterAttempt] = useState(0);

  const [newsletterBusy, setNewsletterBusy] = useState(false);

  const [newsletterRetry, setNewsletterRetry] = useState<boolean | null>(null);

  const [newsletterSaveError, setNewsletterSaveError] = useState(false);

  const newsletterLoadRequest = useRef(0);

  const newsletterFocusScope = JSON.stringify([location.key, lang, isAuth, user?.id ?? null]);

  const currentNewsletterFocusScope = useRef(newsletterFocusScope);

  currentNewsletterFocusScope.current = newsletterFocusScope;

  const pendingNewsletterFocus = useRef<{ origin: HTMLElement | null; scope: string; target: "load" | "save"; request: number; attempt?: number } | null>(null);

  useLayoutEffect(() => {
    if (pendingNewsletterFocus.current?.scope !== newsletterFocusScope) pendingNewsletterFocus.current = null;
  }, [newsletterFocusScope]);

  const newsletterMutation = useRef(0);

  useEffect(() => {
    newsletterMutation.current += 1;
    setNewsletterBusy(false);
  }, [isAuth, user?.id]);

  useEffect(() => {
    if (!isAuth) return;
    let current = true;
    const request = ++newsletterLoadRequest.current;
    const isCurrentRequest = () => current && newsletterLoadRequest.current === request;
    setNewsletterLoading(true);
    setNewsletterLoadError(false);
    getNewsletterSubscription().then(({ data }) => { if (isCurrentRequest()) { setNewsletterSubscribed(data.subscribed); setNewsletterRetry(null); setNewsletterSaveError(false); } })
      .catch(() => { if (isCurrentRequest()) setNewsletterLoadError(true); })
      .finally(() => { if (isCurrentRequest()) setNewsletterLoading(false); });
    return () => { current = false; };
  }, [isAuth, newsletterAttempt, user?.id]);

  useEffect(() => {
    const pending = pendingNewsletterFocus.current;
    const requestMatches = pending?.target === "load"
      ? pending.request === newsletterLoadRequest.current && pending.attempt === newsletterAttempt && !newsletterLoading
      : pending?.target === "save" && pending.request === newsletterMutation.current && !newsletterBusy;
    if (!pending || !requestMatches || pending.scope !== currentNewsletterFocusScope.current) return;
    const frame = window.requestAnimationFrame(() => {
      if (pendingNewsletterFocus.current !== pending) return;
      pendingNewsletterFocus.current = null;
      if (pending.scope !== currentNewsletterFocusScope.current) return;
      const active = document.activeElement;
      if (active !== document.body && active !== pending.origin) return;
      if ((pending.target === "load" && newsletterLoadError) || (pending.target === "save" && newsletterSaveError)) {
        document.querySelector<HTMLButtonElement>('[aria-labelledby="newsletter-settings"] [data-retry-button]:not(:disabled)')?.focus();
      } else document.getElementById("newsletter-settings")?.focus();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [newsletterAttempt, newsletterLoading, newsletterLoadError, newsletterBusy, newsletterSaveError, newsletterSubscribed, newsletterRetry, location.key, lang, isAuth, user?.id]);

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
    if (newsletterRetry !== null) {
      pendingNewsletterFocus.current = { origin: document.activeElement instanceof HTMLElement ? document.activeElement : null, scope: currentNewsletterFocusScope.current, target: "save", request: newsletterMutation.current + 1 };
      void toggleNewsletter(newsletterRetry);
    }
  };

  return {
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
  };
}

export type ProfileNewsletterModel = ReturnType<typeof useProfileNewsletter>;
