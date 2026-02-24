"use client";

import React, { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useParams } from "next/navigation";

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
  status?: string;
  paymentStatus?: string;
  createdAt?: string;
  orderItem?: OrderItem[];
  shippingAddress?: string;
};

const STORAGE_KEY = 'lp:orders';

export default function OrderDetailPage() {
  const params = useParams() as any;
  const id = params?.id as string;
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (!id) return;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const found = JSON.parse(raw).find((o: any) => o.id === id);
    if (found) setOrder(found);
  }, [id]);

  const updateField = (k: keyof Order, v: any) => {
    if (!order) return;
    const updated = { ...order, [k]: v };
    setOrder(updated);
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const all = JSON.parse(raw).map((o: any) => o.id === order.id ? updated : o);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  };

  if (!order) return (
    <AdminLayout>
      <div className="py-12 text-center">Order not found</div>
    </AdminLayout>
  );

  const amount = (Number(order.price || 0) - Number(order.discount || 0) + Number(order.shippingCharges || 0));

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Order {order.orderId}</h2>
          <div className="flex items-center gap-2">
            <select value={order.paymentStatus || 'pending'} onChange={e => updateField('paymentStatus', e.target.value)} className="rounded-md border px-2 py-1">
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>
            <select value={order.status || 'pending'} onChange={e => updateField('status', e.target.value)} className="rounded-md border px-2 py-1">
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
              <option value="returned">Returned</option>
            </select>
          </div>
        </div>

        <Card className="p-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">Customer</div>
              <div className="font-medium">{order.customerName}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Amount</div>
              <div className="font-medium">{amount}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Payment</div>
              <div className="font-medium">{order.paymentStatus}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Order Date</div>
              <div className="font-medium">{order.createdAt ? new Date(order.createdAt).toLocaleString() : '-'}</div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="font-semibold mb-3">Items</h3>
          {(!order.orderItem || order.orderItem.length === 0) ? (
            <div className="text-muted-foreground">No items</div>
          ) : (
            <table className="w-full text-left table-auto">
              <thead>
                <tr className="text-sm text-muted-foreground">
                  <th className="px-4 py-2">Product</th>
                  <th className="px-4 py-2">Variant</th>
                  <th className="px-4 py-2">Qty</th>
                  <th className="px-4 py-2">Price</th>
                </tr>
              </thead>
              <tbody>
                {order.orderItem!.map((it, idx) => (
                  <tr key={idx} className="border-t">
                    <td className="px-4 py-3 align-top font-medium">{it.productNameEnglish || it.product}</td>
                    <td className="px-4 py-3 align-top">{it.variant || '-'}</td>
                    <td className="px-4 py-3 align-top">{it.quantity}</td>
                    <td className="px-4 py-3 align-top">{it.price}</td>
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
