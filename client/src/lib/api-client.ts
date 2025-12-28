// client/src/lib/api-client.ts

let accessToken: string | null = null;

const STORAGE_KEY = "access_token";

/**
 * Store token in-memory + localStorage
 */
export function setAccessToken(token: string) {
  accessToken = token;
  localStorage.setItem(STORAGE_KEY, token);
}

/**
 * Get token from memory, falling back to localStorage.
 */
export function getAccessToken(): string | null {
  if (accessToken) return accessToken;
  accessToken = localStorage.getItem(STORAGE_KEY);
  return accessToken;
}

/**
 * Clear token everywhere.
 */
export function clearAccessToken() {
  accessToken = null;
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Normalize headers into a real Headers instance and merge cleanly.
 */
function toHeaders(initHeaders?: HeadersInit): Headers {
  if (!initHeaders) return new Headers();
  if (initHeaders instanceof Headers) return new Headers(initHeaders);
  return new Headers(initHeaders);
}

/**
 * Centralized fetch wrapper:
 * - Injects Authorization: Bearer <token> globally when token exists
 * - On 401: clears token + routes to /login
 *
 * NOTE: This does not try to guess which endpoints are protected.
 * If a token exists, it gets attached. That’s usually what you want.
 */
export async function apiFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const headers = toHeaders(init.headers);

  const token = getAccessToken();
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(input, {
    ...init,
    headers,
  });

  if (res.status === 401) {
    // Token invalid/expired
    clearAccessToken();

    // Avoid redirect loops if already on login
    if (window.location.pathname !== "/login") {
      window.location.href = "/login";
    }
  }

  return res;
}
