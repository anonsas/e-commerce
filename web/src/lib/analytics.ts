type GtagArgs = unknown[];

declare global {
  interface Window {
    dataLayer: GtagArgs[];
    gtag: (...args: GtagArgs) => void;
  }
}

const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;
let initialized = false;

export function initAnalytics() {
  if (initialized || !measurementId) return;
  initialized = true;

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function () {
    // gtag.js requires the `arguments` object, not a rest array.
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer.push(arguments as unknown as GtagArgs);
  };
  window.gtag("js", new Date());
  // page views are sent manually on route change (SPA)
  window.gtag("config", measurementId, { send_page_view: false });

  document.addEventListener("click", handleClick, true);
}

export function trackPageView(path: string) {
  if (!initialized) return;
  window.gtag("event", "page_view", {
    page_path: path,
    page_location: window.location.href,
    page_title: document.title,
  });
}

export function trackEvent(name: string, params?: Record<string, unknown>) {
  if (!initialized) return;
  window.gtag("event", name, params);
}

// Tracks clicks on links/buttons. Optional data-analytics="name" overrides the label.
// Text is truncated and form values are never read, to avoid sending personal data.
function handleClick(e: MouseEvent) {
  const target = e.target;
  if (!(target instanceof Element)) return;
  const el = target.closest<HTMLElement>("a, button, [role='button'], [data-analytics]");
  if (!el) return;

  const label =
    el.dataset.analytics ??
    el.getAttribute("aria-label") ??
    el.textContent?.trim().replace(/\s+/g, " ") ??
    "";

  trackEvent("click", {
    element: el.tagName.toLowerCase(),
    label: label.slice(0, 100),
    href: el instanceof HTMLAnchorElement ? el.pathname : undefined,
    page_path: window.location.pathname,
  });
}
