"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

type ProductPayload = {
  id?: string;
  category?: string;
  brand?: string;
  nameEnglish?: string;
  nameArabic?: string;
  shortDescriptionEnglish?: string;
  shortDescriptionArabic?: string;
  status?: "active" | "inactive";
  images?: string[];
};

const STORAGE_KEY = "lp:products";

export default function ProductForm({ productId }: { productId?: string } = {}) {
  const router = useRouter();
  const [form, setForm] = useState<ProductPayload>({ nameEnglish: "", nameArabic: "", shortDescriptionArabic: "", category: "", brand: "", status: "active", images: [] });
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);

  useEffect(() => {
    if (!productId) return;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const found = JSON.parse(raw).find((p: any) => p.id === productId);
      if (found) setForm(found);
    }
  }, [productId]);

  useEffect(() => {
    const rawC = localStorage.getItem('lp:categories');
    if (rawC) setCategories(JSON.parse(rawC));
    const rawB = localStorage.getItem('lp:brands');
    if (rawB) setBrands(JSON.parse(rawB));
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
      setForm((s) => ({ ...s, images: [...(s.images || []), result] }));
    };
    reader.readAsDataURL(files[0]);
  };

  const submit = async () => {
    setSaving(true);
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const all = raw ? JSON.parse(raw) : [];
      if (productId) {
        const updated = all.map((p: any) => p.id === productId ? { ...p, ...form } : p);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } else {
        const id = String(Date.now());
        const toSave = { id, ...form };
        localStorage.setItem(STORAGE_KEY, JSON.stringify([toSave, ...all]));
      }
      router.push('/admin/product');
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
          {categories.map((c) => (<option key={c.id} value={c.id}>{c.nameEnglish}</option>))}
        </select>
      </div>

      <div>
        <label className="block text-sm text-muted-foreground mb-1">Brand</label>
        <select name="brand" value={form.brand || ''} onChange={handleChange} className="w-full rounded-md border px-3 py-2">
          <option value="">-- Select brand --</option>
          {brands.map((b) => (<option key={b.id} value={b.id}>{b.nameEnglish}</option>))}
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
        <label className="block text-sm text-muted-foreground mb-1">Images</label>
        <input type="file" accept="image/*" onChange={handleFile} />
        <div className="flex gap-2 mt-2">
          {(form.images || []).map((src, idx) => (<img key={idx} src={src} className="h-20 w-20 object-cover rounded" alt="preview"/>))}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={() => router.push('/admin/product')}>Cancel</Button>
        <Button onClick={submit} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
      </div>
    </div>
  );
}
