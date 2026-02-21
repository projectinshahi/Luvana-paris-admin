'use client';
import React, { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import CategoryForm from "@/components/category/CategoryForm";
import { api } from "@/utils/api";

type Category = {
  _id: string;
  nameEnglish: string;
  nameArabic?: string;
  descriptionEnglish?: string;
  descriptionArabic?: string;
  imageUrlEnglish?: string;
  imageUrlArabic?: string;
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
  __v: number;
};

const STORAGE_KEY = "lp:categories";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const data = await api.get<Category[]>('/admin/category');
      setCategories(data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (payload: any) => {
    try {
      if (editing) {
        // Update
        await api.put(`/admin/category/${editing._id}`, payload);
      } else {
        // Create
        await api.post('/admin/category', payload);
      }
      await fetchCategories(); // Refresh list
    } catch (error) {
      console.error('Failed to save category:', error);
      throw error;
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this category?")) return;
    try {
      await api.delete(`/admin/category/${id}`);
      await fetchCategories(); // Refresh list
    } catch (error) {
      console.error('Failed to delete category:', error);
    }
  };

  const toggleStatus = async (id: string) => {
    const category = categories.find(c => c._id === id);
    if (!category) return;
    
    const newStatus = category.status === 'active' ? 'inactive' : 'active';
    try {
      await api.put(`/admin/category/${id}`, { ...category, status: newStatus });
      await fetchCategories(); // Refresh list
    } catch (error) {
      console.error('Failed to update status:', error);
    }
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
          {loading ? (
            <div className="py-12 text-center text-muted-foreground">Loading categories...</div>
          ) : categories.length === 0 ? (
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
                  <tr key={c._id} className="border-t">
                    <td className="px-4 py-3 align-top">
                      <div className="font-medium">{c.nameEnglish}</div>
                      {c.nameArabic && <div className="text-sm text-muted-foreground">{c.nameArabic}</div>}
                      {c.descriptionEnglish && <div className="text-sm text-muted-foreground mt-1">{c.descriptionEnglish}</div>}
                    </td>
                    <td className="px-4 py-3 align-top">
                      {c.imageUrlEnglish || c.imageUrlArabic ? (
                        <img src={c.imageUrlEnglish || c.imageUrlArabic} alt={c.nameEnglish} className="h-14 w-14 object-cover rounded" />
                      ) : (
                        <div className="h-14 w-14 bg-muted rounded flex items-center justify-center text-sm text-muted-foreground">No Image</div>
                      )}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <button
                        className={`px-3 py-1 rounded text-sm font-medium ${c.status === 'active' ? 'bg-green-600 text-white' : 'bg-gray-200 text-muted-foreground'}`}
                        onClick={() => toggleStatus(c._id)}
                      >
                        {c.status}
                      </button>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => { setEditing(c); setOpen(true); }}>Edit</Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(c._id)}>Delete</Button>
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
