"use client";

import React, { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import CategoryForm from "@/components/category/CategoryForm";

type Category = {
  id: string;
  nameEnglish: string;
  nameArabic?: string;
  descriptionEnglish?: string;
  descriptionArabic?: string;
  status: "active" | "inactive";
};

const STORAGE_KEY = "lp:categories";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) setCategories(JSON.parse(raw));
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(categories));
  }, [categories]);

  const handleSave = async (payload: Partial<Category>) => {
    if (payload.id) {
      setCategories((s) => s.map((c) => (c.id === payload.id ? { ...c, ...payload } as Category : c)));
    } else {
      const id = String(Date.now());
      setCategories((s) => [{
        id,
        nameEnglish: payload.nameEnglish || "",
        nameArabic: payload.nameArabic || "",
        descriptionEnglish: payload.descriptionEnglish || "",
        descriptionArabic: payload.descriptionArabic || "",
        status: payload.status || "active",
      }, ...s]);
    }
  };

  const handleDelete = (id: string) => {
    if (!confirm("Delete this category?")) return;
    setCategories((s) => s.filter((c) => c.id !== id));
  };

  const toggleStatus = (id: string) => {
    setCategories((s) => s.map((c) => c.id === id ? { ...c, status: c.status === 'active' ? 'inactive' : 'active' } : c));
  };

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Categories</h2>
          <div>
            <Button onClick={() => { setEditing(null); setOpen(true); }}><Plus className="mr-2 h-4 w-4" />New Category</Button>
          </div>
        </div>

        <Card className="p-4 overflow-auto">
          {categories.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">No categories yet</div>
          ) : (
            <table className="w-full text-left table-auto">
              <thead>
                <tr className="text-sm text-muted-foreground">
                  <th className="px-4 py-2">Name</th>
                  <th className="px-4 py-2">Image</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((c) => (
                  <tr key={c.id} className="border-t">
                    <td className="px-4 py-3 align-top">
                      <div className="font-medium">{c.nameEnglish}</div>
                      {c.nameArabic && <div className="text-sm text-muted-foreground">{c.nameArabic}</div>}
                      {c.descriptionEnglish && <div className="text-sm text-muted-foreground mt-1">{c.descriptionEnglish}</div>}
                    </td>
                    <td className="px-4 py-3 align-top">
                      {/** show image if available otherwise placeholder */}
                      {((c as any).imageUrlEnglish || (c as any).imageUrlArabic) ? (
                        <img src={(c as any).imageUrlEnglish || (c as any).imageUrlArabic} alt={c.nameEnglish} className="h-14 w-14 object-cover rounded" />
                      ) : (
                        <div className="h-14 w-14 bg-muted rounded flex items-center justify-center text-sm text-muted-foreground">No Image</div>
                      )}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <button
                        className={`px-3 py-1 rounded text-sm font-medium ${c.status === 'active' ? 'bg-green-600 text-white' : 'bg-gray-200 text-muted-foreground'}`}
                        onClick={() => toggleStatus(c.id)}
                      >
                        {c.status}
                      </button>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => { setEditing(c); setOpen(true); }}>Edit</Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(c.id)}>Delete</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        <CategoryForm open={open} onOpenChange={setOpen} initial={editing} onSave={handleSave} />
      </div>
    </AdminLayout>
  );
}
