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
  imageUrlEnglish?: Array<{ imageUrl: string; publicId?: string }>;
  imageUrlArabic?: Array<{ imageUrl: string; publicId?: string }>;
};

export default function VariantForm({ productId, variantId }: { productId?: string; variantId?: string } = {}) {
  const router = useRouter();
  const [form, setForm] = useState<VariantPayload>({ nameEnglish: '', price: 0, stock: 0, product: productId });
  const [existingImageUrlEnglish, setExistingImageUrlEnglish] = useState<Array<{ imageUrl: string; publicId?: string }>>([]);
  const [existingImageUrlArabic, setExistingImageUrlArabic] = useState<Array<{ imageUrl: string; publicId?: string }>>([]);
  const [imageFilesEnglish, setImageFilesEnglish] = useState<File[]>([]);
  const [imageFilesArabic, setImageFilesArabic] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deletedPublicIds, setDeletedPublicIds] = useState<string[]>([]);

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
      setExistingImageUrlEnglish((v.imageUrlEnglish || []).map((img: any) => ({ imageUrl: img.imageUrl || "", publicId: img.publicId })).filter((img: any) => img.imageUrl));
      setExistingImageUrlArabic((v.imageUrlArabic || []).map((img: any) => ({ imageUrl: img.imageUrl || "", publicId: img.publicId })).filter((img: any) => img.imageUrl));
    } catch (error) {
      console.error("Failed to fetch variant:", error);
    }
  };

  const uploadFiles = async (files: File[]): Promise<Array<{ imageUrl: string; publicId: string }>> => {
    if (files.length === 0) return [];
    setUploading(true);

    try {
      const uploads = await Promise.all(
        files.map(async (file) => {
          const formData = new FormData();
          formData.append("image", file);

          const response = await api.post<{
            message: string;
            image: {
              url: string;
              publicId: string;
              width: number;
              height: number;
              size: number;
              format: string;
            };
          }>("/admin/general/upload-image", formData);

          return { imageUrl: response.image.url, publicId: response.image.publicId };
        })
      );

      return uploads;
    } catch (error) {
      console.error("Failed to upload images:", error);
      alert(error instanceof Error ? error.message : "Failed to upload images");
      throw error;
    } finally {
      setUploading(false);
    }
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
      if (deletedPublicIds.length > 0) {
        await Promise.all(
          deletedPublicIds.map((publicId) =>
            api.delete(`/admin/general/delete-image`, { publicId })
          )
        );
      }

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
        imageUrlEnglish: finalEnglish,
        imageUrlArabic: finalArabic,
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
      setExistingImageUrlEnglish((prev) => {
        const removed = prev[idx];
        if (removed?.publicId) {
          setDeletedPublicIds((ids) => (ids.includes(removed.publicId as string) ? ids : [...ids, removed.publicId as string]));
        }
        return prev.filter((_, i) => i !== idx);
      });
    } else {
      setExistingImageUrlArabic((prev) => {
        const removed = prev[idx];
        if (removed?.publicId) {
          setDeletedPublicIds((ids) => (ids.includes(removed.publicId as string) ? ids : [...ids, removed.publicId as string]));
        }
        return prev.filter((_, i) => i !== idx);
      });
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
        <div className="flex items-center gap-3">
          <input 
            type="color" 
            name="color" 
            value={form.color || '#000000'} 
            onChange={handleChange}
            className="h-10 w-20 rounded cursor-pointer border border-muted"
          />
          <span className="text-sm font-mono text-muted-foreground">{form.color || '#000000'}</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-sm text-muted-foreground mb-1">Selling Price</label>
          <Input name="price" type="number" value={String(form.price ?? 0)} onChange={handleChange} />
        </div>
        <div>
          <label className="block text-sm text-muted-foreground mb-1">Actual Price</label>
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
              <div key={`existing-en-${idx}`} className="flex items-center justify-between gap-3 text-sm">
                <div className="flex items-center gap-2 min-w-0">
                  <img src={url.imageUrl} alt="preview" className="h-10 w-10 rounded object-cover" />
                  <Button variant="outline" type="button" onClick={() => removeExistingImage("en", idx)}>Remove</Button>
                </div>
              </div>
            ))}
          </div>
        )}
        <Input
          type="file"
          multiple
          accept="image/*,.heic,.heif,.avif,.webp"
          onChange={(e) => setImageFilesEnglish(Array.from(e.target.files || []))}
          disabled={uploading}
        />
        {imageFilesEnglish.length > 0 && (
          <div className="mt-3 grid grid-cols-4 gap-2">
            {imageFilesEnglish.map((file, idx) => (
              <img
                key={`new-en-${idx}`}
                src={URL.createObjectURL(file)}
                alt="preview"
                className="h-20 w-20 rounded object-cover"
              />
            ))}
          </div>
        )}
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
              <div key={`existing-ar-${idx}`} className="flex items-center justify-between gap-3 text-sm">
                <div className="flex items-center gap-2 min-w-0">
                  <img src={url.imageUrl} alt="preview" className="h-10 w-10 rounded object-cover" />
                  <Button variant="outline" type="button" onClick={() => removeExistingImage("ar", idx)}>Remove</Button>
                </div>
              </div>
            ))}
          </div>
        )}
        <Input
          type="file"
          multiple
          accept="image/*,.heic,.heif,.avif,.webp"
          onChange={(e) => setImageFilesArabic(Array.from(e.target.files || []))}
          disabled={uploading}
        />
        {imageFilesArabic.length > 0 && (
          <div className="mt-3 grid grid-cols-4 gap-2">
            {imageFilesArabic.map((file, idx) => (
              <img
                key={`new-ar-${idx}`}
                src={URL.createObjectURL(file)}
                alt="preview"
                className="h-20 w-20 rounded object-cover"
              />
            ))}
          </div>
        )}
        {imageFilesArabic.length > 0 && (
          <div className="mt-2 text-sm text-muted-foreground">
            {imageFilesArabic.length} file(s) selected
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={() => router.push(`/admin/product/${productId}`)}>Cancel</Button>
        <Button onClick={submit} disabled={saving || uploading}>{saving ? 'Saving...' : uploading ? 'Uploading...' : 'Save'}</Button>
      </div>
    </div>
  );
}
