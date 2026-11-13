import { useLocale } from "../../i18n";
import styles from "../Profile.module.css";
import { MAX_PASSWORD_BYTES, isPasswordWithinByteLimit } from "../../utils/passwordValidation";
import { type ProfileAccountModel } from "./useProfileAccount";
import { type ProfileFeedbackModel } from "./useProfileFeedback";

interface Props {
  account: Pick<
    ProfileAccountModel,
    | "savePassword"
    | "passwordBusy"
    | "currentPassword"
    | "setCurrentPassword"
    | "newPassword"
    | "setNewPassword"
    | "setPasswordConfirmError"
    | "confirmNewPassword"
    | "setConfirmNewPassword"
    | "passwordConfirmError"
  >;
  feedback: Pick<ProfileFeedbackModel, "setError" | "error">;
}

export default function ProfilePasswordForm({ account, feedback }: Props) {
  const {
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
  } = account;
  const { setError, error } = feedback;
  const { t } = useLocale();

  return <form id="settings-form-authentication" className={styles.form} aria-labelledby="profile-password-form-title" onSubmit={savePassword} aria-busy={passwordBusy}>
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
}
