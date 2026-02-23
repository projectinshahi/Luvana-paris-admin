"use client";

import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type CouponPayload = {
  _id?: string;
  name?: string;
  code?: string;
  discount?: number;
  usage?: number;
  minimumPurchase?: number;
  validity?: string;
  status?: "active" | "inactive";
};

export default function CouponForm({
  open,
  onOpenChange,
  onSave,
  initial,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSave: (payload: CouponPayload) => Promise<void> | void;
  initial?: CouponPayload | null;
}) {
  const [form, setForm] = useState<CouponPayload>({ name: "", code: "", discount: 0, usage: 0, minimumPurchase: 0, status: "active" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initial) setForm(initial);
    else setForm({ name: "", code: "", discount: 0, usage: 0, status: "active" });
  }, [initial, open]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'discount' || name === 'usage' || name === 'minimumPurchase') {
      setForm((s) => ({ ...s, [name]: Number(value) }));
    } else {
      setForm((s) => ({ ...s, [name]: value }));
    }
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
          <DialogTitle>{initial?._id ? "Edit Coupon" : "Create Coupon"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 mt-2">
          <div>
            <label className="block text-sm text-muted-foreground mb-1">Name</label>
            <Input name="name" value={form.name || ""} onChange={handleChange} />
          </div>

          <div>
            <label className="block text-sm text-muted-foreground mb-1">Code</label>
            <Input name="code" value={form.code || ""} onChange={handleChange} />
          </div>

          <div>
            <label className="block text-sm text-muted-foreground mb-1">Discount</label>
            <Input name="discount" type="number" value={String(form.discount ?? 0)} onChange={handleChange} />
          </div>

          <div>
            <label className="block text-sm text-muted-foreground mb-1">Usage</label>
            <Input name="usage" type="number" value={String(form.usage ?? 0)} onChange={handleChange} />
          </div>

          <div>
            <label className="block text-sm text-muted-foreground mb-1">Minimum Purchase</label>
            <Input name="minimumPurchase" type="number" value={String(form.minimumPurchase ?? 0)} onChange={handleChange} />
          </div>

          <div>
            <label className="block text-sm text-muted-foreground mb-1">Validity</label>
            <Input name="validity" type="date" value={form.validity ? form.validity.split('T')[0] : ""} onChange={handleChange} />
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
