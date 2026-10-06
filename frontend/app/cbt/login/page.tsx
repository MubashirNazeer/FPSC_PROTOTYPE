"use client";

import { useRouter } from "next/navigation";

import { LoginForm } from "@/components/LoginForm";
import { apiGet } from "@/lib/api";

type ExamSession = { id: number; status: string };

export default function CbtLoginPage() {
  const router = useRouter();

  async function afterLogin() {
    try {
      const res = await apiGet<ExamSession[]>("/cbt/sessions/");
      const list = Array.isArray(res.data) ? res.data : [];
      const open = list.find((s) =>
        ["ENROLLED", "IN_PROGRESS"].includes(s.status)
      );
      if (open) {
        router.push(`/cbt/exam/${open.id}`);
        return;
      }
    } catch {
      /* fall through */
    }
    router.push("/portal/dashboard");
  }

  return (
    <div className="exam-shell" style={{ padding: "2rem 1rem" }}>
      <LoginForm
        title="CBT Examination"
        subtitle="Distraction-free delivery interface for candidates."
        demoHint="Demo: candidate1 · password Fpsc@2026 — session opens after login."
        onSuccess={() => {
          void afterLogin();
        }}
      />
    </div>
  );
}
