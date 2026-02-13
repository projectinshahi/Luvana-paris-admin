"use client";

import React, { useEffect, useMemo, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import CouponForm from "@/components/coupon/CouponForm";

type Coupon = {
  id: string;
  name: string;
  code: string;
  discount: number;
  usage: number;
  minimumPurchase?: number;
  validity?: string; // ISO date
  status: "active" | "inactive";
};

const STORAGE_KEY = "lp:coupons";

export default function CouponPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Coupon | null>(null);

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive">("all");

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Coupon[];
      setCoupons(parsed.sort((a, b) => a.name.localeCompare(b.name)));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(coupons));
  }, [coupons]);

  const handleSave = async (payload: Partial<Coupon>) => {
    if (payload.id) {
      setCoupons((s) => s.map((c) => (c.id === payload.id ? ({ ...c, ...payload } as Coupon) : c)));
    } else {
      const id = String(Date.now());
      setCoupons((s) => [{
        id,
        name: payload.name || "",
        code: payload.code || "",
        discount: Number(payload.discount || 0),
        usage: Number(payload.usage || 0),
        minimumPurchase: Number(payload.minimumPurchase || 0),
        validity: payload.validity || undefined,
        status: (payload.status as any) || "active",
      }, ...s]);
    }
  };

  const handleDelete = (id: string) => {
    if (!confirm("Delete this coupon?")) return;
    setCoupons((s) => s.filter((c) => c.id !== id));
  };

  const toggleStatus = (id: string) => {
    setCoupons((s) => s.map((c) => c.id === id ? { ...c, status: c.status === 'active' ? 'inactive' : 'active' } : c));
  };

  const filtered = useMemo(() => {
    return coupons.filter((c) => {
      if (filterStatus !== 'all' && c.status !== filterStatus) return false;
      if (!search) return true;
      const q = search.toLowerCase();
      return c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q);
    });
  }, [coupons, search, filterStatus]);

  const totals = useMemo(() => {
    const totalCoupons = coupons.length;
    const activeCoupons = coupons.filter(c => c.status === 'active').length;
    const totalUsage = coupons.reduce((s, c) => s + (Number(c.usage) || 0), 0);
    const totalDiscount = coupons.reduce((s, c) => s + (Number(c.discount) || 0) * (Number(c.usage) || 0), 0);
    return { totalCoupons, activeCoupons, totalUsage, totalDiscount };
  }, [coupons]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Coupons</h2>
          <div>
            <Button onClick={() => { setEditing(null); setOpen(true); }}>New Coupon</Button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="text-sm text-muted-foreground">Total Coupons</div>
            <div className="text-2xl font-semibold">{totals.totalCoupons}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-muted-foreground">Active Coupons</div>
            <div className="text-2xl font-semibold">{totals.activeCoupons}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-muted-foreground">Total Usage</div>
            <div className="text-2xl font-semibold">{totals.totalUsage}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-muted-foreground">Total Discount Given</div>
            <div className="text-2xl font-semibold">{totals.totalDiscount}</div>
          </Card>
        </div>

        <Card className="p-4">
          <div className="flex items-center gap-3 mb-4">
            <input placeholder="Search by name or code" value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1 rounded-md border px-3 py-2" />
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as any)} className="rounded-md border px-3 py-2">
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {filtered.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">No coupons</div>
          ) : (
            <table className="w-full text-left table-auto">
              <thead>
                <tr className="text-sm text-muted-foreground">
                  <th className="px-4 py-2">Name</th>
                  <th className="px-4 py-2">Code</th>
                  <th className="px-4 py-2">Discount</th>
                  <th className="px-4 py-2">Min Purchase</th>
                  <th className="px-4 py-2">Usage</th>
                  <th className="px-4 py-2">Validity</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id} className="border-t">
                    <td className="px-4 py-3 align-top font-medium">{c.name}</td>
                    <td className="px-4 py-3 align-top">{c.code}</td>
                    <td className="px-4 py-3 align-top">{c.discount}</td>
                    <td className="px-4 py-3 align-top">{c.minimumPurchase ?? 0}</td>
                    <td className="px-4 py-3 align-top">{c.usage}</td>
                    <td className="px-4 py-3 align-top">{c.validity ? new Date(c.validity).toLocaleDateString() : '-'}</td>
                    <td className="px-4 py-3 align-top">
                      <button
                        className={`px-3 py-1 rounded text-sm font-medium ${c.status === 'active' ? 'bg-green-600 text-white' : 'bg-gray-200 text-muted-foreground'}`}
                        onClick={() => toggleStatus(c.id)}
                      >
                        {c.status}
                      </button>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => { setEditing(c); setOpen(true); }}>Edit</Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(c.id)}>Delete</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        <CouponForm open={open} onOpenChange={setOpen} initial={editing} onSave={handleSave} />
      </div>
    </AdminLayout>
  );
}
