import type { InvalidEvent } from "react";

export function scrollInvalidFieldIntoView(event: InvalidEvent<HTMLFormElement>) {
  const field = event.target;
  if (!(field instanceof HTMLElement)) return;
  const form = event.currentTarget;
  if (form.dataset.invalidFieldScrollScheduled) return;
  form.dataset.invalidFieldScrollScheduled = "true";

  window.setTimeout(() => {
    delete form.dataset.invalidFieldScrollScheduled;
    if (!field.isConnected) return;
    const headerBottom = document.querySelector("header")?.getBoundingClientRect().bottom ?? 0;
    const targetTop = headerBottom + 16;
    const fieldTop = field.getBoundingClientRect().top;
    window.scrollTo({ top: Math.max(0, window.scrollY + fieldTop - targetTop), behavior: "instant" });
  }, 50);
}
