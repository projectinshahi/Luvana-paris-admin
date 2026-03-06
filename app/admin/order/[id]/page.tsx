"use client";

import React, { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useParams } from "next/navigation";
import { api } from "@/utils/api";

type Product = {
  _id: string;
  nameEnglish?: string;
  nameArabic?: string;
  imageUrlEnglish?: Array<{ imageUrl: string }>;
  imageUrlArabic?: Array<{ imageUrl: string }>;
};

type Variant = {
  _id: string;
  color?: string;
  stock?: number;
  price?: number;
  mrp?: number;
};

type OrderItem = {
  _id?: string;
  product?: Product | string;
  productNameEnglish?: string;
  productNameArabic?: string;
  productImageEnglish?: string;
  productImageArabic?: string;
  variant?: Variant | string;
  quantity?: number;
  price?: number;
  discount?: number;
};

type ShippingAddress = {
  _id?: string;
  name?: string;
  phone?: string;
  email?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
};

type Order = {
  id: string;
  orderId: string;
  user?: { name?: string; email?: string; phone?: string };
  price?: number;
  discount?: number;
  shippingCharges?: number;
  status?: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled' | 'returned';
  paymentStatus?: 'pending' | 'paid' | 'failed' | 'refunded';
  createdAt?: string;
  orderItem?: OrderItem[];
  shippingAddress?: ShippingAddress;
  coupon?: any;
};

