"use client";

import React, { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Link from "next/link";

type Product = {
  id: string;
  category?: string;
  brand?: string;
  nameEnglish: string;
  nameArabic?: string;
  shortDescriptionEnglish?: string;
  shortDescriptionArabic?: string;
  status: "active" | "inactive";
};

const STORAGE_KEY = "lp:products";

export default function ProductListPage() {
  const [items, setItems] = useState<Product[]>([]);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) setItems(JSON.parse(raw));
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const handleDelete = (id: string) => {
    if (!confirm("Delete product?")) return;
    setItems((s) => s.filter((p) => p.id !== id));
  };

  const toggleStatus = (id: string) => {
    setItems((s) => s.map((p) => p.id === id ? { ...p, status: p.status === 'active' ? 'inactive' : 'active' } : p));
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
          {items.length === 0 ? (
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
                  <tr key={p.id} className="border-t">
                    <td className="px-4 py-3 align-top font-medium">{p.nameEnglish}</td>
                    <td className="px-4 py-3 align-top">{p.category || '-'}</td>
                    <td className="px-4 py-3 align-top">{p.brand || '-'}</td>
                    <td className="px-4 py-3 align-top">
                      <button className={`px-3 py-1 rounded text-sm font-medium ${p.status === 'active' ? 'bg-green-600 text-white' : 'bg-gray-200 text-muted-foreground'}`} onClick={() => toggleStatus(p.id)}>{p.status}</button>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="flex items-center gap-2">
                        <Link href={`/admin/product/${p.id}/edit`}><Button variant="outline" size="sm">Edit</Button></Link>
                        <Link href={`/admin/product/${p.id}`}><Button variant="ghost" size="sm">Variants</Button></Link>
                        <Button variant="destructive" size="sm" onClick={() => handleDelete(p.id)}>Delete</Button>
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
