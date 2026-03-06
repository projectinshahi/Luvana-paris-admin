"use client";

import React, { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import AdminLayout from "@/components/AdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api } from "@/utils/api";

type Product = { id: string; nameEnglish: string };
type Variant = { id: string; product: string; nameEnglish: string; price?: number; stock?: number; status?: string };

export default function ProductDetailPage() {
  const params = useParams() as any;
  const id = params?.id as string;
  const [product, setProduct] = useState<Product | null>(null);
  const [variants, setVariants] = useState<Variant[]>([]);

  useEffect(() => {
    if (!id) return;
    fetchProduct();
    fetchVariants();
  }, [id]);

  const fetchProduct = async () => {
    try {
      const data = await api.get<any>(`/admin/product/${id}`);
      const p = data.product || data;
      setProduct({ id: p._id, nameEnglish: p.nameEnglish });
    } catch (error) {
      console.error("Failed to fetch product:", error);
    }
  };

  const fetchVariants = async () => {
    try {
      const data = await api.get<any>(`/admin/product-variant/product/${id}`);
      const list = data.variants || data.list || data || [];
      const mapped = (Array.isArray(list) ? list : []).map((v: any) => ({
        id: v._id,
        product: typeof v.product === "string" ? v.product : v.product?._id,
        nameEnglish: v.nameEnglish,
        price: v.price,
        stock: v.stock,
        status: v.status,
      })) as Variant[];
      setVariants(mapped);
    } catch (error) {
      console.error("Failed to fetch variants:", error);
      setVariants([]);
    }
  };

  const handleDelete = async (vid: string) => {
    if (!confirm('Delete variant?')) return;
    try {
      await api.delete(`/admin/product/${id}/variant/${vid}`);
      await fetchVariants();
    } catch (error) {
      console.error("Failed to delete variant:", error);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Product: {product?.nameEnglish}</h2>
            <div className="flex items-center gap-2">
            <Link href={`/admin/product/${id}/edit`}><Button className="bg-blue-600 hover:bg-blue-700 text-white">Edit Product</Button></Link>
            <Link href={`/admin/product/${id}/variant/new`}><Button><Plus className="mr-2 h-4 w-4" />New Variant</Button></Link>
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
                        <Link href={`/admin/product/${id}/variant/${v.id}/edit`}><Button className="bg-blue-600 hover:bg-blue-700 text-white" size="sm">Edit</Button></Link>
                        <Button className="bg-red-600 hover:bg-red-700 text-white" size="sm" onClick={() => handleDelete(v.id)}>Delete</Button>
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
