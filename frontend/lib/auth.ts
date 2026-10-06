"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { apiGet, clearTokens, getAccessToken } from "@/lib/api";

export type UserProfile = {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_staff: boolean;
  role_codes?: string[];
};

export function useAuthGuard(options: {
  requireStaff?: boolean;
  redirectTo: string;
}) {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!getAccessToken()) {
      router.replace(options.redirectTo);
      return;
    }
    try {
      const res = await apiGet<UserProfile>("/auth/me/");
      if (options.requireStaff && !res.data.is_staff) {
        router.replace(options.redirectTo);
        return;
      }
      setUser(res.data);
    } catch {
      clearTokens();
      router.replace(options.redirectTo);
    } finally {
      setLoading(false);
    }
  }, [options.requireStaff, options.redirectTo, router]);

  useEffect(() => {
    load();
  }, [load]);

  return { user, loading, reload: load };
}

export function logout(redirect = "/") {
  clearTokens();
  if (typeof window !== "undefined") {
    window.location.href = redirect;
  }
}
