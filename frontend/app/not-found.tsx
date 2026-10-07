import Link from "next/link";

import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/Button";

export default function NotFound() {
  return (
    <AppShell>
      <div className="container stack" style={{ paddingTop: "3rem" }}>
        <h1 className="page-title">Page not found (404)</h1>
        <p className="page-lead">
          The page you requested is not available. Use the navigation to continue
          browsing FPSC advertisements, process flows, or the candidate portal.
        </p>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <Button href="/" variant="primary">
            Home
          </Button>
          <Button href="/ads" variant="secondary">
            Advertisements
          </Button>
          <Button href="/search" variant="ghost">
            Search
          </Button>
          <Link href="/contact">Contact FPSC</Link>
        </div>
      </div>
    </AppShell>
  );
}
