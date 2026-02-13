"use client";

import React, { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import BrandForm from "@/components/brand/BrandForm";

type Brand = {
  id: string;
  nameEnglish: string;
  nameArabic?: string;
  descriptionEnglish?: string;
  descriptionArabic?: string;
  logoUrlEnglish?: string;
  logoUrlArabic?: string;
  status: "active" | "inactive";
};

const STORAGE_KEY = "lp:brands";

export default function BrandPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Brand | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) setBrands(JSON.parse(raw));
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(brands));
  }, [brands]);

  const handleSave = async (payload: Partial<Brand>) => {
    if (payload.id) {
      setBrands((s) => s.map((b) => (b.id === payload.id ? { ...b, ...payload } as Brand : b)));
    } else {
      const id = String(Date.now());
      setBrands((s) => [{
        id,
        nameEnglish: payload.nameEnglish || "",
        nameArabic: payload.nameArabic || "",
        descriptionEnglish: payload.descriptionEnglish || "",
        descriptionArabic: payload.descriptionArabic || "",
        logoUrlEnglish: payload.logoUrlEnglish || "",
        logoUrlArabic: payload.logoUrlArabic || "",
        status: payload.status || "active",
      }, ...s]);
    }
  };

  const handleDelete = (id: string) => {
    if (!confirm("Delete this brand?")) return;
    setBrands((s) => s.filter((b) => b.id !== id));
  };

  const toggleStatus = (id: string) => {
    setBrands((s) => s.map((b) => b.id === id ? { ...b, status: b.status === 'active' ? 'inactive' : 'active' } : b));
  };

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Brands</h2>
          <div>
            <Button onClick={() => { setEditing(null); setOpen(true); }}>New Brand</Button>
          </div>
        </div>

        <Card className="p-4 overflow-auto">
          {brands.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">No brands yet</div>
          ) : (
            <table className="w-full text-left table-auto">
              <thead>
                <tr className="text-sm text-muted-foreground">
                  <th className="px-4 py-2">Name</th>
                  <th className="px-4 py-2">Logo</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {brands.map((b) => (
                  <tr key={b.id} className="border-t">
                    <td className="px-4 py-3 align-top">
                      <div className="font-medium">{b.nameEnglish}</div>
                      {b.nameArabic && <div className="text-sm text-muted-foreground">{b.nameArabic}</div>}
                    </td>
                    <td className="px-4 py-3 align-top">
                      {(b.logoUrlEnglish || b.logoUrlArabic) ? (
                        <img src={b.logoUrlEnglish || b.logoUrlArabic} alt={b.nameEnglish} className="h-14 w-14 object-cover rounded" />
                      ) : (
                        <div className="h-14 w-14 bg-muted rounded flex items-center justify-center text-sm text-muted-foreground">No Logo</div>
                      )}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <button className={`px-3 py-1 rounded text-sm font-medium ${b.status === 'active' ? 'bg-green-600 text-white' : 'bg-gray-200 text-muted-foreground'}`} onClick={() => toggleStatus(b.id)}>{b.status}</button>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => { setEditing(b); setOpen(true); }}>Edit</Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(b.id)}>Delete</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        <BrandForm open={open} onOpenChange={setOpen} initial={editing} onSave={handleSave} />
      </div>
    </AdminLayout>
  );
}
