import { useId } from "react";
import { useLocale } from "../i18n";
import styles from "./ProfileNameFields.module.css";

interface Props {
  className?: string;
  givenName: string;
  familyName: string;
  disabled: boolean;
  onGivenName: (value: string) => void;
  onFamilyName: (value: string) => void;
}

export default function ProfileNameFields({ givenName, familyName, disabled, onGivenName, onFamilyName, className = "" }: Props) {
  const { t } = useLocale();
  const id = useId();
  return <div className={`${styles.fields} ${className}`} data-profile-name-fields>
    <div className={styles.field}>
      <label htmlFor={`${id}-given-name`}>{t("givenName")}</label>
      <input id={`${id}-given-name`} value={givenName} maxLength={80} autoComplete="given-name" disabled={disabled} onChange={event => onGivenName(event.target.value)} />
    </div>
    <div className={styles.field}>
      <label htmlFor={`${id}-family-name`}>{t("familyName")}</label>
      <input id={`${id}-family-name`} value={familyName} maxLength={80} autoComplete="family-name" disabled={disabled} onChange={event => onFamilyName(event.target.value)} />
    </div>
  </div>;
}
