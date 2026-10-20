import { useRef, type KeyboardEvent } from "react";

type TabDirection = "next" | "previous" | "first" | "last";

export function useRovingTabs<T extends string>(tabs: readonly T[], onSelect: (tab: T) => void) {
  const tabRefs = useRef<Partial<Record<T, HTMLButtonElement | null>>>({});

  const setTabRef = (tab: T) => (button: HTMLButtonElement | null) => {
    tabRefs.current[tab] = button;
  };

  const moveTab = (current: T, direction: TabDirection) => {
    const currentIndex = tabs.indexOf(current);
    const nextIndex = direction === "first"
      ? 0
      : direction === "last"
        ? tabs.length - 1
        : (currentIndex + (direction === "next" ? 1 : -1) + tabs.length) % tabs.length;
    const next = tabs[nextIndex];
    onSelect(next);
    requestAnimationFrame(() => tabRefs.current[next]?.focus());
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, current: T) => {
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      moveTab(current, "next");
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      moveTab(current, "previous");
    } else if (event.key === "Home") {
      event.preventDefault();
      moveTab(current, "first");
    } else if (event.key === "End") {
      event.preventDefault();
      moveTab(current, "last");
    }
  };

  return { setTabRef, handleKeyDown };
}
