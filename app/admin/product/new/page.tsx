"use client";

import React from "react";
import AdminLayout from "@/components/AdminLayout";
import ProductForm from "@/components/product/ProductForm";

export default function NewProductPage() {
  return (
    <AdminLayout>
      <div className="max-w-3xl mx-auto">
        <h2 className="text-2xl font-semibold mb-4">Create Product</h2>
        <ProductForm />
      </div>
    </AdminLayout>
  );
}
