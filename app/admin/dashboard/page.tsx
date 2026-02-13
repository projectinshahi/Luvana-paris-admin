"use client";

import React, { useEffect, useMemo, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ShoppingCart, Users, Package, DollarSign } from "lucide-react";

type OrderItem = { product?: string; productNameEnglish?: string; quantity?: number; price?: number; };
type Order = { id: string; orderId?: string; customerName?: string; price?: number; discount?: number; shippingCharges?: number; paymentStatus?: string; status?: string; createdAt?: string; orderItem?: OrderItem[] };

export default function DashboardPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    const rawO = localStorage.getItem('lp:orders');
    if (rawO) setOrders(JSON.parse(rawO));
    const rawC = localStorage.getItem('lp:customers');
    if (rawC) setCustomers(JSON.parse(rawC));
    const rawP = localStorage.getItem('lp:products');
    if (rawP) setProducts(JSON.parse(rawP));
  }, []);

  const totals = useMemo(() => {
    const ordersCount = orders.length;
    const usersCount = customers.length;
    const productsCount = products.length;
    const sales = orders.reduce((s, o) => s + (Number(o.price || 0) - Number(o.discount || 0) + Number(o.shippingCharges || 0)), 0);
    return { ordersCount, usersCount, productsCount, sales };
  }, [orders, customers, products]);

  const topSelling = useMemo(() => {
    const map = new Map<string, { title: string; qty: number }>();
    orders.forEach(o => {
      (o.orderItem || []).forEach(it => {
        const key = it.productNameEnglish || it.product || 'Unknown';
        const entry = map.get(key) || { title: key, qty: 0 };
        entry.qty += Number(it.quantity || 0);
        map.set(key, entry);
      });
    });
    return Array.from(map.values()).sort((a, b) => b.qty - a.qty).slice(0, 5);
  }, [orders]);

  const recentOrders = useMemo(() => {
    return [...orders].sort((a, b) => (b.createdAt ? new Date(b.createdAt).getTime() : 0) - (a.createdAt ? new Date(a.createdAt).getTime() : 0)).slice(0, 8);
  }, [orders]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Dashboard</h2>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <Card className="p-4 flex items-center gap-4">
            <div className="p-2 bg-muted rounded-md"><ShoppingCart className="h-6 w-6" /></div>
            <div>
              <div className="text-sm text-muted-foreground">Orders</div>
              <div className="text-2xl font-semibold">{totals.ordersCount}</div>
            </div>
          </Card>
          <Card className="p-4 flex items-center gap-4">
            <div className="p-2 bg-muted rounded-md"><Users className="h-6 w-6" /></div>
            <div>
              <div className="text-sm text-muted-foreground">Users</div>
              <div className="text-2xl font-semibold">{totals.usersCount}</div>
            </div>
          </Card>
          <Card className="p-4 flex items-center gap-4">
            <div className="p-2 bg-muted rounded-md"><Package className="h-6 w-6" /></div>
            <div>
              <div className="text-sm text-muted-foreground">Products</div>
              <div className="text-2xl font-semibold">{totals.productsCount}</div>
            </div>
          </Card>
          <Card className="p-4 flex items-center gap-4">
            <div className="p-2 bg-muted rounded-md"><DollarSign className="h-6 w-6" /></div>
            <div>
              <div className="text-sm text-muted-foreground">Sales</div>
              <div className="text-2xl font-semibold">{totals.sales}</div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Card className="p-4 col-span-2">
            <h3 className="font-semibold mb-3">Recent Orders</h3>
            {recentOrders.length === 0 ? (
              <div className="text-muted-foreground">No recent orders</div>
            ) : (
              <table className="w-full text-left table-auto">
                <thead>
                  <tr className="text-sm text-muted-foreground">
                    <th className="px-4 py-2">Order ID</th>
                    <th className="px-4 py-2">Customer</th>
                    <th className="px-4 py-2">Amount</th>
                    <th className="px-4 py-2">Payment</th>
                    <th className="px-4 py-2">Date</th>
                    <th className="px-4 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map(o => (
                    <tr key={o.id} className="border-t">
                      <td className="px-4 py-3">{o.orderId}</td>
                      <td className="px-4 py-3">{o.customerName || '-'}</td>
                      <td className="px-4 py-3">{Number(o.price || 0) - Number(o.discount || 0) + Number(o.shippingCharges || 0)}</td>
                      <td className="px-4 py-3">{o.paymentStatus}</td>
                      <td className="px-4 py-3">{o.createdAt ? new Date(o.createdAt).toLocaleString() : '-'}</td>
                      <td className="px-4 py-3"><Link href={`/admin/order/${o.id}`}><Button variant="outline" size="sm">View</Button></Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>

          <Card className="p-4">
            <h3 className="font-semibold mb-3">Top Selling Products</h3>
            {topSelling.length === 0 ? (
              <div className="text-muted-foreground">No sales data</div>
            ) : (
              <ul className="space-y-2">
                {topSelling.map((p, idx) => (
                  <li key={idx} className="flex items-center justify-between">
                    <div>{p.title}</div>
                    <div className="text-sm text-muted-foreground">{p.qty}</div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
