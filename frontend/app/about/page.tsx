import { AppShell } from "@/components/AppShell";
import { fetchPublic } from "@/lib/server-api";

type PageContent = {
  title: string;
  body?: string;
  slug: string;
};

export default async function AboutPage() {
  const page = await fetchPublic<PageContent>("/pages/about/");

  return (
    <AppShell>
      <div className="container">
        <h1 className="page-title">{page?.title || "About FPSC"}</h1>
        <div className="card">
          {page?.body ? (
            <div dangerouslySetInnerHTML={{ __html: page.body }} />
          ) : (
            <p className="muted">
              The Federal Public Service Commission is responsible for
              recruiting civil servants and conducting competitive examinations
              for posts under the Federal Government. This digital ERP MVP
              demonstrates integrated workflows from requisition to CBT delivery.
            </p>
          )}
        </div>
      </div>
    </AppShell>
  );
}
