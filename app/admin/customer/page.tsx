"use client";

import React, { useEffect, useMemo, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { api } from "@/utils/api";

type Customer = {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  status?: "active" | "inactive";
  lastlogin?: string;
  createdAt?: string;
};

const STORAGE_KEY = 'lp:customers';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<'all' | Customer['status']>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [limit, setLimit] = useState(10);

  const fetchCustomers = async (page: number = 1) => {
    try {
      setLoading(true);
      const data = await api.get<{ customers: any[]; pagination?: { currentPage: number; totalPages: number; totalCustomers: number; limit: number } }>(`/admin/customer?page=${page}&limit=${limit}`);
      const mapped = (data.customers || []).map((c) => ({
        id: c._id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        status: c.status,
        lastlogin: c.lastlogin,
        createdAt: c.createdAt,
      })) as Customer[];
      setCustomers(mapped);
      if (data.pagination) {
        setCurrentPage(data.pagination.currentPage);
        setTotalPages(data.pagination.totalPages);
        setTotalCustomers(data.pagination.totalCustomers);
        setLimit(data.pagination.limit);
      }
    } catch (error) {
      console.error('Failed to fetch customers:', error);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers(1);
  }, []);

  const filtered = useMemo(() => customers.filter(c => {
    if (filterStatus !== 'all' && c.status !== filterStatus) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (c.name || '').toLowerCase().includes(q) || (c.email || '').toLowerCase().includes(q) || (c.phone || '').toLowerCase().includes(q);
  }), [customers, search, filterStatus]);

  const toggleStatus = async (id: string) => {
    const customer = customers.find(c => c.id === id);
    if (!customer) return;
    
    const newStatus = customer.status === 'active' ? 'inactive' : 'active';
    try {
      await api.patch(`/admin/customer/${id}/status`, { status: newStatus });
      setCustomers(s => s.map(c => c.id === id ? { ...c, status: newStatus } : c));
    } catch (error) {
      console.error('Failed to update customer status:', error);
    }
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

          {loading ? (
            <div className="py-12 text-center text-muted-foreground">Loading customers...</div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">No customers</div>
          ) : (
            <>
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
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {(currentPage - 1) * limit + 1} to {Math.min(currentPage * limit, totalCustomers)} of {totalCustomers} customers
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchCustomers(currentPage - 1)}
                  disabled={currentPage === 1 || loading}
                >
                  ← Previous
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => fetchCustomers(page)}
                      className={`px-3 py-1 rounded text-sm font-medium ${
                        page === currentPage
                          ? 'bg-primary text-white'
                          : 'border border-muted-foreground text-muted-foreground hover:bg-muted'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                      disabled={loading}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchCustomers(currentPage + 1)}
                  disabled={currentPage === totalPages || loading}
                >
                  Next →
                </Button>
              </div>
            </div>
            </>
          )}
        </Card>
      </div>
    </AdminLayout>
  );
}
