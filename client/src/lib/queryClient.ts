// client/src/lib/queryClient.ts

import { QueryClient } from "@tanstack/react-query";
import { apiFetch } from "./api-client";

/**
 * Safe JSON parsing helper.
 */
async function parseJsonSafely(res: Response) {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/**
 * Unified API request helper for mutations / imperative calls.
 * Always uses apiFetch so:
 * - Bearer token is injected
 * - 401 clears token + redirects to /login
 */
export async function apiRequest<T = unknown>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await apiFetch(url, options);

  if (!res.ok) {
    const payload = await parseJsonSafely(res);
    const msg =
      payload?.message ||
      payload?.error ||
      (await res.text()) ||
      res.statusText;

    throw new Error(`${res.status}: ${msg}`);
  }

  // Some endpoints return no body (204)
  if (res.status === 204) {
    return undefined as T;
  }

  return (await res.json()) as T;
}

/**
 * React Query client with sensible defaults.
 * Queries retry only on non-auth failures.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        // Don't retry auth failures
        if (error?.message?.startsWith("401")) return false;
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
});
