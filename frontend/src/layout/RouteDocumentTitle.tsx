import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/** Follow the committed screen, including asynchronous headings and query views. */
export default function RouteDocumentTitle() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    let frame = 0;
    const updateTitle = () => {
      frame = 0;
      const mains = [...document.querySelectorAll<HTMLElement>("main")].filter(main =>
        main.getClientRects().length > 0 && getComputedStyle(main).visibility !== "hidden"
        && !main.closest('[hidden], [inert], [aria-hidden="true"]'));
      if (mains.length !== 1) return;
      const main = mains[0];
      if (main.dataset.rewindRoute && main.dataset.rewindRoute !== pathname) return;
      if (main.matches('[aria-busy="true"]')) return;
      const heading = main.querySelector<HTMLHeadingElement>("h1");
      if (!heading || heading.id === "route-loading-title") return;
      const title = (main.dataset.documentTitle ?? heading.dataset.documentTitle ?? heading.textContent ?? "")
        .replace(/\s+/g, " ").trim();
      if (title && document.title !== `${title} | REWIND`) document.title = `${title} | REWIND`;
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(updateTitle);
    };
    const observer = new MutationObserver(schedule);
    observer.observe(document.body, {
      subtree: true, childList: true, characterData: true, attributes: true,
      attributeFilter: ["aria-busy", "data-document-title", "data-rewind-route", "hidden", "style"],
    });
    schedule();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [pathname, search]);

  return null;
}
