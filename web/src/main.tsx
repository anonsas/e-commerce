import { StrictMode } from "react";
import * as Sentry from "@sentry/react";
import { ClerkProvider } from "@clerk/react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import "./index.css";
import { App } from "./App";
import { BrowserRouter } from "react-router";
import { SentryErrorFallback, SentryUserSync } from "@components";

// Restore saved theme before first render to avoid a flash of the wrong theme.
const savedTheme = localStorage.getItem("theme");
if (savedTheme) document.documentElement.dataset.theme = savedTheme;

const queryClient = new QueryClient();
const apiUrl = import.meta.env.VITE_API_URL ?? "";
const tracePropagationTargets =
  apiUrl.length > 0 ? [apiUrl] : typeof window !== "undefined" ? [window.location.origin] : [];

/* browserTracingIntegration(), lets Sentry see things like:
    - page laod timing
    - route / navigation timing
    - slow frontend interactions
    - outgoing fetch / API requests
    - frontend-to-backend trace linking
*/
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration({ maskAllText: false, maskAllInputs: false, blockAllMedia: false }),
  ],
  tracesSampleRate: 1.0, // in prod 0.1-0.5
  replaysSessionSampleRate: 1.0, // in prod 0.1-0.5
  replaysOnErrorSampleRate: 1.0, // in prod 0.1-0.5
  tracePropagationTargets: tracePropagationTargets,
  enableLogs: true,
  dataCollection: {
    // userInfo is the only field off by default; all others (cookies, headers, bodies, query params) default to true.
    userInfo: true,
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ClerkProvider>
      <SentryUserSync />
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Sentry.ErrorBoundary fallback={<SentryErrorFallback />}>
            <App />
          </Sentry.ErrorBoundary>
        </BrowserRouter>
      </QueryClientProvider>
    </ClerkProvider>
  </StrictMode>,
);
