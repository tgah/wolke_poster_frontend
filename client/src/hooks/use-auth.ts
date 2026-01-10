// client/src/hooks/use-auth.ts

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, type LoginInput } from "@/types/api";
import { useLocation } from "wouter";
import { setAccessToken, clearAccessToken, apiFetch } from "@/lib/api-client";

async function parseJsonSafely(res: Response) {
  const text = await res.text();
  if (!text) return { text: "", json: null };
  try {
    return { text, json: JSON.parse(text) };
  } catch {
    return { text, json: null };
  }
}

export function useAuth() {
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  // Fetch current user session
  const userQuery = useQuery({
    queryKey: [api.auth.me.path],
    queryFn: async () => {
      const res = await apiFetch(api.auth.me.path, { method: "GET" });

      // apiFetch handles 401/403 redirect + token clearing globally.
      if (!res.ok) {
        // For non-401/403 errors, surface something useful
        const { text, json } = await parseJsonSafely(res);
        const msg =
          json?.message ||
          json?.error ||
          text ||
          res.statusText;
        throw new Error(`${res.status}: ${msg}`);
      }

      return (await res.json()) as unknown;
    },
    // If /auth/me fails due to auth, the app should treat user as logged out.
    retry: false,
  });

  // Login: POST /auth/login -> store token -> GET /auth/me -> populate cache -> go home
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginInput) => {
      const res = await apiFetch(api.auth.login.path, {
        method: api.auth.login.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });

      if (!res.ok) {
        const { text, json } = await parseJsonSafely(res);
        const msg =
          json?.message ||
          json?.error ||
          text ||
          res.statusText;
        throw new Error(`${res.status}: ${msg}`);
      }

      const data = (await res.json()) as { access_token: string; token_type?: string };

      if (!data?.access_token) {
        throw new Error("Login succeeded but no access_token was returned.");
      }

      // Store token
      setAccessToken(data.access_token);

      // Immediately fetch /auth/me to populate user state
      const meRes = await apiFetch(api.auth.me.path, { method: "GET" });
      if (!meRes.ok) {
        const { text, json } = await parseJsonSafely(meRes);
        const msg =
          json?.message ||
          json?.error ||
          text ||
          meRes.statusText;

        // If we can't verify session, treat it as invalid
        clearAccessToken();
        throw new Error(`${meRes.status}: ${msg}`);
      }

      const me = (await meRes.json()) as unknown;
      return me;
    },
    onSuccess: (me) => {
      // Populate the user query cache directly
      queryClient.setQueryData([api.auth.me.path], me);

      // Move user into the app
      setLocation("/");
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      // Backend may or may not require this; still fine to call.
      // Even if it fails, we still clear local session.
      try {
        await apiFetch(api.auth.logout.path, { method: api.auth.logout.method });
      } catch {
        // ignore
      }

      clearAccessToken();
      queryClient.clear();
      setLocation("/login");
    },
  });

  return {
    user: userQuery.data,
    isLoading: userQuery.isLoading,
    login: loginMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    logout: logoutMutation.mutate,
  };
}
