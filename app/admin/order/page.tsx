"use client";

import React, { useEffect, useMemo, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { api } from "@/utils/api";

type OrderItem = {
  product?: { _id: string; nameEnglish?: string; nameArabic?: string } | string;
  productNameEnglish?: string;
  productNameArabic?: string;
  productImageEnglish?: string;
  productImageArabic?: string;
  variant?: { _id: string; color?: string; price?: number } | string;
  quantity?: number;
  price?: number;
  discount?: number;
};

type Order = {
  id: string;
  orderId: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
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
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | Order['status']>('all');
  const [filterPayment, setFilterPayment] = useState<'all' | Order['paymentStatus']>('all');
  const [sortBy, setSortBy] = useState<'createdAt' | 'price' | 'orderId'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [limit, setLimit] = useState(10);

  const fetchOrders = async (page: number = 1) => {
    try {
      setLoading(true);
      const data = await api.get<{ orders: any[]; pagination?: { currentPage: number; totalPages: number; totalOrders: number; limit: number } }>(`/admin/order?page=${page}&limit=${limit}`);
      const mapped = (data.orders || []).map((o) => ({
        id: o._id,
        orderId: o.orderId,
        customerName: o.user?.name,
        customerEmail: o.user?.email,
        customerPhone: o.user?.phone,
        price: o.price,
        discount: o.discount,
        shippingCharges: o.shippingCharges,
        status: o.status,
        paymentStatus: o.paymentStatus,
        createdAt: o.createdAt,
        orderItem: o.orderItem,
      })) as Order[];
      setOrders(mapped);
      if (data.pagination) {
        setCurrentPage(data.pagination.currentPage);
        setTotalPages(data.pagination.totalPages);
        setTotalOrders(data.pagination.totalOrders);
        setLimit(data.pagination.limit);
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(1);
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
  }, [orders]);

  const filtered = useMemo(() => {
    let result = orders.filter(o => {
      if (filterStatus !== 'all' && o.status !== filterStatus) return false;
      if (filterPayment !== 'all' && o.paymentStatus !== filterPayment) return false;
      if (!search) return true;
      const q = search.toLowerCase();
      return (o.orderId || '').toLowerCase().includes(q) || (o.customerName || '').toLowerCase().includes(q);
    });

    result = result.sort((a, b) => {
      let aVal: any = a[sortBy];
      let bVal: any = b[sortBy];

      if (sortBy === 'createdAt' || sortBy === 'price') {
        aVal = sortBy === 'createdAt' ? new Date(aVal || 0).getTime() : Number(aVal || 0);
        bVal = sortBy === 'createdAt' ? new Date(bVal || 0).getTime() : Number(bVal || 0);
      }

      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      } else {
        return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
      }
    });

    return result;
  }, [orders, search, filterStatus, filterPayment, sortBy, sortOrder]);

  const updatePayment = async (id: string, ps: Order['paymentStatus']) => {
    try {
      setUpdatingId(id);
      await api.patch(`/admin/order/${id}/payment-status`, { paymentStatus: ps });
      setOrders(s => s.map(o => o.id === id ? { ...o, paymentStatus: ps } : o));
    } catch (error) {
      console.error('Failed to update payment status:', error);
    } finally {
      setUpdatingId(null);
    }
  };

  const updateStatus = async (id: string, st: Order['status']) => {
    try {
      setUpdatingId(id);
      await api.patch(`/admin/order/${id}/status`, { status: st });
      setOrders(s => s.map(o => o.id === id ? { ...o, status: st } : o));
    } catch (error) {
      console.error('Failed to update status:', error);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Orders</h2>
        </div>

        <Card className="p-4">
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <input 
              placeholder="Search by order id or customer" 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              className="flex-1 rounded-md border px-3 py-2 min-w-[200px]" 
            />
            <select 
              value={filterStatus} 
              onChange={e => setFilterStatus(e.target.value as any)} 
              className="rounded-md border px-3 py-2"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
              <option value="returned">Returned</option>
            </select>
            <select 
              value={filterPayment} 
              onChange={e => setFilterPayment(e.target.value as any)} 
              className="rounded-md border px-3 py-2"
            >
              <option value="all">All Payments</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>
            <select 
              value={sortBy} 
              onChange={e => setSortBy(e.target.value as any)} 
              className="rounded-md border px-3 py-2"
            >
              <option value="createdAt">Date</option>
              <option value="price">Price</option>
              <option value="orderId">Order ID</option>
            </select>
            <select 
              value={sortOrder} 
              onChange={e => setSortOrder(e.target.value as any)} 
              className="rounded-md border px-3 py-2"
            >
              <option value="desc">Newest First</option>
              <option value="asc">Oldest First</option>
            </select>
          </div>

          {loading ? (
            <div className="py-12 text-center text-muted-foreground">Loading orders...</div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">No orders</div>
          ) : (
            <>
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
                      <select 
                        value={o.paymentStatus || 'pending'} 
                        onChange={e => updatePayment(o.id, e.target.value as any)} 
                        disabled={updatingId === o.id}
                        className="rounded-md border px-2 py-1 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <option value="pending">Pending</option>
                        <option value="paid">Paid</option>
                        <option value="failed">Failed</option>
                        <option value="refunded">Refunded</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 align-top">{o.createdAt ? new Date(o.createdAt).toLocaleString() : '-'}</td>
                    <td className="px-4 py-3 align-top">
                      <select 
                        value={o.status || 'pending'} 
                        onChange={e => updateStatus(o.id, e.target.value as any)} 
                        disabled={updatingId === o.id}
                        className="rounded-md border px-2 py-1 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
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
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {(currentPage - 1) * limit + 1} to {Math.min(currentPage * limit, totalOrders)} of {totalOrders} orders
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchOrders(currentPage - 1)}
                  disabled={currentPage === 1 || loading}
                >
                  ← Previous
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => fetchOrders(page)}
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
                  onClick={() => fetchOrders(currentPage + 1)}
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
