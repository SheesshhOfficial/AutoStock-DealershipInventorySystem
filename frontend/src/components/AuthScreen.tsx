import { useRef, useState, type FormEvent } from "react";
import { apiRequest } from "../api";
import type { Session } from "../types";
import { CarIllustration } from "./CarIllustration";
export function AuthScreen({
  onLogin,
}: {
  onLogin: (session: Session) => void;
}) {
  const [register, setRegister] = useState(false);
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (lock.current) return;
    const form = new FormData(event.currentTarget);
    const credentials = {
      email: String(form.get("email")),
      password: String(form.get("password")),
    };
    lock.current = true;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      if (register) {
        await apiRequest("/auth/register", null, {
          method: "POST",
          body: JSON.stringify(credentials),
        });
        setRegister(false);
        setNotice("Account created. Sign in with your new credentials.");
      } else
        onLogin(
          await apiRequest<Session>("/auth/login", null, {
            method: "POST",
            body: JSON.stringify(credentials),
          }),
        );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not connect. Please try again.",
      );
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <div className="auth-layout">
      <section className="auth-story">
        <a className="brand" href="/">
          a
          <span>
            AutoStock<span className="brand-dot">.</span>
          </span>
        </a>
        <div>
          <p className="eyebrow">YOUR NEXT CHAPTER, IN STOCK</p>
          <h1>
            Good inventory.
            <br />
            Great possibilities.
          </h1>
          <p>A clearer view of the cars that move your business forward.</p>
          <CarIllustration color="#91a8a3" />
        </div>
        <small>THE DEALERSHIP WORKSPACE</small>
      </section>
      <main className="auth-form-wrap">
        <div className="auth-form">
          <p className="eyebrow text-indigo-600">WELCOME TO AUTOSTOCK</p>
          <h2>{register ? "Make yourself at home." : "Welcome back."}</h2>
          <p className="muted">
            {register
              ? "Create an account to explore and purchase vehicles."
              : "Sign in to see what’s in stock."}
          </p>
          <form onSubmit={submit} className="space-y-5 mt-8">
            <label>
              Email address
              <input
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                required
                maxLength={254}
              />
            </label>
            <label>
              Password
              <input
                name="password"
                type="password"
                autoComplete={register ? "new-password" : "current-password"}
                minLength={register ? 10 : 1}
                maxLength={128}
                required
                placeholder={
                  register ? "At least 10 characters" : "Enter your password"
                }
              />
            </label>
            {error && (
              <p role="alert" className="error">
                {error}
              </p>
            )}
            {notice && (
              <p role="status" className="success">
                {notice}
              </p>
            )}
            <button className="primary w-full" disabled={busy}>
              {busy
                ? "Please wait…"
                : register
                  ? "Create account"
                  : "Sign in →"}
            </button>
          </form>
          <p className="mt-7 text-sm muted">
            {register ? "Already have an account?" : "New to AutoStock?"}{" "}
            <button
              className="text-button"
              disabled={busy}
              onClick={() => {
                setRegister(!register);
                setError("");
                setNotice("");
              }}
            >
              {register ? "Sign in" : "Create an account"}
            </button>
          </p>
          <p className="auth-footnote">
            Secure access. One place for every vehicle.
          </p>
        </div>
      </main>
    </div>
  );
}
