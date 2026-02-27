"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { api } from "@/utils/api";

type InfluencerPayload = {
  _id?: string;
  titleEnglish: string;
  titleArabic?: string;
  product: string;
  variant: string;
  videoUrl: string;
  sortOrder?: number;
  status?: "active" | "inactive";
};

export default function InfluencerForm({
  open,
  onOpenChange,
  onSave,
  initial,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSave: (payload: InfluencerPayload) => Promise<void> | void;
  initial?: any | null;
}) {
  const [form, setForm] = useState<InfluencerPayload>({ 
    titleEnglish: "", 
    titleArabic: "",
    product: "",
    variant: "",
    videoUrl: "",
    status: "active" 
  });
  const [saving, setSaving] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [variants, setVariants] = useState<any[]>([]);
  const [loadingVariants, setLoadingVariants] = useState(false);

  useEffect(() => {
    if (initial) {
      setForm({
        titleEnglish: initial.titleEnglish || "",
        titleArabic: initial.titleArabic || "",
        product: initial.product?._id || initial.product || "",
        variant: initial.variant?._id || initial.variant || "",
        videoUrl: initial.videoUrl || "",
        status: initial.status || "active",
      });
      if (initial.product?._id || initial.product) {
        fetchVariants(initial.product?._id || initial.product);
      }
    } else {
      setForm({ 
        titleEnglish: "", 
        titleArabic: "",
        product: "",
        variant: "",
        videoUrl: "",
        status: "active" 
      });
      setVariants([]);
    }
  }, [initial, open]);

  useEffect(() => {
    if (open) {
      fetchProducts();
    }
  }, [open]);

  const fetchProducts = async () => {
    try {
      const data = await api.get<any[]>('/admin/product');
      setProducts(data || []);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    }
  };

  const fetchVariants = async (productId: string) => {
    if (!productId) {
      setVariants([]);
      return;
    }
    setLoadingVariants(true);
    try {
      const data = await api.get<any[]>(`/admin/product-variant/product/${productId}`);
      setVariants(data || []);
    } catch (error) {
      console.error('Failed to fetch variants:', error);
      setVariants([]);
    } finally {
      setLoadingVariants(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  };

  const handleProductChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const productId = e.target.value;
    setForm((s) => ({ ...s, product: productId, variant: "" }));
    fetchVariants(productId);
  };

  const submit = async () => {
    setSaving(true);
    try {
      await onSave(form);
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{initial?._id ? "Edit Influencer" : "Create Influencer"}</DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 overflow-auto">
          <div className="space-y-3 mt-2 pr-4">
            <div>
              <label className="block text-sm text-muted-foreground mb-1">Title (English)</label>
              <Input name="titleEnglish" value={form.titleEnglish} onChange={handleChange} />
            </div>

            <div>
              <label className="block text-sm text-muted-foreground mb-1">Title (Arabic)</label>
              <Input name="titleArabic" value={form.titleArabic || ""} onChange={handleChange} dir="rtl" lang="ar" className="text-right" />
            </div>

            <div>
              <label className="block text-sm text-muted-foreground mb-1">Product</label>
              <select 
                name="product" 
                value={form.product} 
                onChange={handleProductChange} 
                className="w-full rounded-md border border-input bg-transparent px-3 py-2"
              >
                <option value="">-- Select Product --</option>
                {products.map((p) => (
                  <option key={p._id} value={p._id}>{p.nameEnglish}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-muted-foreground mb-1">Variant</label>
              <select 
                name="variant" 
                value={form.variant} 
                onChange={handleChange} 
                className="w-full rounded-md border border-input bg-transparent px-3 py-2"
                disabled={!form.product || loadingVariants}
              >
                <option value="">-- Select Variant --</option>
                {variants.map((v) => (
                  <option key={v._id} value={v._id}>{v.nameEnglish} {v.color ? `(${v.color})` : ''}</option>
                ))}
              </select>
              {loadingVariants && <div className="text-sm text-muted-foreground mt-1">Loading variants...</div>}
            </div>

            <div>
              <label className="block text-sm text-muted-foreground mb-1">Video URL</label>
              <Input name="videoUrl" value={form.videoUrl} onChange={handleChange} placeholder="https://youtube.com/watch?v=..." />
            </div>

            <div>
              <label className="block text-sm text-muted-foreground mb-1">Status</label>
              <select name="status" value={form.status} onChange={handleChange} className="w-full rounded-md border border-input bg-transparent px-3 py-2">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={submit} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
