// client/src/pages/LoginPage.tsx

import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Cloud } from "lucide-react";

export default function LoginPage() {
  const { login, isLoggingIn } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    login(
      { email, password },
      {
        onError: (err: any) => {
          setError(err?.message || "Login failed");
        },
      }
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 relative overflow-hidden">
      {/* Decorative background blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-teal-400/20 rounded-full blur-3xl" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/20 rounded-full blur-3xl" />

      {/* Login card */}
      <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-2xl border border-slate-100 relative z-10">
        {/* Header / Branding */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/30">
              <Cloud className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-display font-bold text-slate-900">
              Wolke AI
            </span>
          </div>
          <p className="text-slate-500 text-center">
            Sign in to continue
          </p>
        </div>

        {/* Login form (logic unchanged) */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full h-11 px-4 rounded-lg border border-input text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full h-11 px-4 rounded-lg border border-input text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />

          <button
            type="submit"
            disabled={isLoggingIn}
            className="w-full h-11 rounded-lg bg-primary text-white text-base font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoggingIn ? "Signing in…" : "Sign In"}
          </button>

          {error && (
            <p className="text-sm text-red-600 text-center">{error}</p>
          )}
        </form>
      </div>
    </div>
  );
}
