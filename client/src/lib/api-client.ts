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

  // Handle URL construction:
  // - /api/* paths: use as-is (Vite proxy handles them)
  // - other paths: prefix with VITE_API_BASE_URL
  let url: RequestInfo | URL;
  if (typeof input === "string") {
    if (input.startsWith("/api/")) {
      // Use /api paths as-is - Vite proxy will handle them
      url = input;
    } else if (input.startsWith("/")) {
      // Prefix other relative paths with backend base URL
      const baseUrl = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") || "";
      url = `${baseUrl}${input}`;
    } else {
      // Absolute URLs or other formats - use as-is
      url = input;
    }
  } else {
    url = input;
  }

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
