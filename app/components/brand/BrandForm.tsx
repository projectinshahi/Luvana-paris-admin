"use client";

import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

type BrandPayload = {
  id?: string;
  nameEnglish: string;
  nameArabic?: string;
  descriptionEnglish?: string;
  descriptionArabic?: string;
  logoUrlEnglish?: string;
  logoUrlArabic?: string;
  status?: "active" | "inactive";
};

export default function BrandForm({
  open,
  onOpenChange,
  onSave,
  initial,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSave: (payload: BrandPayload) => Promise<void> | void;
  initial?: BrandPayload | null;
}) {
  const [form, setForm] = useState<BrandPayload>({ nameEnglish: "", status: "active" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initial) setForm(initial);
    else setForm({ nameEnglish: "", status: "active" });
  }, [initial, open]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target as HTMLInputElement;
    setForm((s) => ({ ...s, [name]: value }));
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, files } = e.target as HTMLInputElement;
    if (!files || files.length === 0) return;
    const file = files[0];
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setForm((s) => ({ ...s, [name]: result } as BrandPayload));
    };
    reader.readAsDataURL(file);
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initial?.id ? "Edit Brand" : "Create Brand"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 mt-2">
          <div>
            <label className="block text-sm text-muted-foreground mb-1">Name (English)</label>
            <Input name="nameEnglish" value={form.nameEnglish} onChange={handleChange} />
          </div>

          <div>
            <label className="block text-sm text-muted-foreground mb-1">Name (Arabic)</label>
            <Input name="nameArabic" value={form.nameArabic || ""} onChange={handleChange} dir="rtl" lang="ar" className="text-right" />
          </div>

          <div>
            <label className="block text-sm text-muted-foreground mb-1">Logo (English)</label>
            <input type="file" name="logoUrlEnglish" accept="image/*" onChange={handleFile} className="w-full" />
            {form.logoUrlEnglish && <img src={form.logoUrlEnglish} alt="preview" className="mt-2 h-24 w-24 object-cover rounded" />}
          </div>

          <div>
            <label className="block text-sm text-muted-foreground mb-1">Logo (Arabic)</label>
            <input type="file" name="logoUrlArabic" accept="image/*" onChange={handleFile} className="w-full" />
            {form.logoUrlArabic && <img src={form.logoUrlArabic} alt="preview" className="mt-2 h-24 w-24 object-cover rounded" />}
          </div>

          <div>
            <label className="block text-sm text-muted-foreground mb-1">Description (English)</label>
            <Textarea name="descriptionEnglish" value={form.descriptionEnglish || ""} onChange={handleChange} />
          </div>

          <div>
            <label className="block text-sm text-muted-foreground mb-1">Description (Arabic)</label>
            <Textarea name="descriptionArabic" value={form.descriptionArabic || ""} onChange={handleChange} dir="rtl" lang="ar" className="text-right" />
          </div>

          <div>
            <label className="block text-sm text-muted-foreground mb-1">Status</label>
            <select name="status" value={form.status} onChange={(e) => setForm((s) => ({ ...s, status: e.target.value as any }))} className="w-full rounded-md border border-input bg-transparent px-3 py-2">
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

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
