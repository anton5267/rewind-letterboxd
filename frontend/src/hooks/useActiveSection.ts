import { useEffect, useState } from "react";

interface ActiveSectionOptions {
  enabled?: boolean;
  rootMargin?: string;
  scopeKey?: string | number | null;
}

/**
 * Keeps an anchor rail synchronized with the section currently visible below
 * the fixed header. The caller still owns click behavior and visual classes.
 */
export function useActiveSection(
  sectionIds: readonly string[],
  initialSection: string,
  { enabled = true, rootMargin = "-88px 0px -55% 0px", scopeKey = null }: ActiveSectionOptions = {},
) {
  const [activeSection, setActiveSection] = useState(initialSection);

  useEffect(() => {
    setActiveSection(initialSection);
    if (!enabled || typeof IntersectionObserver === "undefined") return;
    const sections = sectionIds
      .map(sectionId => document.getElementById(sectionId))
      .filter((section): section is HTMLElement => section !== null);
    if (sections.length === 0) return;
    const observer = new IntersectionObserver((entries) => {
      const visible = entries
        .filter(entry => entry.isIntersecting)
        .sort((left, right) => left.boundingClientRect.top - right.boundingClientRect.top)[0];
      if (visible) setActiveSection(visible.target.id);
    }, { rootMargin, threshold: [0, .1, .5] });
    sections.forEach(section => observer.observe(section));
    return () => observer.disconnect();
  }, [enabled, initialSection, rootMargin, scopeKey, sectionIds]);

  return [activeSection, setActiveSection] as const;
}
