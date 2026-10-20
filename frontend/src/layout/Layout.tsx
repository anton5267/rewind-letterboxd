import { useLayoutEffect, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function Layout({
  children,
}: {
  children: ReactNode;
}) {
  const { pathname } = useLocation();
  useLayoutEffect(() => {
    const markScreen = () => {
      const mains = [...document.querySelectorAll<HTMLElement>("main")].filter(main =>
        main.getClientRects().length > 0 && getComputedStyle(main).visibility !== "hidden"
        && !main.closest('[hidden], [inert], [aria-hidden="true"]') && !main.querySelector("#route-loading-title"));
      if (mains.length !== 1) return;
      mains[0].dataset.rewindRoute = pathname;
      observer.disconnect();
    };
    // A resolved lazy subtree can still be hidden during its layout-effect pass.
    const observer = new MutationObserver(markScreen);
    observer.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ["hidden", "style"] });
    const frame = requestAnimationFrame(markScreen);
    return () => { cancelAnimationFrame(frame); observer.disconnect(); };
  }, [pathname]);
  return (
    <>
      <Header />
      {children}
      <Footer />
    </>
  );
}
