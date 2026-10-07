"use client";

import { FormEvent, useEffect, useState } from "react";

import { Button } from "@/components/Button";
import { DataTable } from "@/components/DataTable";
import { StaffShell } from "@/components/StaffShell";
import { useAuthGuard } from "@/lib/auth";
import { apiGet, apiPost } from "@/lib/api";

import styles from "../mgmt.module.css";

type Duty = {
  id: number;
  exam_date?: string;
  role?: string;
  shift?: number;
  staff_name?: string;
  centre_name?: string;
  centre?: number;
  staff?: number;
};

type InventoryItem = {
  id: number;
  sku?: string;
  name?: string;
  quantity_on_hand?: number;
  unit?: string;
};

type Centre = { id: number; code?: string; name?: string };
type Transport = {
  id: number;
  vehicle?: string;
  driver?: string;
  status?: string;
  dispatch_date?: string;
  centre?: number;
};

export default function StaffSupportingPage() {
  const { user, loading } = useAuthGuard({
    requireStaff: true,
    redirectTo: "/staff/login",
  });
  const [duties, setDuties] = useState<Duty[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [transport, setTransport] = useState<Transport[]>([]);
  const [centres, setCentres] = useState<Centre[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [dutyForm, setDutyForm] = useState({
    exam_date: new Date().toISOString().slice(0, 10),
    centre: "",
    staff: "",
    role: "invigilator",
    shift: "1",
  });
  const [invForm, setInvForm] = useState({
    sku: "",
    name: "",
    quantity_on_hand: "0",
    unit: "pcs",
  });
  const [txnForm, setTxnForm] = useState({
    item: "",
    txn_type: "ISSUE",
    quantity: "1",
    centre: "",
    reference: "",
  });

  const load = async () => {
    const [d, i, t, c, tr] = await Promise.all([
      apiGet<Duty[]>("/duties/"),
      apiGet<InventoryItem[]>("/inventory/"),
      apiGet<Transport[]>("/transport/"),
      apiGet<Centre[]>("/centres/"),
      apiGet<Transport[]>("/transport/"),
    ]);
    setDuties(Array.isArray(d.data) ? d.data : []);
    setInventory(Array.isArray(i.data) ? i.data : []);
    setTransport(Array.isArray(tr.data) ? tr.data : []);
    setCentres(Array.isArray(c.data) ? c.data : []);
    void t;
  };

  useEffect(() => {
    if (!user) return;
    load().catch(() => {
      setDuties([]);
      setInventory([]);
      setTransport([]);
      setCentres([]);
    });
  }, [user]);

  async function createDuty(e: FormEvent) {
    e.preventDefault();
    setMsg(null);
    setErr(null);
    try {
      await apiPost("/duties/", {
        exam_date: dutyForm.exam_date,
        centre: Number(dutyForm.centre),
        staff: Number(dutyForm.staff),
        role: dutyForm.role,
        shift: Number(dutyForm.shift),
      });
      setMsg("Duty assignment created.");
      await load();
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Duty create failed.");
    }
  }

  async function createInventory(e: FormEvent) {
    e.preventDefault();
    setMsg(null);
    setErr(null);
    try {
      await apiPost("/inventory/", {
        sku: invForm.sku,
        name: invForm.name,
        quantity_on_hand: Number(invForm.quantity_on_hand),
        unit: invForm.unit,
      });
      setMsg("Inventory item created.");
      setInvForm({ sku: "", name: "", quantity_on_hand: "0", unit: "pcs" });
      await load();
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Inventory create failed.");
    }
  }

  async function createTxn(e: FormEvent) {
    e.preventDefault();
    setMsg(null);
    setErr(null);
    try {
      await apiPost("/inventory-txns/", {
        item: Number(txnForm.item),
        txn_type: txnForm.txn_type,
        quantity: Number(txnForm.quantity),
        centre: txnForm.centre ? Number(txnForm.centre) : null,
        reference: txnForm.reference,
      });
      setMsg("Inventory transaction recorded.");
      await load();
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Transaction failed.");
    }
  }

  if (loading) return <div style={{ padding: "2rem" }}>Loading…</div>;

  return (
    <StaffShell userLabel={user?.username}>
      <h1 className="page-title">Supporting Module Management</h1>
      <p className={styles.help}>
        Duty deployment, inventory issue/return, and transport register (RFP
        Module 6).
      </p>
      {msg ? <div className="alert alert-success">{msg}</div> : null}
      {err ? <div className="alert alert-error">{err}</div> : null}

      <div className="stack">
        <div className="card stack">
          <h3>Assign duty</h3>
          <form className={styles.formGrid} onSubmit={createDuty}>
            <div className="form-field">
              <label>Exam date</label>
              <input
                type="date"
                required
                value={dutyForm.exam_date}
                onChange={(e) =>
                  setDutyForm({ ...dutyForm, exam_date: e.target.value })
                }
              />
            </div>
            <div className="form-field">
              <label>Centre</label>
              <select
                required
                value={dutyForm.centre}
                onChange={(e) =>
                  setDutyForm({ ...dutyForm, centre: e.target.value })
                }
              >
                <option value="">Select</option>
                {centres.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} — {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label>Staff user ID</label>
              <input
                required
                type="number"
                value={dutyForm.staff}
                onChange={(e) =>
                  setDutyForm({ ...dutyForm, staff: e.target.value })
                }
                placeholder="invigilator user id"
              />
            </div>
            <div className="form-field">
              <label>Role</label>
              <select
                value={dutyForm.role}
                onChange={(e) => setDutyForm({ ...dutyForm, role: e.target.value })}
              >
                <option value="invigilator">Invigilator</option>
                <option value="supervisor">Supervisor</option>
                <option value="support">Support</option>
              </select>
            </div>
            <div className="form-field">
              <label>Shift</label>
              <input
                type="number"
                min={1}
                value={dutyForm.shift}
                onChange={(e) =>
                  setDutyForm({ ...dutyForm, shift: e.target.value })
                }
              />
            </div>
            <div className="form-field" style={{ alignSelf: "end" }}>
              <Button type="submit">Assign duty</Button>
            </div>
          </form>
          <DataTable<Duty>
            rows={duties}
            getRowKey={(r) => r.id}
            columns={[
              { key: "exam_date", header: "Date" },
              {
                key: "centre_name",
                header: "Centre",
                render: (r) => r.centre_name || "—",
              },
              {
                key: "staff_name",
                header: "Staff",
                render: (r) => r.staff_name || "—",
              },
              { key: "role", header: "Role" },
              { key: "shift", header: "Shift" },
            ]}
          />
        </div>

        <div className="card stack">
          <h3>Inventory item</h3>
          <form className={styles.formGrid} onSubmit={createInventory}>
            <div className="form-field">
              <label>SKU</label>
              <input
                required
                value={invForm.sku}
                onChange={(e) => setInvForm({ ...invForm, sku: e.target.value })}
              />
            </div>
            <div className="form-field">
              <label>Name</label>
              <input
                required
                value={invForm.name}
                onChange={(e) => setInvForm({ ...invForm, name: e.target.value })}
              />
            </div>
            <div className="form-field">
              <label>Qty on hand</label>
              <input
                type="number"
                value={invForm.quantity_on_hand}
                onChange={(e) =>
                  setInvForm({ ...invForm, quantity_on_hand: e.target.value })
                }
              />
            </div>
            <div className="form-field" style={{ alignSelf: "end" }}>
              <Button type="submit">Add item</Button>
            </div>
          </form>

          <h3>Issue / return stock</h3>
          <form className={styles.formGrid} onSubmit={createTxn}>
            <div className="form-field">
              <label>Item</label>
              <select
                required
                value={txnForm.item}
                onChange={(e) => setTxnForm({ ...txnForm, item: e.target.value })}
              >
                <option value="">Select</option>
                {inventory.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.sku} ({i.quantity_on_hand})
                  </option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label>Type</label>
              <select
                value={txnForm.txn_type}
                onChange={(e) =>
                  setTxnForm({ ...txnForm, txn_type: e.target.value })
                }
              >
                <option value="ISSUE">Issue</option>
                <option value="RETURN">Return</option>
                <option value="ADJUST">Adjust</option>
              </select>
            </div>
            <div className="form-field">
              <label>Quantity</label>
              <input
                type="number"
                min={1}
                value={txnForm.quantity}
                onChange={(e) =>
                  setTxnForm({ ...txnForm, quantity: e.target.value })
                }
              />
            </div>
            <div className="form-field">
              <label>Centre</label>
              <select
                value={txnForm.centre}
                onChange={(e) =>
                  setTxnForm({ ...txnForm, centre: e.target.value })
                }
              >
                <option value="">Optional</option>
                {centres.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label>Reference</label>
              <input
                value={txnForm.reference}
                onChange={(e) =>
                  setTxnForm({ ...txnForm, reference: e.target.value })
                }
              />
            </div>
            <div className="form-field" style={{ alignSelf: "end" }}>
              <Button type="submit">Record txn</Button>
            </div>
          </form>

          <DataTable<InventoryItem>
            rows={inventory}
            getRowKey={(r) => r.id}
            columns={[
              { key: "sku", header: "SKU" },
              { key: "name", header: "Item" },
              { key: "quantity_on_hand", header: "Qty" },
              { key: "unit", header: "Unit" },
            ]}
          />
        </div>

        <div className="card">
          <h3>Transport dispatches</h3>
          <DataTable<Transport>
            rows={transport}
            getRowKey={(r) => r.id}
            columns={[
              { key: "dispatch_date", header: "Date" },
              { key: "vehicle", header: "Vehicle" },
              { key: "driver", header: "Driver" },
              { key: "status", header: "Status" },
            ]}
          />
        </div>
      </div>
    </StaffShell>
  );
}
