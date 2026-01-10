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

  // ✅ Prefix backend base URL for relative paths like "/auth/login"
  const baseUrl = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") || "";
  const url =
    typeof input === "string" && input.startsWith("/")
      ? `${baseUrl}${input}`
      : input;

  const method = init.method || "GET";
  
  // Log request
  console.log(`[api] REQUEST ${method} ${url}`);
  if (init.body) {
    if (init.body instanceof FormData) {
      console.log(`[api] REQUEST BODY ${method} ${url} -> [FormData]`);
    } else {
      console.log(`[api] REQUEST BODY ${method} ${url} -> ${init.body}`);
    }
  }

  const res = await fetch(url, {
    ...init,
    headers,
  });

  // Log response
  console.log(`[api] RESPONSE ${method} ${url} -> ${res.status}`);
  
  // Clone response to read body for logging without consuming original
  const clone = res.clone();
  try {
    const responseText = await clone.text();
    if (responseText) {
      try {
        const responseJson = JSON.parse(responseText);
        console.log(`[api] RESPONSE BODY ${method} ${url} ->`, responseJson);
      } catch {
        console.log(`[api] RESPONSE BODY ${method} ${url} -> ${responseText}`);
      }
    }
  } catch (error) {
    console.log(`[api] RESPONSE BODY ${method} ${url} -> [Error reading response]`);
  }

  if (res.status === 401 || res.status === 403) {
    // Token invalid/expired or forbidden - treat both as unauthenticated
    clearAccessToken();

    // Use proper SPA navigation instead of window.location.href
    // Avoid redirect loops if already on login
    if (window.location.pathname !== "/login") {
      // For SPA routing, we'll dispatch a custom event that the app can listen to
      window.dispatchEvent(new CustomEvent('auth-redirect', { detail: '/login' }));
    }
  }

  return res;
}

/**
 * Convert asset paths to full URLs.
 * - If the path is already a full URL (starts with http/https), return as-is
 * - If the path starts with /assets, prepend the API base URL
 * - Otherwise, return the path unchanged
 */
export function getFullAssetUrl(assetPath: string | null | undefined): string {
  if (!assetPath) return '';

  // If already a full URL, return as-is
  if (assetPath.startsWith('http://') || assetPath.startsWith('https://')) {
    return assetPath;
  }

  // If it's an /assets path, prepend the API domain
  if (assetPath.startsWith('/assets')) {
    const baseUrl = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") || "";
    return `${baseUrl}${assetPath}`;
  }

  return assetPath;
}
