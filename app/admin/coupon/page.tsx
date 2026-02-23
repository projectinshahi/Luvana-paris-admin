"use client";

import React, { useEffect, useMemo, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import CouponForm from "@/components/coupon/CouponForm";
import { Percent, CheckCircle, ShoppingCart, DollarSign, Plus } from "lucide-react";
import { api } from "@/utils/api";

type Coupon = {
  _id: string;
  name: string;
  code: string;
  discount: number;
  usage: number;
  minimumPurchase?: number;
  validity?: string;
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
  __v: number;
};

const STORAGE_KEY = "lp:coupons";

export default function CouponPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Coupon | null>(null);

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive">("all");

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      const data = await api.get<Coupon[]>('/admin/coupon');
      setCoupons(data);
    } catch (error) {
      console.error('Failed to fetch coupons:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (payload: any) => {
    try {
      if (editing) {
        // Update
        await api.put(`/admin/coupon/${editing._id}`, payload);
      } else {
        // Create
        await api.post('/admin/coupon', payload);
      }
      await fetchCoupons(); // Refresh list
    } catch (error) {
      console.error('Failed to save coupon:', error);
      throw error;
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this coupon?")) return;
    try {
      await api.delete(`/admin/coupon/${id}`);
      await fetchCoupons(); // Refresh list
    } catch (error) {
      console.error('Failed to delete coupon:', error);
    }
  };

  const toggleStatus = async (id: string) => {
    const coupon = coupons.find(c => c._id === id);
    if (!coupon) return;
    
    const newStatus = coupon.status === 'active' ? 'inactive' : 'active';
    try {
      await api.put(`/admin/coupon/${id}`, { ...coupon, status: newStatus });
      await fetchCoupons(); // Refresh list
    } catch (error) {
      console.error('Failed to update status:', error);
    }
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
            <Button onClick={() => { setEditing(null); setOpen(true); }}><Plus className="mr-2 h-4 w-4" />New Coupon</Button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <Card className="p-4 flex items-center gap-4">
            <div className="p-2 bg-muted rounded-md"><Percent className="h-6 w-6" /></div>
            <div>
              <div className="text-sm text-muted-foreground">Total Coupons</div>
              <div className="text-2xl font-semibold">{totals.totalCoupons}</div>
            </div>
          </Card>
          <Card className="p-4 flex items-center gap-4">
            <div className="p-2 bg-muted rounded-md"><CheckCircle className="h-6 w-6" /></div>
            <div>
              <div className="text-sm text-muted-foreground">Active Coupons</div>
              <div className="text-2xl font-semibold">{totals.activeCoupons}</div>
            </div>
          </Card>
          <Card className="p-4 flex items-center gap-4">
            <div className="p-2 bg-muted rounded-md"><ShoppingCart className="h-6 w-6" /></div>
            <div>
              <div className="text-sm text-muted-foreground">Total Usage</div>
              <div className="text-2xl font-semibold">{totals.totalUsage}</div>
            </div>
          </Card>
          <Card className="p-4 flex items-center gap-4">
            <div className="p-2 bg-muted rounded-md"><DollarSign className="h-6 w-6" /></div>
            <div>
              <div className="text-sm text-muted-foreground">Total Discount Given</div>
              <div className="text-2xl font-semibold">{totals.totalDiscount}</div>
            </div>
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

          {loading ? (
            <div className="py-12 text-center text-muted-foreground">Loading coupons...</div>
          ) : filtered.length === 0 ? (
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
                  <tr key={c._id} className="border-t">
                    <td className="px-4 py-3 align-top font-medium">{c.name}</td>
                    <td className="px-4 py-3 align-top">{c.code}</td>
                    <td className="px-4 py-3 align-top">{c.discount}</td>
                    <td className="px-4 py-3 align-top">{c.minimumPurchase ?? 0}</td>
                    <td className="px-4 py-3 align-top">{c.usage}</td>
                    <td className="px-4 py-3 align-top">{c.validity ? new Date(c.validity).toLocaleDateString() : '-'}</td>
                    <td className="px-4 py-3 align-top">
                      <button
                        className={`px-3 py-1 rounded text-sm font-medium ${c.status === 'active' ? 'bg-green-600 text-white' : 'bg-gray-200 text-muted-foreground'}`}
                        onClick={() => toggleStatus(c._id)}
                      >
                        {c.status}
                      </button>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => { setEditing(c); setOpen(true); }}>Edit</Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(c._id)}>Delete</Button>
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
