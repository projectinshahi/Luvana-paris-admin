"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { api } from "@/utils/api";

type VariantPayload = {
  id?: string;
  product?: string;
  nameEnglish?: string;
  nameArabic?: string;
  color?: string;
  stock?: number;
  price?: number;
  mrp?: number;
  imageUrlEnglish?: Array<{ imageUrl: string }>;
  imageUrlArabic?: Array<{ imageUrl: string }>;
};

export default function VariantForm({ productId, variantId }: { productId?: string; variantId?: string } = {}) {
  const router = useRouter();
  const [form, setForm] = useState<VariantPayload>({ nameEnglish: '', price: 0, stock: 0, product: productId });
  const [existingImageUrlEnglish, setExistingImageUrlEnglish] = useState<string[]>([]);
  const [existingImageUrlArabic, setExistingImageUrlArabic] = useState<string[]>([]);
  const [imageFilesEnglish, setImageFilesEnglish] = useState<File[]>([]);
  const [imageFilesArabic, setImageFilesArabic] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!variantId || !productId) return;
    fetchVariant();
  }, [variantId, productId]);

  const fetchVariant = async () => {
    try {
      const data = await api.get<any>(`/admin/product-variant/${variantId}`);
      const v = data.variant || data;
      setForm({
        id: v._id,
        product: v.product,
        nameEnglish: v.nameEnglish,
        nameArabic: v.nameArabic,
        color: v.color,
        stock: v.stock,
        price: v.price,
        mrp: v.mrp,
      });
      setExistingImageUrlEnglish((v.imageUrlEnglish || []).map((img: any) => img.imageUrl || "").filter(Boolean));
      setExistingImageUrlArabic((v.imageUrlArabic || []).map((img: any) => img.imageUrl || "").filter(Boolean));
    } catch (error) {
      console.error("Failed to fetch variant:", error);
    }
  };

  const uploadFiles = async (files: File[]): Promise<string[]> => {
    if (files.length === 0) return [];
    const endpoint = process.env.NEXT_PUBLIC_UPLOAD_URL;
    if (!endpoint) {
      throw new Error("Upload endpoint is not configured");
    }

    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));

    const response = await fetch(endpoint, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Failed to upload files");
    }

    const data = await response.json();
    return data.urls || data.imageUrls || [];
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'price' || name === 'stock' || name === 'mrp') {
      setForm((s) => ({ ...s, [name]: Number(value) }));
    } else {
      setForm((s) => ({ ...s, [name]: value }));
    }
  };

  const submit = async () => {
    setSaving(true);
    try {
      const uploadedEnglish = await uploadFiles(imageFilesEnglish);
      const uploadedArabic = await uploadFiles(imageFilesArabic);
      const finalEnglish = existingImageUrlEnglish.concat(uploadedEnglish);
      const finalArabic = existingImageUrlArabic.concat(uploadedArabic);

      const payload: VariantPayload = {
        product: productId,
        nameEnglish: form.nameEnglish,
        nameArabic: form.nameArabic,
        color: form.color,
        stock: form.stock,
        price: form.price,
        mrp: form.mrp,
        imageUrlEnglish: finalEnglish.map((url) => ({ imageUrl: url })),
        imageUrlArabic: finalArabic.map((url) => ({ imageUrl: url })),
      };

      if (variantId) {
        await api.put(`/admin/product-variant/${variantId}`, payload);
      } else {
        await api.post(`/admin/product-variant`, payload);
      }
      router.push(`/admin/product/${productId}`);
    } finally {
      setSaving(false);
    }
  };

  const removeExistingImage = (type: "en" | "ar", idx: number) => {
    if (type === "en") {
      setExistingImageUrlEnglish((prev) => prev.filter((_, i) => i !== idx));
    } else {
      setExistingImageUrlArabic((prev) => prev.filter((_, i) => i !== idx));
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm text-muted-foreground mb-1">Name (English)</label>
        <Input name="nameEnglish" value={form.nameEnglish || ''} onChange={handleChange} />
      </div>

      <div>
        <label className="block text-sm text-muted-foreground mb-1">Name (Arabic)</label>
        <Input name="nameArabic" value={form.nameArabic || ''} onChange={handleChange} />
      </div>

      <div>
        <label className="block text-sm text-muted-foreground mb-1">Color</label>
        <Input name="color" value={form.color || ''} onChange={handleChange} />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-sm text-muted-foreground mb-1">Price</label>
          <Input name="price" type="number" value={String(form.price ?? 0)} onChange={handleChange} />
        </div>
        <div>
          <label className="block text-sm text-muted-foreground mb-1">MRP</label>
          <Input name="mrp" type="number" value={String(form.mrp ?? 0)} onChange={handleChange} />
        </div>
        <div>
          <label className="block text-sm text-muted-foreground mb-1">Stock</label>
          <Input name="stock" type="number" value={String(form.stock ?? 0)} onChange={handleChange} />
        </div>
      </div>

      <div>
        <label className="block text-sm text-muted-foreground mb-2">Images (English)</label>
        {existingImageUrlEnglish.length > 0 && (
          <div className="mb-3 space-y-2">
            {existingImageUrlEnglish.map((url, idx) => (
              <div key={`existing-en-${idx}`} className="flex items-center justify-between gap-2 text-sm">
                <span className="truncate">{url}</span>
                <Button variant="outline" type="button" onClick={() => removeExistingImage("en", idx)}>Remove</Button>
              </div>
            ))}
          </div>
        )}
        <Input
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => setImageFilesEnglish(Array.from(e.target.files || []))}
        />
        {imageFilesEnglish.length > 0 && (
          <div className="mt-2 text-sm text-muted-foreground">
            {imageFilesEnglish.length} file(s) selected
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm text-muted-foreground mb-2">Images (Arabic)</label>
        {existingImageUrlArabic.length > 0 && (
          <div className="mb-3 space-y-2">
            {existingImageUrlArabic.map((url, idx) => (
              <div key={`existing-ar-${idx}`} className="flex items-center justify-between gap-2 text-sm">
                <span className="truncate">{url}</span>
                <Button variant="outline" type="button" onClick={() => removeExistingImage("ar", idx)}>Remove</Button>
              </div>
            ))}
          </div>
        )}
        <Input
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => setImageFilesArabic(Array.from(e.target.files || []))}
        />
        {imageFilesArabic.length > 0 && (
          <div className="mt-2 text-sm text-muted-foreground">
            {imageFilesArabic.length} file(s) selected
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={() => router.push(`/admin/product/${productId}`)}>Cancel</Button>
        <Button onClick={submit} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
      </div>
    </div>
  );
}
