"use client";

import { useRouter } from "next/navigation";

import { LoginForm } from "@/components/LoginForm";

export default function StaffLoginPage() {
  const router = useRouter();

  return (
    <div className="fpsc-pattern" style={{ minHeight: "100vh", padding: "2rem 1rem" }}>
      <LoginForm
        title="Staff EMS Login"
        subtitle="Authorized FPSC personnel only."
        demoHint="Demo users: admin, secrecy, invigilator · password Fpsc@2026"
        onSuccess={() => router.push("/staff")}
      />
    </div>
  );
}
