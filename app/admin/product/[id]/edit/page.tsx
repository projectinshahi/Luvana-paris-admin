"use client";

import React from "react";
import AdminLayout from "@/components/AdminLayout";
import ProductForm from "@/components/product/ProductForm";
import { useParams } from "next/navigation";

export default function EditProductPage() {
  const params = useParams() as any;
  const id = params?.id as string;

  return (
    <AdminLayout>
      <div className="max-w-3xl mx-auto">
        <h2 className="text-2xl font-semibold mb-4">Edit Product</h2>
        <ProductForm productId={id} />
      </div>
    </AdminLayout>
  );
}
