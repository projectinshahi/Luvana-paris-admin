"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

type PromotionPayload = {
  id?: string;
  name?: string;
  contentEnglish: string;
  contentArabic?: string;
  sortOrder?: number;
  status?: "active" | "inactive";
};

export default function PromotionForm({
  open,
  onOpenChange,
  onSave,
  initial,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSave: (payload: PromotionPayload) => Promise<void> | void;
  initial?: PromotionPayload | null;
}) {
  const [form, setForm] = useState<PromotionPayload>({ contentEnglish: "", status: "active" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initial) setForm(initial);
    else setForm({ contentEnglish: "", status: "active" });
  }, [initial, open]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target as HTMLInputElement;
    setForm((s) => ({ ...s, [name]: value }));
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
          <DialogTitle>{initial?.id ? "Edit Promotion" : "Create Promotion"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 mt-2">
          <div>
            <label className="block text-sm text-muted-foreground mb-1">Name</label>
            <Input name="name" value={form.name || ""} onChange={handleChange} />
          </div>

          <div>
            <label className="block text-sm text-muted-foreground mb-1">Content (English)</label>
            <Textarea name="contentEnglish" value={form.contentEnglish || ""} onChange={handleChange} />
          </div>

          <div>
            <label className="block text-sm text-muted-foreground mb-1">Content (Arabic)</label>
            <Textarea name="contentArabic" value={form.contentArabic || ""} onChange={handleChange} dir="rtl" lang="ar" className="text-right" />
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