export default function OrderDetailPage() {
  const params = useParams() as any;
  const id = params?.id as string;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetchOrder();
  }, [id]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.get<{ order: any }>(`/admin/order/${id}`);
      const o = data.order;
      const mapped: Order = {
        id: o._id,
        orderId: o.orderId,
        user: o.user,
        price: o.price,
        discount: o.discount,
        shippingCharges: o.shippingCharges,
        status: o.status,
        paymentStatus: o.paymentStatus,
        createdAt: o.createdAt,
        orderItem: o.orderItem,
        shippingAddress: o.shippingAddress,
        coupon: o.coupon,
      };
      setOrder(mapped);
    } catch (err) {
      console.error('Failed to fetch order:', err);
      setError('Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (status: Order['status']) => {
    if (!order) return;
    try {
      setUpdating(true);
      await api.patch(`/admin/order/${id}/status`, { status });
      setOrder(prev => prev ? { ...prev, status } : null);
    } catch (err) {
      console.error('Failed to update status:', err);
      setError('Failed to update order status');
    } finally {
      setUpdating(false);
    }
  };

  const updatePaymentStatus = async (paymentStatus: Order['paymentStatus']) => {
    if (!order) return;
    try {
      setUpdating(true);
      await api.patch(`/admin/order/${id}/payment-status`, { paymentStatus });
      setOrder(prev => prev ? { ...prev, paymentStatus } : null);
    } catch (err) {
      console.error('Failed to update payment status:', err);
      setError('Failed to update payment status');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return (
    <AdminLayout>
      <div className="py-12 text-center text-muted-foreground">Loading order details...</div>
    </AdminLayout>
  );

  if (error || !order) return (
    <AdminLayout>
      <div className="py-12 text-center text-red-500">{error || 'Order not found'}</div>
    </AdminLayout>
  );

  const amount = (Number(order.price || 0) - Number(order.discount || 0) + Number(order.shippingCharges || 0));

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-2xl font-semibold">Order {order.orderId}</h2>
          <div className="flex items-end gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-muted-foreground">Payment Status</label>
              <select 
                value={order.paymentStatus || 'pending'} 
                onChange={e => updatePaymentStatus(e.target.value as any)} 
                disabled={updating}
                className="rounded-md border px-3 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="failed">Failed</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-muted-foreground">Order Status</label>
              <select 
                value={order.status || 'pending'} 
                onChange={e => updateStatus(e.target.value as any)} 
                disabled={updating}
                className="rounded-md border px-3 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
                <option value="returned">Returned</option>
              </select>
            </div>
          </div>
        </div>

        {error && (
          <Card className="p-4 bg-red-50 border-red-200">
            <div className="text-red-800">{error}</div>
          </Card>
        )}

        <Card className="p-4">
          <h3 className="font-semibold mb-4">Order Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">Customer</div>
              <div className="font-medium">{order.user?.name || '-'}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Email</div>
              <div className="font-medium text-sm">{order.user?.email || '-'}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Phone</div>
              <div className="font-medium">{order.user?.phone || '-'}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Order Date</div>
              <div className="font-medium text-sm">{order.createdAt ? new Date(order.createdAt).toLocaleString() : '-'}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Subtotal</div>
              <div className="font-medium">KWD {order.price || 0}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Discount</div>
              <div className="font-medium">-KWD {order.discount || 0}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Shipping</div>
              <div className="font-medium">KWD {order.shippingCharges || 0}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Total</div>
              <div className="font-semibold text-lg">KWD {amount}</div>
            </div>
          </div>
        </Card>

        {order.shippingAddress && (
          <Card className="p-4">
            <h3 className="font-semibold mb-4">Shipping Address</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Name</div>
                <div className="font-medium">{order.shippingAddress.name}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Phone</div>
                <div className="font-medium">{order.shippingAddress.phone}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Email</div>
                <div className="font-medium text-sm">{order.shippingAddress.email}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Address Line 1</div>
                <div className="font-medium">{order.shippingAddress.addressLine1}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Address Line 2</div>
                <div className="font-medium">{order.shippingAddress.addressLine2}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">City</div>
                <div className="font-medium">{order.shippingAddress.city}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">State</div>
                <div className="font-medium">{order.shippingAddress.state}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Country</div>
                <div className="font-medium">{order.shippingAddress.country}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Postal Code</div>
                <div className="font-medium">{order.shippingAddress.postalCode}</div>
              </div>
            </div>
          </Card>
        )}

        <Card className="p-4">
          <h3 className="font-semibold mb-4">Order Items</h3>
          {(!order.orderItem || order.orderItem.length === 0) ? (
            <div className="text-muted-foreground">No items</div>
          ) : (
            <div className="space-y-4">
              {order.orderItem!.map((it, idx) => {
                const variantInfo = typeof it.variant === 'object' ? it.variant : null;
                return (
                  <div key={it._id || idx} className="border rounded-lg p-4">
                    <div className="grid grid-cols-4 gap-4">
                      {it.productImageEnglish && (
                        <div>
                          <img src={it.productImageEnglish} alt={it.productNameEnglish} className="w-full rounded-md object-cover" />
                        </div>
                      )}
                      <div className="col-span-3">
                        <div className="font-semibold text-lg">{it.productNameEnglish || 'Unknown Product'}</div>
                        {it.productNameArabic && <div className="text-sm text-muted-foreground">{it.productNameArabic}</div>}
                        
                        <div className="grid grid-cols-2 gap-3 mt-3 text-sm">
                          <div>
                            <div className="text-muted-foreground">Variant</div>
                            {variantInfo?.color ? (
                              <div className="flex items-center gap-2 mt-1">
                                <div className="h-6 w-6 rounded border border-muted" style={{ backgroundColor: variantInfo.color }}></div>
                                <span className="font-mono text-xs">{variantInfo.color}</span>
                              </div>
                            ) : (
                              <div className="font-medium">-</div>
                            )}
                          </div>
                          <div>
                            <div className="text-muted-foreground">Quantity</div>
                            <div className="font-medium">{it.quantity}</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Unit Price</div>
                            <div className="font-medium">KWD {variantInfo?.price || it.price || 0}</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Subtotal</div>
                            <div className="font-medium">KWD {(Number(it.price || 0) * Number(it.quantity || 1))}</div>
                          </div>
                          {it.discount && (
                            <div>
                              <div className="text-muted-foreground">Discount</div>
                              <div className="font-medium">-KWD {it.discount}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </AdminLayout>
  );
}
