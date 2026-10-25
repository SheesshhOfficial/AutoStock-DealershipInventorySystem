import { useCallback, useEffect, useRef, useState } from "react";
import { apiRequest } from "./api";
import type { Session, User } from "./types";
import { AuthScreen } from "./components/AuthScreen";
import { InventoryWorkspace } from "./components/InventoryWorkspace";
const TOKEN_KEY = "autostock.access-token";
// Session storage is tab-limited but vulnerable to XSS. Production should consider
// HttpOnly cookies + CSRF protection and a strict Content Security Policy.
export default function App() {
  const [token, setToken] = useState<string | null>(() =>
    sessionStorage.getItem(TOKEN_KEY),
  );
  const activeToken = useRef(token);
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(Boolean(token));
  const [error, setError] = useState("");
  const logout = useCallback(() => {
    activeToken.current = null;
    sessionStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
    setChecking(false);
    setError("");
  }, []);
  useEffect(() => {
    function handleExpired(event: Event) {
      const failedToken = (event as CustomEvent<{ token: string }>).detail
        ?.token;
      if (failedToken && failedToken === activeToken.current) logout();
    }
    window.addEventListener("session-expired", handleExpired);
    return () => window.removeEventListener("session-expired", handleExpired);
  }, [logout]);
  useEffect(() => {
    if (!token || user) return;
    const controller = new AbortController();
    setChecking(true);
    apiRequest<User>("/auth/me", token, { signal: controller.signal })
      .then((restoredUser) => {
        if (!controller.signal.aborted) setUser(restoredUser);
      })
      .catch((err) => {
        if (!controller.signal.aborted) setError(err.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setChecking(false);
      });
    return () => controller.abort();
  }, [token, user]);
  function login(session: Session) {
    activeToken.current = session.access_token;
    sessionStorage.setItem(TOKEN_KEY, session.access_token);
    setUser(session.user);
    setToken(session.access_token);
  }
  if (checking)
    return (
      <main className="loading-page" role="status">
        Opening your workspace…
      </main>
    );
  if (token && !user)
    return (
      <main className="loading-page">
        <p role="alert">{error || "Unable to restore your session."}</p>
        <button className="primary mt-4" onClick={logout}>
          Return to sign in
        </button>
      </main>
    );
  return token && user ? (
    <InventoryWorkspace token={token} user={user} onLogout={logout} />
  ) : (
    <AuthScreen onLogin={login} />
  );
}
