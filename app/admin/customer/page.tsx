"use client";

import React, { useEffect, useMemo, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

type Customer = {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  status?: "active" | "inactive";
  lastlogin?: string;
};

const STORAGE_KEY = 'lp:customers';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<'all' | Customer['status']>('all');

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) setCustomers(JSON.parse(raw));
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(customers));
  }, [customers]);

  const filtered = useMemo(() => customers.filter(c => {
    if (filterStatus !== 'all' && c.status !== filterStatus) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (c.name || '').toLowerCase().includes(q) || (c.email || '').toLowerCase().includes(q) || (c.phone || '').toLowerCase().includes(q);
  }), [customers, search, filterStatus]);

  const toggleStatus = (id: string) => {
    setCustomers(s => s.map(c => c.id === id ? { ...c, status: c.status === 'active' ? 'inactive' : 'active' } : c));
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Customers</h2>
        </div>

        <Card className="p-4">
          <div className="flex items-center gap-3 mb-4">
            <input placeholder="Search by name, email or phone" value={search} onChange={e => setSearch(e.target.value)} className="flex-1 rounded-md border px-3 py-2" />
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)} className="rounded-md border px-3 py-2">
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {filtered.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">No customers</div>
          ) : (
            <table className="w-full text-left table-auto">
              <thead>
                <tr className="text-sm text-muted-foreground">
                  <th className="px-4 py-2">Name</th>
                  <th className="px-4 py-2">Email</th>
                  <th className="px-4 py-2">Phone</th>
                  <th className="px-4 py-2">Last Login</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c.id} className="border-t">
                    <td className="px-4 py-3 align-top font-medium">{c.name}</td>
                    <td className="px-4 py-3 align-top">{c.email}</td>
                    <td className="px-4 py-3 align-top">{c.phone || '-'}</td>
                    <td className="px-4 py-3 align-top">{c.lastlogin ? new Date(c.lastlogin).toLocaleString() : '-'}</td>
                    <td className="px-4 py-3 align-top">
                      <button className={`px-3 py-1 rounded text-sm font-medium ${c.status === 'active' ? 'bg-green-600 text-white' : 'bg-gray-200 text-muted-foreground'}`} onClick={() => toggleStatus(c.id)}>{c.status}</button>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="flex items-center gap-2">
                        <Link href={`/admin/customer/${c.id}`}><Button variant="outline" size="sm">View</Button></Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>
    </AdminLayout>
  );
}
