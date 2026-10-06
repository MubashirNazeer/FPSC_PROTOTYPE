"use client";

import { useEffect, useState } from "react";

import { DataTable } from "@/components/DataTable";
import { StaffShell } from "@/components/StaffShell";
import { useAuthGuard } from "@/lib/auth";
import { apiGet } from "@/lib/api";

type NewsItem = {
  id: number;
  title: string;
  slug: string;
  is_published?: boolean;
};

type Page = {
  id: number;
  title: string;
  slug: string;
  is_published?: boolean;
};

export default function StaffCmsPage() {
  const { user, loading } = useAuthGuard({
    requireStaff: true,
    redirectTo: "/staff/login",
  });
  const [news, setNews] = useState<NewsItem[]>([]);
  const [pages, setPages] = useState<Page[]>([]);

  useEffect(() => {
    if (!user) return;
    Promise.all([apiGet<NewsItem[]>("/news/"), apiGet<Page[]>("/pages/")])
      .then(([n, p]) => {
        setNews(Array.isArray(n.data) ? n.data : []);
        setPages(Array.isArray(p.data) ? p.data : []);
      })
      .catch(() => {
        setNews([]);
        setPages([]);
      });
  }, [user]);

  if (loading) return <div style={{ padding: "2rem" }}>Loading…</div>;

  return (
    <StaffShell userLabel={user?.username}>
      <h1 className="page-title">CMS — News & static pages</h1>
      <div className="stack">
        <div className="card">
          <h3>News items</h3>
          <DataTable<NewsItem>
            rows={news}
            getRowKey={(r) => r.id}
            columns={[
              { key: "title", header: "Title" },
              { key: "slug", header: "Slug" },
              {
                key: "is_published",
                header: "Published",
                render: (r) => (r.is_published ? "Yes" : "No"),
              },
            ]}
          />
        </div>
        <div className="card">
          <h3>Pages</h3>
          <DataTable<Page>
            rows={pages}
            getRowKey={(r) => r.id}
            columns={[
              { key: "title", header: "Title" },
              { key: "slug", header: "Slug" },
              {
                key: "is_published",
                header: "Published",
                render: (r) => (r.is_published ? "Yes" : "No"),
              },
            ]}
          />
        </div>
      </div>
    </StaffShell>
  );
}
