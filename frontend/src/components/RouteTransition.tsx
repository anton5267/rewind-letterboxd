import { useEffect, useRef } from "react";
import { useLocation, useNavigationType } from "react-router-dom";
import styles from "./RouteTransition.module.css";

function visible(element: HTMLElement) {
  if (element.closest('[hidden], [inert], [aria-hidden="true"]')) return false;
  const style = getComputedStyle(element);
  const bounds = element.getBoundingClientRect();
  return style.display !== "none" && style.visibility !== "hidden" && bounds.width > 1 && bounds.height > 1;
}

/** Forward screen navigation starts at its content; native history/anchors stay intact. */
export default function RouteTransition() {
  const location = useLocation();
  const navigationType = useNavigationType();
  const previousPath = useRef(location.pathname);
  const hasReadyScreen = useRef(false);

  useEffect(() => {
    const pathnameChanged = previousPath.current !== location.pathname;
    previousPath.current = location.pathname;
    // Initial redirects are still an initial page load. A user PUSH is a new
    // screen even if the first screen's data request has not finished yet.
    const focusNewScreen = pathnameChanged && navigationType !== "POP" && !location.hash
      && (hasReadyScreen.current || navigationType === "PUSH");
    let frame = 0;
    let cancelled = false;

    const check = () => {
      frame = 0;
      if (cancelled) return;
      // Suspense can retain the old main with display:none alongside its fallback.
      const mains = [...document.querySelectorAll<HTMLElement>("main")].filter(visible);
      if (mains.length !== 1) return;
      const main = mains[0];
      // Layout stamps the pathname only when that screen commits. This also
      // identifies a reused Details component whose next film has the same title.
      if (main.dataset.rewindRoute !== location.pathname) return;
      const heading = main.querySelector<HTMLHeadingElement>("h1");
      if (!heading || heading.id === "route-loading-title" || main.matches('[aria-busy="true"]')
        || main.querySelector('[aria-busy="true"]')) {
        return;
      }
      hasReadyScreen.current = true;
      observer.disconnect();
      if (!focusNewScreen) return;
      // Error/empty routes may intentionally use a visually hidden h1 to name main.
      const target = visible(heading) ? heading : main;
      if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
      target.classList.add(styles.focusTarget);
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      target.focus({ preventScroll: true });
    };
    const schedule = () => {
      if (!cancelled && !frame) frame = requestAnimationFrame(() => {
        if (!cancelled) frame = requestAnimationFrame(check);
      });
    };
    const observer = new MutationObserver(schedule);
    observer.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ["aria-busy", "data-rewind-route", "hidden", "style"] });
    // Let child loading effects and mobile-menu focus restoration settle first.
    schedule();
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [location.key, location.pathname, location.hash, navigationType]);

  return null;
}
