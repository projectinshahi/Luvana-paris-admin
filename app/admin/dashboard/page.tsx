"use client";

import React, { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ShoppingCart, Users, Package, DollarSign, TrendingUp } from "lucide-react";
import { api } from "@/utils/api";

type DashboardData = {
  metrics: {
    totalOrders: number;
    totalUsers: number;
    totalActiveUsers: number;
    totalProducts: number;
    totalSalesAmount: number;
    totalDiscount: number;
    totalShipping: number;
    averageOrderValue: number;
  };
  growth: {
    orderGrowth: number;
    salesGrowth: number;
  };
  recentOrders: Array<{
    id: string;
    orderId: string;
    customerName: string;
    customerEmail: string;
    amount: number;
    discount: number;
    shippingCharges: number;
    paymentStatus: string;
    orderStatus: string;
    orderItems: Array<{
      product: string;
      productName: string;
      quantity: number;
      price: number;
    }>;
    date: string;
  }>;
  topSellingProducts: Array<{
    productId: string;
    productName: string;
    productNameArabic?: string;
    totalQuantity: number;
    totalRevenue: number;
    imageUrl?: string;
  }>;
  orderStatusBreakdown: Record<string, number>;
  paymentStatusBreakdown: Record<string, number>;
  ordersByDate: Array<{
    _id: string;
    count: number;
    revenue: number;
  }>;
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const response = await api.get<DashboardData>('/admin/dashboard');
      setData(response);
    } catch (error) {
      console.error('Failed to fetch dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold">Dashboard</h2>
          <div className="text-center text-muted-foreground">Loading dashboard...</div>
        </div>
      </AdminLayout>
    );
  }

  if (!data) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold">Dashboard</h2>
          <div className="text-center text-muted-foreground">Failed to load dashboard</div>
        </div>
      </AdminLayout>
    );
  }

  const { metrics, growth, recentOrders, topSellingProducts, orderStatusBreakdown, paymentStatusBreakdown } = data;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Dashboard</h2>
          <div>
            <Button variant="outline" size="sm" onClick={fetchDashboard}>Refresh</Button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <Card className="p-4 flex items-center gap-4">
            <div className="p-2 bg-blue-100 rounded-md"><ShoppingCart className="h-6 w-6 text-blue-600" /></div>
            <div>
              <div className="text-sm text-muted-foreground">Total Orders</div>
              <div className="text-2xl font-semibold">{metrics.totalOrders}</div>
              <div className="text-xs text-green-600 flex items-center gap-1 mt-1">
                <TrendingUp className="h-3 w-3" /> {growth.orderGrowth}% growth
              </div>
            </div>
          </Card>

          <Card className="p-4 flex items-center gap-4">
            <div className="p-2 bg-green-100 rounded-md"><Users className="h-6 w-6 text-green-600" /></div>
            <div>
              <div className="text-sm text-muted-foreground">Total Users</div>
              <div className="text-2xl font-semibold">{metrics.totalUsers}</div>
              <div className="text-xs text-muted-foreground mt-1">{metrics.totalActiveUsers} active</div>
            </div>
          </Card>

          <Card className="p-4 flex items-center gap-4">
            <div className="p-2 bg-purple-100 rounded-md"><Package className="h-6 w-6 text-purple-600" /></div>
            <div>
              <div className="text-sm text-muted-foreground">Total Products</div>
              <div className="text-2xl font-semibold">{metrics.totalProducts}</div>
            </div>
          </Card>

          <Card className="p-4 flex items-center gap-4">
            <div className="p-2 bg-amber-100 rounded-md"><DollarSign className="h-6 w-6 text-amber-600" /></div>
            <div>
              <div className="text-sm text-muted-foreground">Total Sales</div>
              <div className="text-2xl font-semibold">${metrics.totalSalesAmount}</div>
              <div className="text-xs text-green-600 flex items-center gap-1 mt-1">
                <TrendingUp className="h-3 w-3" /> {growth.salesGrowth}% growth
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Card className="p-4">
            <h3 className="font-semibold mb-3 text-sm">Revenue Breakdown</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Sales</span>
                <span className="font-medium">${metrics.totalSalesAmount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Discounts</span>
                <span className="font-medium text-red-600">-${metrics.totalDiscount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping</span>
                <span className="font-medium">${metrics.totalShipping}</span>
              </div>
              <div className="border-t pt-2 flex justify-between">
                <span className="font-semibold">Avg Order Value</span>
                <span className="font-semibold">${metrics.averageOrderValue}</span>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="font-semibold mb-3 text-sm">Order Status</h3>
            <div className="space-y-2 text-sm">
              {Object.entries(orderStatusBreakdown).map(([status, count]) => (
                <div key={status} className="flex justify-between items-center">
                  <span className="capitalize text-muted-foreground">{status}</span>
                  <span className="px-2 py-1 bg-gray-100 rounded text-sm font-medium">{count}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="font-semibold mb-3 text-sm">Payment Status</h3>
            <div className="space-y-2 text-sm">
              {Object.entries(paymentStatusBreakdown).map(([status, count]) => (
                <div key={status} className="flex justify-between items-center">
                  <span className="capitalize text-muted-foreground">{status}</span>
                  <span className={`px-2 py-1 rounded text-sm font-medium ${status === 'paid' ? 'bg-green-100 text-green-700' : status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                    {count}
                  </span>
                </div>
              ))}
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
                  <tr className="text-sm text-muted-foreground border-b">
                    <th className="px-4 py-2">Order ID</th>
                    <th className="px-4 py-2">Customer</th>
                    <th className="px-4 py-2">Amount</th>
                    <th className="px-4 py-2">Payment</th>
                    <th className="px-4 py-2">Order Status</th>
                    <th className="px-4 py-2">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.slice(0, 8).map((order) => (
                    <tr key={order.id} className="border-t text-sm">
                      <td className="px-4 py-3">
                        <Link href={`/admin/order/${order.id}`} className="text-blue-600 hover:underline">
                          {order.orderId}
                        </Link>
                      </td>
                      <td className="px-4 py-3">{order.customerName}</td>
                      <td className="px-4 py-3">${order.amount - order.discount + order.shippingCharges}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${order.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' : order.paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                          {order.paymentStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${order.orderStatus === 'delivered' ? 'bg-green-100 text-green-700' : order.orderStatus === 'shipped' ? 'bg-blue-100 text-blue-700' : order.orderStatus === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                          {order.orderStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3">{new Date(order.date).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>

          <Card className="p-4">
            <h3 className="font-semibold mb-3">Top Selling Products</h3>
            {topSellingProducts.length === 0 ? (
              <div className="text-muted-foreground">No sales data</div>
            ) : (
              <div className="space-y-3">
                {topSellingProducts.slice(0, 5).map((product, idx) => (
                  <div key={idx} className="border-b pb-3 last:border-b-0">
                    <div className="flex items-start gap-2">
                      {product.imageUrl && (
                        <img src={product.imageUrl} alt={product.productName} className="h-10 w-10 rounded object-cover" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{product.productName}</div>
                        <div className="text-xs text-muted-foreground">Qty: {product.totalQuantity}</div>
                        <div className="text-xs font-semibold text-amber-600">${product.totalRevenue}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
