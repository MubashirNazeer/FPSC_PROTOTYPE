"use client";

import { useEffect, useState } from "react";

import { DataTable } from "@/components/DataTable";
import { StaffShell } from "@/components/StaffShell";
import { StatusBadge } from "@/components/StatusBadge";
import { useAuthGuard } from "@/lib/auth";
import { apiGet } from "@/lib/api";

type Duty = {
  id: number;
  title?: string;
  status: string;
  assignee?: { username?: string };
};

type InventoryItem = {
  id: number;
  sku?: string;
  name?: string;
  quantity_on_hand?: number;
};

export default function StaffSupportingPage() {
  const { user, loading } = useAuthGuard({
    requireStaff: true,
    redirectTo: "/staff/login",
  });
  const [duties, setDuties] = useState<Duty[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      apiGet<Duty[]>("/duties/"),
      apiGet<InventoryItem[]>("/inventory/"),
    ])
      .then(([d, i]) => {
        setDuties(Array.isArray(d.data) ? d.data : []);
        setInventory(Array.isArray(i.data) ? i.data : []);
      })
      .catch(() => {
        setDuties([]);
        setInventory([]);
      });
  }, [user]);

  if (loading) return <div style={{ padding: "2rem" }}>Loading…</div>;

  return (
    <StaffShell userLabel={user?.username}>
      <h1 className="page-title">Supporting services</h1>
      <div className="stack">
        <div className="card">
          <h3>Duty assignments</h3>
          <DataTable<Duty>
            rows={duties}
            getRowKey={(r) => r.id}
            columns={[
              { key: "title", header: "Duty" },
              {
                key: "assignee",
                header: "Assignee",
                render: (r) => r.assignee?.username || "—",
              },
              {
                key: "status",
                header: "Status",
                render: (r) => <StatusBadge status={r.status} />,
              },
            ]}
          />
        </div>
        <div className="card">
          <h3>Inventory</h3>
          <DataTable<InventoryItem>
            rows={inventory}
            getRowKey={(r) => r.id}
            columns={[
              { key: "sku", header: "SKU" },
              { key: "name", header: "Item" },
              { key: "quantity_on_hand", header: "Qty" },
            ]}
          />
        </div>
      </div>
    </StaffShell>
  );
}
