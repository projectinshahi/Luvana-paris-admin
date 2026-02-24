"use client";

import React, { useEffect, useMemo, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Card } from "@/components/ui/card";
import { useParams } from "next/navigation";
import Link from "next/link";

type Customer = { id: string; name?: string; email?: string; phone?: string; status?: string; lastlogin?: string };
type Order = { id: string; orderId?: string; customerName?: string; price?: number; discount?: number; shippingCharges?: number; paymentStatus?: string; status?: string; createdAt?: string };

export default function CustomerDetailPage() {
  const params = useParams() as any;
  const id = params?.id as string;
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    const raw = localStorage.getItem('lp:customers');
    if (raw) {
      const found = JSON.parse(raw).find((c: any) => c.id === id);
      if (found) setCustomer(found);
    }

    const rawO = localStorage.getItem('lp:orders');
    if (rawO) {
      const all = JSON.parse(rawO) as Order[];
      // Match by customer name
      const filtered = customer ? all.filter(o => o.customerName === customer.name) : all.filter((o: any) => o.customerName && o.customerName === JSON.parse(localStorage.getItem('lp:customers') || '[]').find((c:any)=>c.id===id)?.name);
      setOrders(filtered);
    }
  }, [id, customer]);

  if (!customer) return (
    <AdminLayout>
      <div className="py-12 text-center">Customer not found</div>
    </AdminLayout>
  );

  const totals = useMemo(() => ({
    totalOrders: orders.length,
    totalSpent: orders.reduce((s, o) => s + (Number(o.price || 0) - Number(o.discount || 0) + Number(o.shippingCharges || 0)), 0),
  }), [orders]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Customer: {customer.name}</h2>
        </div>

        <Card className="p-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">Email</div>
              <div className="font-medium">{customer.email}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Phone</div>
              <div className="font-medium">{customer.phone}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Status</div>
              <div className="font-medium">{customer.status}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Last Login</div>
              <div className="font-medium">{customer.lastlogin ? new Date(customer.lastlogin).toLocaleString() : '-'}</div>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-2 gap-4">
          <Card className="p-4">
            <div className="text-sm text-muted-foreground">Total Orders</div>
            <div className="text-2xl font-semibold">{totals.totalOrders}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-muted-foreground">Total Spent</div>
            <div className="text-2xl font-semibold">{totals.totalSpent}</div>
          </Card>
        </div>

        <Card className="p-4">
          <h3 className="font-semibold mb-3">Orders</h3>
          {orders.length === 0 ? (
            <div className="text-muted-foreground">No orders for this customer</div>
          ) : (
            <table className="w-full text-left table-auto">
              <thead>
                <tr className="text-sm text-muted-foreground">
                  <th className="px-4 py-2">Order ID</th>
                  <th className="px-4 py-2">Amount</th>
                  <th className="px-4 py-2">Payment</th>
                  <th className="px-4 py-2">Date</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o.id} className="border-t">
                    <td className="px-4 py-3 align-top font-medium">{o.orderId}</td>
                    <td className="px-4 py-3 align-top">{Number(o.price || 0) - Number(o.discount || 0) + Number(o.shippingCharges || 0)}</td>
                    <td className="px-4 py-3 align-top">{o.paymentStatus}</td>
                    <td className="px-4 py-3 align-top">{o.createdAt ? new Date(o.createdAt).toLocaleString() : '-'}</td>
                    <td className="px-4 py-3 align-top">{o.status}</td>
                    <td className="px-4 py-3 align-top"><Link href={`/admin/order/${o.id}`}><Button variant="outline" size="sm">View</Button></Link></td>
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
