"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/Button";
import { apiPost } from "@/lib/api";

export default function PortalRegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const payload = Object.fromEntries(fd.entries());
    try {
      await apiPost("/auth/register/", payload, { auth: false });
      router.push("/portal/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell>
      <div className="container" style={{ maxWidth: 560 }}>
        <h1 className="page-title">Create candidate account</h1>
        <form className="card stack" onSubmit={onSubmit}>
          <div className="grid-2">
            <div className="form-field">
              <label htmlFor="username">Username</label>
              <input id="username" name="username" required />
            </div>
            <div className="form-field">
              <label htmlFor="password">Password</label>
              <input id="password" name="password" type="password" required />
            </div>
            <div className="form-field">
              <label htmlFor="email">Email</label>
              <input id="email" name="email" type="email" required />
            </div>
            <div className="form-field">
              <label htmlFor="cnic">CNIC (13 digits)</label>
              <input id="cnic" name="cnic" required />
            </div>
            <div className="form-field">
              <label htmlFor="first_name">First name</label>
              <input id="first_name" name="first_name" required />
            </div>
            <div className="form-field">
              <label htmlFor="last_name">Last name</label>
              <input id="last_name" name="last_name" />
            </div>
          </div>
          {error ? <div className="alert alert-error">{error}</div> : null}
          <Button type="submit" disabled={loading}>
            {loading ? "Creating…" : "Register"}
          </Button>
          <p className="muted">
            Already registered? <Link href="/portal/login">Sign in</Link>
          </p>
        </form>
      </div>
    </AppShell>
  );
}
