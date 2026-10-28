import { useState, type InvalidEvent } from "react";
import { useLocale } from "../i18n";
import { scrollInvalidFieldIntoView } from "./scrollInvalidField";

type FieldIssue = { key: "authFieldRequired" | "authEmailInvalid" | "authFieldMinLength" | "authFieldInvalid"; min: number };

function issueFor(field: HTMLInputElement): FieldIssue | null {
  if (field.validity.valid) return null;
  return {
    key: field.validity.valueMissing ? "authFieldRequired" : field.validity.typeMismatch && field.type === "email" ? "authEmailInvalid" : field.validity.tooShort ? "authFieldMinLength" : "authFieldInvalid",
    min: field.minLength,
  };
}

/** Keep browser constraints, but show their result inline in the active UI language. */
export function useAuthFieldValidation() {
  const { t } = useLocale();
  const [issues, setIssues] = useState<Record<string, FieldIssue | null>>({});
  const message = (id: string) => issues[id] ? t(issues[id]!.key).replace("{min}", String(issues[id]!.min)) : null;
  return {
    message,
    invalid: (id: string) => Boolean(issues[id]),
    describedBy: (id: string, other?: string) => [issues[id] ? `${id}-validation` : null, other].filter(Boolean).join(" ") || undefined,
    onInvalid: (event: InvalidEvent<HTMLFormElement>) => {
      const field = event.target;
      if (!(field instanceof HTMLInputElement)) return;
      event.preventDefault();
      const issue = issueFor(field);
      setIssues(previous => ({ ...previous, [field.id]: issue }));
      if (event.currentTarget.querySelector(":invalid") === field) field.focus({ preventScroll: true });
      scrollInvalidFieldIntoView(event);
    },
    onInput: (field: HTMLInputElement) => {
      const issue = issueFor(field);
      setIssues(previous => previous[field.id] ? { ...previous, [field.id]: issue } : previous);
    },
  };
}
