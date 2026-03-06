"use client";

import React, { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/utils/api";

type Customer = { 
  id: string; 
  name?: string; 
  email?: string; 
  phone?: string; 
  status?: string; 
  lastlogin?: string;
  createdAt?: string;
  updatedAt?: string;
};

type Order = { 
  id: string; 
  orderId?: string; 
  price?: number; 
  discount?: number; 
  shippingCharges?: number; 
  paymentStatus?: string; 
  status?: string; 
  createdAt?: string;
  orderItem?: any[];
};

export default function CustomerDetailPage() {
  const params = useParams() as any;
  const id = params?.id as string;
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);

  useEffect(() => {
    if (!id) return;
    fetchCustomerDetails();
  }, [id]);

  const fetchCustomerDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.get<{ user: any; orders: { list: any[]; totalCount: number; totalSpent: number } }>(`/admin/customer/${id}`);
      
      const mappedCustomer: Customer = {
        id: data.user._id,
        name: data.user.name,
        email: data.user.email,
        phone: data.user.phone,
        status: data.user.status,
        lastlogin: data.user.lastlogin,
        createdAt: data.user.createdAt,
        updatedAt: data.user.updatedAt,
      };
      setCustomer(mappedCustomer);

      const mappedOrders: Order[] = data.orders.list.map((o: any) => ({
        id: o._id,
        orderId: o.orderId,
        price: o.price,
        discount: o.discount,
        shippingCharges: o.shippingCharges,
        paymentStatus: o.paymentStatus,
        status: o.status,
        createdAt: o.createdAt,
        orderItem: o.orderItem,
      }));
      setOrders(mappedOrders);
      setTotalOrders(data.orders.totalCount);
      setTotalSpent(data.orders.totalSpent);
    } catch (err) {
      console.error('Failed to fetch customer details:', err);
      setError('Failed to load customer details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <AdminLayout>
      <div className="py-12 text-center text-muted-foreground">Loading customer details...</div>
    </AdminLayout>
  );

  if (error || !customer) return (
    <AdminLayout>
      <div className="py-12 text-center text-red-500">{error || 'Customer not found'}</div>
    </AdminLayout>
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Customer: {customer.name}</h2>
        </div>

        <Card className="p-4">
          <h3 className="font-semibold mb-4">Customer Information</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">Email</div>
              <div className="font-medium">{customer.email}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Phone</div>
              <div className="font-medium">{customer.phone || '-'}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Status</div>
              <div className="font-medium">
                <span className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${customer.status === 'active' ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                  {customer.status}
                </span>
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Last Login</div>
              <div className="font-medium">{customer.lastlogin ? new Date(customer.lastlogin).toLocaleString() : '-'}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Joined Date</div>
              <div className="font-medium">{customer.createdAt ? new Date(customer.createdAt).toLocaleString() : '-'}</div>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-2 gap-4">
          <Card className="p-4">
            <div className="text-sm text-muted-foreground">Total Orders</div>
            <div className="text-2xl font-semibold">{totalOrders}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-muted-foreground">Total Spent</div>
            <div className="text-2xl font-semibold">KWD {totalSpent}</div>
          </Card>
        </div>

        <Card className="p-4">
          <h3 className="font-semibold mb-4">Order History</h3>
          {orders.length === 0 ? (
            <div className="text-muted-foreground">No orders for this customer</div>
          ) : (
            <table className="w-full text-left table-auto">
              <thead>
                <tr className="text-sm text-muted-foreground">
                  <th className="px-4 py-2">Order ID</th>
                  <th className="px-4 py-2">Items</th>
                  <th className="px-4 py-2">Amount</th>
                  <th className="px-4 py-2">Payment</th>
                  <th className="px-4 py-2">Order Date</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(o => {
                  const amount = Number(o.price || 0) - Number(o.discount || 0) + Number(o.shippingCharges || 0);
                  return (
                    <tr key={o.id} className="border-t">
                      <td className="px-4 py-3 align-top font-medium">{o.orderId}</td>
                      <td className="px-4 py-3 align-top">{(o.orderItem || []).length} item(s)</td>
                      <td className="px-4 py-3 align-top">KWD {amount}</td>
                      <td className="px-4 py-3 align-top">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          o.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' : 
                          o.paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          o.paymentStatus === 'failed' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {o.paymentStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3 align-top">{o.createdAt ? new Date(o.createdAt).toLocaleString() : '-'}</td>
                      <td className="px-4 py-3 align-top">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          o.status === 'delivered' ? 'bg-green-100 text-green-800' : 
                          o.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                          o.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          o.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {o.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <Link href={`/admin/order/${o.id}`}>
                          <Button className="bg-purple-600 hover:bg-purple-700 text-white" size="sm">View</Button>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </Card>
      </div>
    </AdminLayout>
  );
}
