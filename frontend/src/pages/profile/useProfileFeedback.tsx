import { useAuth } from "../../context/AuthContext";
import { useLocale } from "../../i18n";
import { useState, useRef, useLayoutEffect } from "react";
import { type ProfileSettingsFeedback } from "../../components/ProfileSettingsShell";
import { type ProfileRoute } from "./profileRoute";

export function useProfileFeedback({ route }: {
  route: Pick<ProfileRoute, "settingsTab" | "profileView">;
}) {
  const { user } = useAuth();
  const { lang } = useLocale();
  const { settingsTab, profileView } = route;

  const [message, setMessage] = useState("");

  const [settingsFeedback, setSettingsFeedback] = useState<ProfileSettingsFeedback | null>(null);

  const [error, setError] = useState("");

  const activeUserId = useRef<number | null>(null);

  const settingsMounted = useRef(false);

  const settingsFeedbackGeneration = useRef(0);

  const settingsFeedbackSequence = useRef(0);

  activeUserId.current = user?.id ?? null;

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

  return {
    activeUserId,
    setError,
    settingsFeedbackGeneration,
    settingsMounted,
    setMessage,
    setSettingsFeedback,
    settingsFeedbackSequence,
    error,
    message,
    settingsFeedback,
  };
}

export type ProfileFeedbackModel = ReturnType<typeof useProfileFeedback>;
