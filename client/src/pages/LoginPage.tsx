// client/src/pages/LoginPage.tsx

import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";

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
    <div style={{ padding: 24, maxWidth: 400 }}>
      <h1>Login</h1>

      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button type="submit" disabled={isLoggingIn}>
          {isLoggingIn ? "Logging in…" : "Login"}
        </button>

        {error && <p style={{ color: "red" }}>{error}</p>}
      </form>
    </div>
  );
}
