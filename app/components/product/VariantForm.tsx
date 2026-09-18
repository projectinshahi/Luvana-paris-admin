"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { api, ApiError, OVERSIZE_MESSAGE, oversizeFiles } from "@/utils/api";
import { ImagePicker, MAX_VARIANT_IMAGES } from "@/components/product/VariantFields";
import { ProductImage, deleteImages, uploadAll } from "@/utils/productImages";

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

  /** Uploads every file as one unit; a partial failure cleans up after itself. */
  const uploadFiles = async (files: File[]) => {
    if (files.length === 0) return [];
    setUploading(true);
    try {
      return await uploadAll(files);
    } finally {
      setUploading(false);
    }
  };

  /**
   * Adds the picked files to the ones already chosen, refusing anything oversize
   * before it is uploaded and stopping at the per-variant image cap.
   */
  const addFiles = (
    e: React.ChangeEvent<HTMLInputElement>,
    existing: Array<{ imageUrl: string; publicId?: string }>,
    files: File[],
    set: (files: File[]) => void
  ) => {
    const picked = Array.from(e.target.files || []);
    e.target.value = "";
    const tooLarge = oversizeFiles(picked);
    if (tooLarge.length > 0) {
      toast.error(`${tooLarge.map((f) => `"${f.name}"`).join(", ")} ${tooLarge.length > 1 ? "are" : "is"} too large. ${OVERSIZE_MESSAGE}`);
      return;
    }
    const room = MAX_VARIANT_IMAGES - existing.length - files.length;
    if (picked.length > room) {
      toast.error(`Use ${MAX_VARIANT_IMAGES} images or fewer. Remove one before adding another.`);
      return;
    }
    set([...files, ...picked]);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'price' || name === 'stock' || name === 'mrp') {
      setForm((s) => ({ ...s, [name]: Number(value) }));
    } else {
      setForm((s) => ({ ...s, [name]: value }));
    }
  };

  const submitting = useRef(false);

  const submit = async () => {
    if (submitting.current) return;
    submitting.current = true;
    setSaving(true);
    let uploaded: ProductImage[] = [];
    try {
      uploaded = await uploadFiles([...imageFilesEnglish, ...imageFilesArabic]);
      const uploadedEnglish = uploaded.slice(0, imageFilesEnglish.length);
      const uploadedArabic = uploaded.slice(imageFilesEnglish.length);
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
      // Removed images are deleted only once the saved variant no longer uses them.
      deleteImages(deletedPublicIds);
      toast.success(variantId ? "Variant updated" : "Variant created");
      router.push(`/admin/product/${productId}`);
    } catch (error) {
      console.error("Failed to save variant:", error);
      // The API refused the save, so nothing references the images just uploaded.
      if (error instanceof ApiError && error.status >= 400) {
        deleteImages(uploaded.map((img) => img.publicId));
      }
      toast.error(error instanceof Error ? error.message : "Failed to save variant");
      submitting.current = false;
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

      <ImagePicker
        id="variant-images-en"
        label={<label htmlFor="variant-images-en" className="block text-sm text-muted-foreground mb-2">Images (English)</label>}
        existing={existingImageUrlEnglish}
        files={imageFilesEnglish}
        onAdd={(e) => addFiles(e, existingImageUrlEnglish, imageFilesEnglish, setImageFilesEnglish)}
        onRemoveExisting={(idx) => removeExistingImage("en", idx)}
        onRemoveFile={(idx) => setImageFilesEnglish(imageFilesEnglish.filter((_, i) => i !== idx))}
        disabled={uploading || saving}
      />

      <ImagePicker
        id="variant-images-ar"
        label={<label htmlFor="variant-images-ar" className="block text-sm text-muted-foreground mb-2">Images (Arabic)</label>}
        existing={existingImageUrlArabic}
        files={imageFilesArabic}
        onAdd={(e) => addFiles(e, existingImageUrlArabic, imageFilesArabic, setImageFilesArabic)}
        onRemoveExisting={(idx) => removeExistingImage("ar", idx)}
        onRemoveFile={(idx) => setImageFilesArabic(imageFilesArabic.filter((_, i) => i !== idx))}
        disabled={uploading || saving}
      />

      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={() => router.push(`/admin/product/${productId}`)}>Cancel</Button>
        <Button onClick={submit} disabled={saving || uploading}>{saving ? 'Saving...' : uploading ? 'Uploading...' : 'Save'}</Button>
      </div>
    </div>
  );
}
