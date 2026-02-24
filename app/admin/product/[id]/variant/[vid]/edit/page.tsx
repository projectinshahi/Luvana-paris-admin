"use client";

import React from "react";
import AdminLayout from "@/components/AdminLayout";
import VariantForm from "@/components/product/VariantForm";
import { useParams } from "next/navigation";

export default function EditVariantPage() {
  const params = useParams() as any;
  const productId = params?.id as string;
  const vid = params?.vid as string;

  return (
    <AdminLayout>
      <div className="max-w-2xl mx-auto">
        <h2 className="text-2xl font-semibold mb-4">Edit Variant</h2>
        <VariantForm productId={productId} variantId={vid} />
      </div>
    </AdminLayout>
  );
}
