import * as Sentry from "@sentry/react";

// Strip trailing slashes so we can safely concatenate paths like "/api/products".
const apiBaseUrl =
  typeof import.meta.env.VITE_API_URL === "string"
    ? import.meta.env.VITE_API_URL.replace(/\/+$/, "")
    : "";

// Wrapper around fetch for all calls to our backend API.
// Handles auth token injection, JSON serialisation, and Sentry error reporting.
export async function apiFetch<T = unknown>(
  path: string,
  opts: {
    method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
    getToken?: () => Promise<string | null>;
    body?: unknown;
  } = {},
): Promise<T> {
  const { getToken, method = "GET", body } = opts;
  const headers: Record<string, string> = { "Content-Type": "application/json" };

  // Attach the Clerk JWT if a token getter was provided.
  if (getToken) {
    const token = await getToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (networkError) {
    // The request never reached the server (offline, DNS failure, etc.).
    Sentry.addBreadcrumb({
      category: "api",
      message: `${method} ${path}`,
      level: "error",
      data: { network: true },
    });

    Sentry.captureException(networkError, {
      tags: { "api.fetch": "network" },
      extra: { path, method },
    });

    throw networkError;
  }

  const data = await response.json();

  // Record every API call in the Sentry breadcrumb trail for debugging context.
  Sentry.addBreadcrumb({
    category: "api",
    message: `${method} ${path}`,
    level: response.ok ? "info" : "warning",
    data: { status: response.status },
  });

  if (!response.ok) {
    const errorMessage = typeof data?.error === "string" ? data.error : response.statusText;
    const error = new Error(errorMessage || "Request failed");

    // Only send 5xx errors to Sentry — 4xx errors are expected user-facing failures.
    if (response.status >= 500) {
      Sentry.captureException(error, {
        tags: { "api.fetch": "http", "http.status": String(response.status) },
        extra: { path, method, status: response.status },
      });
    }

    throw error;
  }

  return data;
}
