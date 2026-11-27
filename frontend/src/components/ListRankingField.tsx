import { useId } from "react";
import { useLocale } from "../i18n";
import styles from "./ListRankingField.module.css";

interface Props {
  checked: boolean;
  disabled: boolean;
  icon?: string;
  compact?: boolean;
  compactLabel?: string;
  label?: string;
  onChange: (value: boolean) => void;
}

export default function ListRankingField({ checked, disabled, icon, compact = false, compactLabel, label, onChange }: Props) {
  const { t } = useLocale();
  const hintId = useId();
  return <label className={`${styles.field} ${compact ? styles.compactField : ""}`}>
    <input className={compact ? "srOnly" : undefined} type="checkbox" data-list-field="ranking" aria-label={t("rankedList")} checked={checked} disabled={disabled} aria-describedby={hintId} onChange={event => onChange(event.target.checked)} />
    {icon && <img src={icon} alt="" width={18} height={18} />}
    <span>{compact ? compactLabel ?? t("rankedList") : label ?? t("rankedList")}</span>
    <span id={hintId} className={compact ? "srOnly" : styles.hint}>{t("rankedListHint")}</span>
  </label>;
}
