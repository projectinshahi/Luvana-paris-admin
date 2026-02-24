"use client";

import React from "react";
import AdminLayout from "@/components/AdminLayout";
import VariantForm from "@/components/product/VariantForm";
import { useParams } from "next/navigation";

export default function NewVariantPage() {
  const params = useParams() as any;
  const productId = params?.id as string;

  return (
    <AdminLayout>
      <div className="max-w-2xl mx-auto">
        <h2 className="text-2xl font-semibold mb-4">Create Variant</h2>
        <VariantForm productId={productId} />
      </div>
    </AdminLayout>
  );
}
