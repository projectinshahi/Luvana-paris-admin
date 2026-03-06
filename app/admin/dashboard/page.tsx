"use client";

import React, { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ShoppingCart, Users, Package, Coins, TrendingUp } from "lucide-react";
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
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
            <p className="text-slate-500 mt-1">Welcome back! Here's your business overview.</p>
          </div>
          <Button onClick={fetchDashboard} className="bg-blue-600 hover:bg-blue-700">Refresh Data</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Total Orders</p>
                <p className="text-4xl font-bold mt-2">{metrics.totalOrders}</p>
                <div className="text-xs text-blue-100 flex items-center gap-1 mt-3">
                  <TrendingUp className="h-3 w-3" /> {growth.orderGrowth}% increase
                </div>
              </div>
              <div className="p-3 bg-white/20 rounded-full"><ShoppingCart className="h-8 w-8" /></div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Total Users</p>
                <p className="text-4xl font-bold mt-2">{metrics.totalUsers}</p>
                <div className="text-xs text-green-100 mt-3">{metrics.totalActiveUsers} active users</div>
              </div>
              <div className="p-3 bg-white/20 rounded-full"><Users className="h-8 w-8" /></div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Total Products</p>
                <p className="text-4xl font-bold mt-2">{metrics.totalProducts}</p>
                <div className="text-xs text-purple-100 mt-3">In inventory</div>
              </div>
              <div className="p-3 bg-white/20 rounded-full"><Package className="h-8 w-8" /></div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-100 text-sm font-medium">Total Sales</p>
                <p className="text-4xl font-bold mt-2">KWD {metrics.totalSalesAmount}</p>
                <div className="text-xs text-amber-100 flex items-center gap-1 mt-3">
                  <TrendingUp className="h-3 w-3" /> {growth.salesGrowth}% increase
                </div>
              </div>
              <div className="p-3 bg-white/20 rounded-full"><Coins className="h-8 w-8" /></div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <h3 className="font-bold text-lg text-slate-900 mb-4">Revenue Breakdown</h3>
            <div className="space-y-4 text-sm">
              <div className="flex justify-between items-center pb-3 border-b border-slate-200">
                <span className="text-slate-600">Total Sales</span>
                <span className="font-semibold text-slate-900">KWD {metrics.totalSalesAmount}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-slate-200">
                <span className="text-slate-600">Discounts Applied</span>
                <span className="font-semibold text-red-600">-KWD {metrics.totalDiscount}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-slate-200">
                <span className="text-slate-600">Shipping Charges</span>
                <span className="font-semibold text-slate-900">KWD {metrics.totalShipping}</span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="font-semibold text-slate-800">Avg Order Value</span>
                <span className="font-bold text-blue-600 text-lg">KWD {metrics.averageOrderValue}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <h3 className="font-bold text-lg text-slate-900 mb-4">Order Status</h3>
            <div className="space-y-3 text-sm">
              {Object.entries(orderStatusBreakdown).map(([status, count]) => (
                <div key={status} className="flex justify-between items-center p-2 bg-slate-50 rounded-lg">
                  <span className="capitalize text-slate-600 font-medium">{status}</span>
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full font-semibold text-xs">{count}</span>
                </div>
              ))}
            </div>
          </div>


          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <h3 className="font-bold text-lg text-slate-900 mb-4">Payment Status</h3>
            <div className="space-y-3 text-sm">
              {Object.entries(paymentStatusBreakdown).map(([status, count]) => (
                <div key={status} className="flex justify-between items-center p-2 bg-slate-50 rounded-lg">
                  <span className="capitalize text-slate-600 font-medium">{status}</span>
                  <span className={`px-3 py-1 rounded-full font-semibold text-xs ${
                    status === 'paid' ? 'bg-green-100 text-green-700' : 
                    status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 
                    'bg-red-100 text-red-700'
                  }`}>
                    {count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-200">
              <h3 className="font-bold text-lg text-slate-900">Recent Orders</h3>
            </div>
            {recentOrders.length === 0 ? (
              <div className="p-6 text-center text-slate-500">No recent orders</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3 font-semibold text-slate-700">Order ID</th>
                      <th className="px-6 py-3 font-semibold text-slate-700">Customer</th>
                      <th className="px-6 py-3 font-semibold text-slate-700">Amount</th>
                      <th className="px-6 py-3 font-semibold text-slate-700">Payment</th>
                      <th className="px-6 py-3 font-semibold text-slate-700">Order Status</th>
                      <th className="px-6 py-3 font-semibold text-slate-700">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.slice(0, 8).map((order) => (
                      <tr key={order.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-3">
                          <Link href={`/admin/order/${order.id}`} className="text-blue-600 hover:text-blue-800 font-medium">
                            {order.orderId}
                          </Link>
                        </td>
                        <td className="px-6 py-3 text-slate-700">{order.customerName}</td>
                        <td className="px-6 py-3 font-semibold text-slate-900">KWD {order.amount - order.discount + order.shippingCharges}</td>
                        <td className="px-6 py-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            order.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' : 
                            order.paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-700' : 
                            'bg-red-100 text-red-700'
                          }`}>
                            {order.paymentStatus}
                          </span>
                        </td>
                        <td className="px-6 py-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            order.orderStatus === 'delivered' ? 'bg-green-100 text-green-700' : 
                            order.orderStatus === 'shipped' ? 'bg-blue-100 text-blue-700' : 
                            order.orderStatus === 'pending' ? 'bg-yellow-100 text-yellow-700' : 
                            'bg-red-100 text-red-700'
                          }`}>
                            {order.orderStatus}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-slate-600">{new Date(order.date).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <h3 className="font-bold text-lg text-slate-900 mb-4">Top Selling Products</h3>
            {topSellingProducts.length === 0 ? (
              <div className="text-center text-slate-500 py-4">No sales data available</div>
            ) : (
              <div className="space-y-3">
                {topSellingProducts.slice(0, 5).map((product, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                    {product.imageUrl && (
                      <img src={product.imageUrl} alt={product.productName} className="h-12 w-12 rounded-lg object-cover flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 truncate">{product.productName}</p>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-xs text-slate-600">Qty: {product.totalQuantity}</p>
                        <p className="text-sm font-semibold text-blue-600">KWD {product.totalRevenue}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
