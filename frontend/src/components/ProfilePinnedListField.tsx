import { useId } from "react";
import { Link } from "react-router-dom";
import type { ProfileList } from "../api/profile.api";
import { useLocale } from "../i18n";
import styles from "./ProfilePinnedListField.module.css";

interface Props {
  className?: string;
  lists: ProfileList[];
  value: number | null;
  disabled: boolean;
  onChange(value: number | null): void;
}

export default function ProfilePinnedListField(
  { lists, value, disabled, onChange, className }: Props,
) {
  const id = useId();
  const { t, path } = useLocale();
  const available = lists.filter((list) =>
    list.listType === "CUSTOM" && list.isPublic
  );
  return (
    <div className={className}>
      <label htmlFor={id}>{t("pinnedList")}</label>
      <select
        id={id}
        value={value ?? ""}
        disabled={disabled}
        aria-describedby={`${id}-hint`}
        onChange={(event) =>
          onChange(event.target.value ? Number(event.target.value) : null)}
      >
        <option value="">{t("noPinnedList")}</option>
        {available.map((list) => (
          <option key={list.id} value={list.id}>{list.name}</option>
        ))}
      </select>
      <p id={`${id}-hint`} className={styles.hint}>
        {t("pinnedListHint")}{" "}
        <Link to={path("/lists")}>{t("manageLists")}</Link>
      </p>
    </div>
  );
}
