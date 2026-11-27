import { useLocale } from "../../i18n";

interface Props {
  className?: string;
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
}

export default function ProfileWebsiteField({ value, disabled, onChange, className = "" }: Props) {
  const { t } = useLocale();
  return <div className={className}>
    <label htmlFor="settings-profile-website">{t("socialWebsite")}</label>
    <input id="settings-profile-website" type="url" autoComplete="url" maxLength={255} placeholder="https://…" value={value} disabled={disabled} onChange={event => onChange(event.target.value)} />
  </div>;
}
