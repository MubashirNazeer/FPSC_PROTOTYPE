import { AppShell } from "@/components/AppShell";
import { fetchPublic } from "@/lib/server-api";

type PageContent = {
  title: string;
  body?: string;
};

export default async function ContactPage() {
  const page = await fetchPublic<PageContent>("/pages/contact/");

  return (
    <AppShell>
      <div className="container">
        <h1 className="page-title">{page?.title || "Contact"}</h1>
        <div className="card stack">
          {page?.body ? (
            <div dangerouslySetInnerHTML={{ __html: page.body }} />
          ) : (
            <>
              <p>
                <strong>Federal Public Service Commission</strong>
                <br />
                Aga Khan Road, Sector H-8/4, Islamabad
              </p>
              <p className="muted">
                For examination queries, use the candidate portal. Staff may
                reach IT support through the EMS console.
              </p>
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
}
