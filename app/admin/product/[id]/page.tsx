"use client";

import React, { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useParams } from "next/navigation";

type Product = { id: string; nameEnglish: string };
type Variant = { id: string; product: string; nameEnglish: string; price?: number; stock?: number; status?: string };

const PRODUCTS_KEY = "lp:products";
const VARIANTS_KEY = "lp:productVariants";

export default function ProductDetailPage() {
  const params = useParams() as any;
  const id = params?.id as string;
  const [product, setProduct] = useState<Product | null>(null);
  const [variants, setVariants] = useState<Variant[]>([]);

  useEffect(() => {
    if (!id) return;
    const raw = localStorage.getItem(PRODUCTS_KEY);
    if (raw) {
      const found = JSON.parse(raw).find((p: any) => p.id === id);
      if (found) setProduct(found);
    }

    const rawV = localStorage.getItem(VARIANTS_KEY);
    if (rawV) {
      const all = JSON.parse(rawV) as Variant[];
      setVariants(all.filter((v) => v.product === id));
    }
  }, [id]);

  const handleDelete = (vid: string) => {
    if (!confirm('Delete variant?')) return;
    const rawV = localStorage.getItem(VARIANTS_KEY);
    if (!rawV) return;
    const all = JSON.parse(rawV).filter((v: any) => v.id !== vid);
    localStorage.setItem(VARIANTS_KEY, JSON.stringify(all));
    setVariants(all.filter((v: any) => v.product === id));
  };

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Product: {product?.nameEnglish}</h2>
          <div className="flex items-center gap-2">
            <Link href={`/admin/product/${id}/edit`}><Button variant="outline">Edit Product</Button></Link>
            <Link href={`/admin/product/${id}/variant/new`}><Button>New Variant</Button></Link>
          </div>
        </div>

        <Card className="p-4">
          {variants.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">No variants</div>
          ) : (
            <table className="w-full text-left table-auto">
              <thead>
                <tr className="text-sm text-muted-foreground">
                  <th className="px-4 py-2">Name</th>
                  <th className="px-4 py-2">Price</th>
                  <th className="px-4 py-2">Stock</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {variants.map((v) => (
                  <tr key={v.id} className="border-t">
                    <td className="px-4 py-3 align-top font-medium">{v.nameEnglish}</td>
                    <td className="px-4 py-3 align-top">{v.price ?? '-'}</td>
                    <td className="px-4 py-3 align-top">{v.stock ?? '-'}</td>
                    <td className="px-4 py-3 align-top">{v.status || '-'}</td>
                    <td className="px-4 py-3 align-top">
                      <div className="flex items-center gap-2">
                        <Link href={`/admin/product/${id}/variant/${v.id}/edit`}><Button variant="outline" size="sm">Edit</Button></Link>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(v.id)}>Delete</Button>
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
