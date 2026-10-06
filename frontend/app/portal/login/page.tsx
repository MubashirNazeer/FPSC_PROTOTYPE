"use client";

import { useRouter } from "next/navigation";

import { AppShell } from "@/components/AppShell";
import { LoginForm } from "@/components/LoginForm";

export default function PortalLoginPage() {
  const router = useRouter();

  return (
    <AppShell>
      <div className="container" style={{ paddingTop: "1rem" }}>
        <LoginForm
          title="Candidate Portal"
          subtitle="Sign in to apply, track applications, and download admit cards."
          demoHint="Demo: username candidate1 (or register new) · password Fpsc@2026"
          onSuccess={() => router.push("/portal/dashboard")}
        />
      </div>
    </AppShell>
  );
}
