"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type VariantPayload = {
  id?: string;
  product?: string;
  nameEnglish?: string;
  nameArabic?: string;
  shortDescriptionEnglish?: string;
  shortDescriptionArabic?: string;
  color?: string;
  stock?: number;
  price?: number;
  mrp?: number;
  status?: "active" | "inactive";
};

const VARIANTS_KEY = "lp:productVariants";

export default function VariantForm({ productId, variantId }: { productId?: string; variantId?: string } = {}) {
  const router = useRouter();
  const [form, setForm] = useState<VariantPayload>({ nameEnglish: '', price: 0, stock: 0, status: 'active', product: productId });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!variantId) return;
    const raw = localStorage.getItem(VARIANTS_KEY);
    if (raw) {
      const found = JSON.parse(raw).find((v: any) => v.id === variantId);
      if (found) setForm(found);
    }
  }, [variantId]);

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
      const raw = localStorage.getItem(VARIANTS_KEY);
      const all = raw ? JSON.parse(raw) : [];
      if (variantId) {
        const updated = all.map((v: any) => v.id === variantId ? { ...v, ...form } : v);
        localStorage.setItem(VARIANTS_KEY, JSON.stringify(updated));
      } else {
        const id = String(Date.now());
        const toSave = { id, product: productId, ...form };
        localStorage.setItem(VARIANTS_KEY, JSON.stringify([toSave, ...all]));
      }
      router.push(`/admin/product/${productId}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm text-muted-foreground mb-1">Name (English)</label>
        <Input name="nameEnglish" value={form.nameEnglish || ''} onChange={handleChange} />
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

      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={() => router.push(`/admin/product/${productId}`)}>Cancel</Button>
        <Button onClick={submit} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
      </div>
    </div>
  );
}
