import { useLocale } from "../../i18n";
import styles from "../Profile.module.css";
import { type ProfileIdentityModel } from "./useProfileIdentity";
import { type ProfileAccountModel } from "./useProfileAccount";

interface Props {
  identity: Pick<ProfileIdentityModel, "profile">;
  account: Pick<
    ProfileAccountModel,
    | "startSupabaseAccountLink"
    | "supabaseLinkBusy"
    | "supabaseLinkPassword"
    | "setSupabaseLinkPassword"
  >;
}

export default function ProfileHostedLinkForm({ identity, account }: Props) {
  const { profile } = identity;
  const { startSupabaseAccountLink, supabaseLinkBusy, supabaseLinkPassword, setSupabaseLinkPassword } = account;
  const { t } = useLocale();

  return profile?.supabaseLinked
    ? <section className={styles.form} aria-labelledby="supabase-link-title"><h2 id="supabase-link-title">{t("supabaseLinkTitle")}</h2><p>{t("supabaseLinkAlreadyConnected")}</p></section>
    : <form id="settings-form-supabase-link" className={styles.form} aria-labelledby="supabase-link-title" onSubmit={startSupabaseAccountLink} aria-busy={supabaseLinkBusy}>
      <h2 id="supabase-link-title">{t("supabaseLinkTitle")}</h2>
      <p>{t("supabaseLinkDescription")}</p>
      <div className={styles.passwordField}>
        <label htmlFor="supabase-link-current-password">{t("currentPassword")}</label>
        <input id="supabase-link-current-password" type="password" required disabled={supabaseLinkBusy} autoComplete="current-password" value={supabaseLinkPassword} onChange={event => setSupabaseLinkPassword(event.target.value)} />
      </div>
      <button className={styles.primaryButton} type="submit" disabled={supabaseLinkBusy}>{supabaseLinkBusy ? t("saving") : t("supabaseLinkStart")}</button>
    </form>;
}
