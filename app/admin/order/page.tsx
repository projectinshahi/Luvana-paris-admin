"use client";

import React, { useEffect, useMemo, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

type OrderItem = {
  product?: string;
  productNameEnglish?: string;
  productNameArabic?: string;
  variant?: string;
  quantity?: number;
  price?: number;
  discount?: number;
};

type Order = {
  id: string;
  orderId: string;
  customerName?: string;
  price?: number;
  discount?: number;
  shippingCharges?: number;
  status?: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled' | 'returned';
  paymentStatus?: 'pending' | 'paid' | 'failed' | 'refunded';
  createdAt?: string;
  orderItem?: OrderItem[];
};

const STORAGE_KEY = 'lp:orders';

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState('');
  const [filterPayment, setFilterPayment] = useState<'all' | Order['paymentStatus']>('all');

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) setOrders(JSON.parse(raw));
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
  }, [orders]);

  const filtered = useMemo(() => {
    return orders.filter(o => {
      if (filterPayment !== 'all' && o.paymentStatus !== filterPayment) return false;
      if (!search) return true;
      const q = search.toLowerCase();
      return (o.orderId || '').toLowerCase().includes(q) || (o.customerName || '').toLowerCase().includes(q);
    });
  }, [orders, search, filterPayment]);

  const updatePayment = (id: string, ps: Order['paymentStatus']) => {
    setOrders(s => s.map(o => o.id === id ? { ...o, paymentStatus: ps } : o));
  };

  const updateStatus = (id: string, st: Order['status']) => {
    setOrders(s => s.map(o => o.id === id ? { ...o, status: st } : o));
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Orders</h2>
        </div>

        <Card className="p-4">
          <div className="flex items-center gap-3 mb-4">
            <input placeholder="Search by order id or customer" value={search} onChange={e => setSearch(e.target.value)} className="flex-1 rounded-md border px-3 py-2" />
            <select value={filterPayment} onChange={e => setFilterPayment(e.target.value as any)} className="rounded-md border px-3 py-2">
              <option value="all">All Payments</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>

          {filtered.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">No orders</div>
          ) : (
            <table className="w-full text-left table-auto">
              <thead>
                <tr className="text-sm text-muted-foreground">
                  <th className="px-4 py-2">Order ID</th>
                  <th className="px-4 py-2">Customer</th>
                  <th className="px-4 py-2">Amount</th>
                  <th className="px-4 py-2">Payment</th>
                  <th className="px-4 py-2">Order Date</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(o => (
                  <tr key={o.id} className="border-t">
                    <td className="px-4 py-3 align-top font-medium">{o.orderId}</td>
                    <td className="px-4 py-3 align-top">{o.customerName || '-'}</td>
                    <td className="px-4 py-3 align-top">{Number(o.price || 0) - Number(o.discount || 0) + Number(o.shippingCharges || 0)}</td>
                    <td className="px-4 py-3 align-top">
                      <select value={o.paymentStatus || 'pending'} onChange={e => updatePayment(o.id, e.target.value as any)} className="rounded-md border px-2 py-1">
                        <option value="pending">Pending</option>
                        <option value="paid">Paid</option>
                        <option value="failed">Failed</option>
                        <option value="refunded">Refunded</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 align-top">{o.createdAt ? new Date(o.createdAt).toLocaleString() : '-'}</td>
                    <td className="px-4 py-3 align-top">
                      <select value={o.status || 'pending'} onChange={e => updateStatus(o.id, e.target.value as any)} className="rounded-md border px-2 py-1">
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="returned">Returned</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="flex items-center gap-2">
                        <Link href={`/admin/order/${o.id}`}><Button variant="outline" size="sm">View</Button></Link>
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
