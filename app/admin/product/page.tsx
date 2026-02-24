"use client";

import React, { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { api } from "@/utils/api";

type Product = {
  _id: string;
  category?: { _id: string; nameEnglish: string; nameArabic?: string };
  brand?: { _id: string; nameEnglish: string; nameArabic?: string };
  nameEnglish: string;
  nameArabic?: string;
  shortDescriptionEnglish?: string;
  shortDescriptionArabic?: string;
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
  __v: number;
};

const STORAGE_KEY = "lp:products";

export default function ProductListPage() {
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const data = await api.get<Product[]>('/admin/product');
      setItems(data);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete product?")) return;
    try {
      await api.delete(`/admin/product/${id}`);
      await fetchProducts();
    } catch (error) {
      console.error('Failed to delete product:', error);
    }
  };

  const toggleStatus = async (id: string) => {
    const product = items.find(p => p._id === id);
    if (!product) return;
    
    const newStatus = product.status === 'active' ? 'inactive' : 'active';
    try {
      await api.put(`/admin/product/${id}`, { ...product, status: newStatus });
      await fetchProducts();
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Products</h2>
          <div>
            <Link href="/admin/product/new"><Button><Plus className="mr-2 h-4 w-4" />New Product</Button></Link>
          </div>
        </div>

        <Card className="p-4">
          {loading ? (
            <div className="py-12 text-center text-muted-foreground">Loading products...</div>
          ) : items.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">No products</div>
          ) : (
            <table className="w-full text-left table-auto">
              <thead>
                <tr className="text-sm text-muted-foreground">
                  <th className="px-4 py-2">Name</th>
                  <th className="px-4 py-2">Category</th>
                  <th className="px-4 py-2">Brand</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((p) => (
                  <tr key={p._id} className="border-t">
                    <td className="px-4 py-3 align-top font-medium">{p.nameEnglish}</td>
                    <td className="px-4 py-3 align-top">{p.category?.nameEnglish || '-'}</td>
                    <td className="px-4 py-3 align-top">{p.brand?.nameEnglish || '-'}</td>
                    <td className="px-4 py-3 align-top">
                      <button className={`px-3 py-1 rounded text-sm font-medium ${p.status === 'active' ? 'bg-green-600 text-white' : 'bg-gray-200 text-muted-foreground'}`} onClick={() => toggleStatus(p._id)}>{p.status}</button>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="flex items-center gap-2">
                        <Link href={`/admin/product/${p._id}/edit`}><Button variant="outline" size="sm">Edit</Button></Link>
                        <Link href={`/admin/product/${p._id}`}><Button variant="ghost" size="sm">Variants</Button></Link>
                        <Button variant="destructive" size="sm" onClick={() => handleDelete(p._id)}>Delete</Button>
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
