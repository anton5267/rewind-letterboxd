import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useLocale } from "../../i18n";
import { useState, useRef, useEffect } from "react";
import { isPasswordWithinByteLimit } from "../../utils/passwordValidation";
import { changePassword, deleteAccount } from "../../api/profile.api";
import { startSupabaseLink } from "../../api/auth.api";
import { type ProfileFeedbackModel } from "./useProfileFeedback";
import { type ProfileIdentityModel } from "./useProfileIdentity";

export function useProfileAccount({ feedback, identity }: {
  feedback: Pick<
    ProfileFeedbackModel,
    | "settingsFeedbackGeneration"
    | "setSettingsFeedback"
    | "setMessage"
    | "setError"
    | "activeUserId"
    | "settingsMounted"
    | "settingsFeedbackSequence"
  >;
  identity: Pick<ProfileIdentityModel, "profile">;
}) {
  const { isAuth, logout, user } = useAuth();
  const navigate = useNavigate();
  const { path, t, lang } = useLocale();
  const {
    settingsFeedbackGeneration,
    setSettingsFeedback,
    setMessage,
    setError,
    activeUserId,
    settingsMounted,
    settingsFeedbackSequence,
  } = feedback;
  const { profile } = identity;

  const [currentPassword, setCurrentPassword] = useState("");

  const [newPassword, setNewPassword] = useState("");

  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  const [supabaseLinkPassword, setSupabaseLinkPassword] = useState("");

  const [supabaseLinkBusy, setSupabaseLinkBusy] = useState(false);

  const [passwordConfirmError, setPasswordConfirmError] = useState(false);

  const [deletePassword, setDeletePassword] = useState("");

  const [passwordBusy, setPasswordBusy] = useState(false);

  const [deleteBusy, setDeleteBusy] = useState(false);

  const [accountDeletePending, setAccountDeletePending] = useState(false);

  const deleteAccountButton = useRef<HTMLButtonElement>(null);

  const [accountDeleted, setAccountDeleted] = useState(false);

  const [passwordChanged, setPasswordChanged] = useState(false);

  const passwordMutation = useRef(0);

  const supabaseLinkMutation = useRef(0);

  const deleteMutation = useRef(0);

  useEffect(() => {
    passwordMutation.current += 1;
    deleteMutation.current += 1;
    setPasswordBusy(false);
    setDeleteBusy(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmNewPassword("");
    setPasswordConfirmError(false);
  }, [isAuth, user?.id]);

  const savePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    if (passwordBusy) return;
    const scope = ++settingsFeedbackGeneration.current;
    const submitter = (event.nativeEvent as SubmitEvent).submitter;
    const origin = submitter instanceof HTMLElement ? submitter : document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setSettingsFeedback(null);
    setMessage("");
    setError("");
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
    const reportError = (text: string) => {
      if (!isCurrentRequest() || !settingsMounted.current || settingsFeedbackGeneration.current !== scope) return;
      setMessage("");
      setError(text);
      setSettingsFeedback({ id: ++settingsFeedbackSequence.current, origin, kind: "error" });
    };
    setPasswordBusy(true);
    setPasswordConfirmError(false);
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
        reportError(t("passwordChangedLogoutError"));
      }
    } catch { reportError(t("changePasswordError")); }
    finally { if (isCurrentRequest()) setPasswordBusy(false); }
  };

  const startSupabaseAccountLink = async (event: React.FormEvent) => {
    event.preventDefault();
    if (supabaseLinkBusy || !profile || profile.supabaseLinked) return;
    const requestId = ++supabaseLinkMutation.current;
    const requestUserId = activeUserId.current;
    const origin = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const isCurrentRequest = () => settingsMounted.current && requestUserId !== null
      && activeUserId.current === requestUserId && supabaseLinkMutation.current === requestId;
    setSupabaseLinkBusy(true);
    setSettingsFeedback(null);
    setMessage("");
    setError("");
    try {
      await startSupabaseLink(supabaseLinkPassword, lang);
      if (!isCurrentRequest()) return;
      setSupabaseLinkPassword("");
      setMessage(t("supabaseLinkEmailSent"));
      setSettingsFeedback({ id: ++settingsFeedbackSequence.current, origin, kind: "success" });
    } catch {
      if (!isCurrentRequest()) return;
      setError(t("supabaseLinkStartError"));
      setSettingsFeedback({ id: ++settingsFeedbackSequence.current, origin, kind: "error" });
    } finally {
      if (isCurrentRequest()) setSupabaseLinkBusy(false);
    }
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

  return {
    accountDeleted,
    passwordChanged,
    savePassword,
    passwordBusy,
    currentPassword,
    setCurrentPassword,
    newPassword,
    setNewPassword,
    setPasswordConfirmError,
    confirmNewPassword,
    setConfirmNewPassword,
    passwordConfirmError,
    startSupabaseAccountLink,
    supabaseLinkBusy,
    supabaseLinkPassword,
    setSupabaseLinkPassword,
    deleteBusy,
    removeAccount,
    deletePassword,
    setDeletePassword,
    deleteAccountButton,
    accountDeletePending,
    setAccountDeletePending,
    confirmRemoveAccount,
  };
}

export type ProfileAccountModel = ReturnType<typeof useProfileAccount>;
