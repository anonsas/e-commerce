import { useEffect } from "react";
import { useLocation } from "react-router";
import { initAnalytics, trackPageView } from "@lib";

/** loads Google Analytics and reports a page view on every route change. */
export function AnalyticsTracker() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    initAnalytics();
  }, []);

  useEffect(() => {
    trackPageView(pathname + search);
  }, [pathname, search]);

  return null;
}
