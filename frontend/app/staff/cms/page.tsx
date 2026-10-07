"use client";

import { FormEvent, useEffect, useState } from "react";

import { Button } from "@/components/Button";
import { DataTable } from "@/components/DataTable";
import { StaffShell } from "@/components/StaffShell";
import { useAuthGuard } from "@/lib/auth";
import { apiGet, apiPost } from "@/lib/api";

import styles from "../mgmt.module.css";

type NewsItem = {
  id: number;
  title: string;
  slug: string;
  category?: string;
  is_published?: boolean;
  summary?: string;
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
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [newsForm, setNewsForm] = useState({
    title: "",
    slug: "",
    category: "NOTICE",
    summary: "",
    body: "",
    is_published: true,
  });
  const [pageForm, setPageForm] = useState({
    title: "",
    slug: "",
    body: "",
    is_published: true,
  });

  const load = async () => {
    const [n, p] = await Promise.all([
      apiGet<NewsItem[]>("/news/"),
      apiGet<Page[]>("/pages/"),
    ]);
    setNews(Array.isArray(n.data) ? n.data : []);
    setPages(Array.isArray(p.data) ? p.data : []);
  };

  useEffect(() => {
    if (!user) return;
    load().catch(() => {
      setNews([]);
      setPages([]);
    });
  }, [user]);

  async function createNews(e: FormEvent) {
    e.preventDefault();
    setMsg(null);
    setErr(null);
    try {
      const slug =
        newsForm.slug ||
        newsForm.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 50);
      await apiPost("/news/", { ...newsForm, slug });
      setMsg("News item published to CMS.");
      setNewsForm({
        title: "",
        slug: "",
        category: "NOTICE",
        summary: "",
        body: "",
        is_published: true,
      });
      await load();
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "News create failed.");
    }
  }

  async function createPage(e: FormEvent) {
    e.preventDefault();
    setMsg(null);
    setErr(null);
    try {
      const slug =
        pageForm.slug ||
        pageForm.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 50);
      await apiPost("/pages/", { ...pageForm, slug });
      setMsg("Page saved.");
      setPageForm({ title: "", slug: "", body: "", is_published: true });
      await load();
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Page create failed.");
    }
  }

  if (loading) return <div style={{ padding: "2rem" }}>Loading…</div>;

  return (
    <StaffShell userLabel={user?.username}>
      <h1 className="page-title">CMS — Website Content Management</h1>
      <p className={styles.help}>
        Manage public notices and static pages without developer intervention
        (RFP Module 4 / WEB-4.1).
      </p>
      {msg ? <div className="alert alert-success">{msg}</div> : null}
      {err ? <div className="alert alert-error">{err}</div> : null}

      <div className="stack">
        <div className="card stack">
          <h3>Add news / notice</h3>
          <form className="stack" onSubmit={createNews}>
            <div className={styles.formGrid}>
              <div className="form-field">
                <label>Title</label>
                <input
                  required
                  value={newsForm.title}
                  onChange={(e) =>
                    setNewsForm({ ...newsForm, title: e.target.value })
                  }
                />
              </div>
              <div className="form-field">
                <label>Slug (optional)</label>
                <input
                  value={newsForm.slug}
                  onChange={(e) =>
                    setNewsForm({ ...newsForm, slug: e.target.value })
                  }
                />
              </div>
              <div className="form-field">
                <label>Category</label>
                <select
                  value={newsForm.category}
                  onChange={(e) =>
                    setNewsForm({ ...newsForm, category: e.target.value })
                  }
                >
                  <option value="NOTICE">Notice</option>
                  <option value="RESULT">Result</option>
                  <option value="PRESS">Press</option>
                  <option value="AD">Advertisement</option>
                </select>
              </div>
            </div>
            <div className="form-field">
              <label>Summary</label>
              <input
                value={newsForm.summary}
                onChange={(e) =>
                  setNewsForm({ ...newsForm, summary: e.target.value })
                }
              />
            </div>
            <div className="form-field">
              <label>Body</label>
              <textarea
                required
                rows={4}
                value={newsForm.body}
                onChange={(e) => setNewsForm({ ...newsForm, body: e.target.value })}
              />
            </div>
            <Button type="submit">Publish news</Button>
          </form>
          <DataTable<NewsItem>
            rows={news}
            getRowKey={(r) => r.id}
            columns={[
              { key: "title", header: "Title" },
              { key: "category", header: "Category" },
              { key: "slug", header: "Slug" },
              {
                key: "is_published",
                header: "Published",
                render: (r) => (r.is_published ? "Yes" : "No"),
              },
            ]}
          />
        </div>

        <div className="card stack">
          <h3>Add static page</h3>
          <form className="stack" onSubmit={createPage}>
            <div className={styles.formGrid}>
              <div className="form-field">
                <label>Title</label>
                <input
                  required
                  value={pageForm.title}
                  onChange={(e) =>
                    setPageForm({ ...pageForm, title: e.target.value })
                  }
                />
              </div>
              <div className="form-field">
                <label>Slug (optional)</label>
                <input
                  value={pageForm.slug}
                  onChange={(e) =>
                    setPageForm({ ...pageForm, slug: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="form-field">
              <label>Body</label>
              <textarea
                required
                rows={5}
                value={pageForm.body}
                onChange={(e) => setPageForm({ ...pageForm, body: e.target.value })}
              />
            </div>
            <Button type="submit">Save page</Button>
          </form>
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
