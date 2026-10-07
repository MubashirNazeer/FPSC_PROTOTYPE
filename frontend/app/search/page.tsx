"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/Button";
import { apiGet } from "@/lib/api";

type Ad = { id: number; title?: string; ref_number?: string; kind?: string };
type News = { id: number; title?: string; slug?: string; summary?: string };

export default function SearchPage() {
  const [q, setQ] = useState("");
  const [ads, setAds] = useState<Ad[]>([]);
  const [news, setNews] = useState<News[]>([]);
  const [loaded, setLoaded] = useState(false);

  async function runSearch() {
    const [a, n] = await Promise.all([
      apiGet<Ad[]>("/advertisements/published/", { auth: false }),
      apiGet<News[]>("/news/", { auth: false }),
    ]);
    setAds(Array.isArray(a.data) ? a.data : []);
    setNews(Array.isArray(n.data) ? n.data : []);
    setLoaded(true);
  }

  const filteredAds = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return ads;
    return ads.filter(
      (x) =>
        (x.title || "").toLowerCase().includes(s) ||
        (x.ref_number || "").toLowerCase().includes(s)
    );
  }, [ads, q]);

  const filteredNews = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return news;
    return news.filter(
      (x) =>
        (x.title || "").toLowerCase().includes(s) ||
        (x.summary || "").toLowerCase().includes(s)
    );
  }, [news, q]);

  return (
    <AppShell>
      <div className="container stack" style={{ paddingTop: "2rem" }}>
        <h1 className="page-title">Search</h1>
        <p className="page-lead">
          Search published advertisements and notices (WEB-4.7 multiple
          exploration paths).
        </p>
        <div className="card stack">
          <div className="form-field">
            <label htmlFor="q">Keywords</label>
            <input
              id="q"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="e.g. CSS, Assistant Director, MPT"
            />
          </div>
          <Button onClick={runSearch}>Search</Button>
        </div>
        {loaded ? (
          <>
            <h2>Advertisements ({filteredAds.length})</h2>
            <div className="stack">
              {filteredAds.map((ad) => (
                <article key={ad.id} className="card">
                  <strong>{ad.title}</strong>
                  <p className="muted">
                    {ad.ref_number} · {ad.kind}
                  </p>
                  <Link href={`/portal/apply/${ad.id}`}>Apply</Link>
                </article>
              ))}
            </div>
            <h2>Notices ({filteredNews.length})</h2>
            <div className="stack">
              {filteredNews.map((n) => (
                <article key={n.id} className="card">
                  <strong>{n.title}</strong>
                  <p className="muted">{n.summary}</p>
                </article>
              ))}
            </div>
          </>
        ) : null}
      </div>
    </AppShell>
  );
}
