"use client";

import { FormEvent, useState } from "react";

import { loginWithPassword } from "@/lib/api";

import { Button } from "./Button";
import styles from "./LoginForm.module.css";

type Props = {
  title: string;
  subtitle?: string;
  demoHint?: string;
  onSuccess: () => void;
};

export function LoginForm({ title, subtitle, demoHint, onSuccess }: Props) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await loginWithPassword(username.trim(), password);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={`card ${styles.panel}`}>
      <div className={styles.brandMark}>FPSC</div>
      <h1 className={styles.title}>{title}</h1>
      {subtitle ? <p className="muted">{subtitle}</p> : null}
      {demoHint ? <p className={`alert alert-info ${styles.hint}`}>{demoHint}</p> : null}
      <form className="stack" onSubmit={handleSubmit}>
        <div className="form-field">
          <label htmlFor="username">Username</label>
          <input
            id="username"
            name="username"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div className="form-field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error ? <div className="alert alert-error">{error}</div> : null}
        <Button type="submit" disabled={loading}>
          {loading ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </div>
  );
}
