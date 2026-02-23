"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { api } from "@/utils/api";

type ProductPayload = {
  _id?: string;
  category?: string;
  brand?: string;
  nameEnglish?: string;
  nameArabic?: string;
  shortDescriptionEnglish?: string;
  shortDescriptionArabic?: string;
  status?: "active" | "inactive";
  description?: any[];
  imageUrlEnglish?: any[];
  imageUrlArabic?: any[];
};

const STORAGE_KEY = "lp:products";

export default function ProductForm({ productId }: { productId?: string } = {}) {
  const router = useRouter();
  const [form, setForm] = useState<ProductPayload>({
    nameEnglish: "",
    nameArabic: "",
    shortDescriptionEnglish: "",
    shortDescriptionArabic: "",
    category: "",
    brand: "",
    status: "active",
    description: [],
    imageUrlEnglish: [],
    imageUrlArabic: [],
  });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!!productId);
  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);

  useEffect(() => {
    if (!productId) {
      setLoading(false);
      return;
    }
    fetchProduct();
  }, [productId]);

  const fetchProduct = async () => {
    try {
      const data = await api.get<any>(`/admin/product/${productId}`);
      setForm(data);
    } catch (error) {
      console.error('Failed to fetch product:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await api.get<any[]>('/admin/category');
        setCategories(data || []);
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const data = await api.get<any[]>('/admin/brand');
        setBrands(data || []);
      } catch (error) {
        console.error('Failed to fetch brands:', error);
      }
    };
    fetchBrands();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target as HTMLInputElement;
    setForm((s) => ({ ...s, [name]: value }));
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const fieldName = (e.target as HTMLInputElement).name as keyof ProductPayload;
      setForm((s) => ({
        ...s,
        [fieldName]: [...((s[fieldName] as any[]) || []), { imageUrl: result }],
      }));
    };
    reader.readAsDataURL(files[0]);
  };

  const removeImage = (field: 'imageUrlEnglish' | 'imageUrlArabic', idx: number) => {
    setForm((s) => ({
      ...s,
      [field]: (s[field] || []).filter((_, i) => i !== idx),
    }));
  };

  const submit = async () => {
    setSaving(true);
    try {
      if (productId) {
        await api.put(`/admin/product/${productId}`, form);
      } else {
        await api.post('/admin/product', form);
      }
      router.push('/admin/product');
    } catch (error) {
      console.error('Failed to save product:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm text-muted-foreground mb-1">Category</label>
        <select name="category" value={form.category || ''} onChange={handleChange} className="w-full rounded-md border px-3 py-2">
          <option value="">-- Select category --</option>
          {categories.map((c) => (<option key={c._id} value={c._id}>{c.nameEnglish}</option>))}
        </select>
      </div>

      <div>
        <label className="block text-sm text-muted-foreground mb-1">Brand</label>
        <select name="brand" value={form.brand || ''} onChange={handleChange} className="w-full rounded-md border px-3 py-2">
          <option value="">-- Select brand --</option>
          {brands.map((b) => (<option key={b._id} value={b._id}>{b.nameEnglish}</option>))}
        </select>
      </div>

      <div>
        <label className="block text-sm text-muted-foreground mb-1">Name (English)</label>
        <Input name="nameEnglish" value={form.nameEnglish || ''} onChange={handleChange} />
      </div>

      <div>
        <label className="block text-sm text-muted-foreground mb-1">Name (Arabic)</label>
        <Input name="nameArabic" value={form.nameArabic || ''} onChange={handleChange} dir="rtl" lang="ar" className="text-right" />
      </div>

      <div>
        <label className="block text-sm text-muted-foreground mb-1">Short Description (English)</label>
        <Textarea name="shortDescriptionEnglish" value={form.shortDescriptionEnglish || ''} onChange={handleChange} />
      </div>

      <div>
        <label className="block text-sm text-muted-foreground mb-1">Short Description (Arabic)</label>
        <Textarea name="shortDescriptionArabic" value={form.shortDescriptionArabic || ''} onChange={handleChange} dir="rtl" lang="ar" className="text-right" />
      </div>

      <div>
        <label className="block text-sm text-muted-foreground mb-1">Images (English)</label>
        <input type="file" name="imageUrlEnglish" accept="image/*" onChange={handleFile} />
        <div className="flex gap-2 mt-2">
          {(form.imageUrlEnglish || []).map((img, idx) => (
            <div key={idx} className="relative">
              <img src={img.imageUrl || img} className="h-20 w-20 object-cover rounded" alt="preview" />
              <button type="button" onClick={() => removeImage('imageUrlEnglish', idx)} className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">×</button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm text-muted-foreground mb-1">Images (Arabic)</label>
        <input type="file" name="imageUrlArabic" accept="image/*" onChange={handleFile} />
        <div className="flex gap-2 mt-2">
          {(form.imageUrlArabic || []).map((img, idx) => (
            <div key={idx} className="relative">
              <img src={img.imageUrl || img} className="h-20 w-20 object-cover rounded" alt="preview" />
              <button type="button" onClick={() => removeImage('imageUrlArabic', idx)} className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">×</button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={() => router.push('/admin/product')}>Cancel</Button>
        <Button onClick={submit} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
      </div>
    </div>
  );
}
