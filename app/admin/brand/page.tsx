'use client';
import React, { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import BrandForm from "@/components/brand/BrandForm";
import { api } from "@/utils/api";

type Brand = {
  _id: string;
  nameEnglish: string;
  nameArabic?: string;
  descriptionEnglish?: string;
  descriptionArabic?: string;
  logoUrlEnglish?: string;
  logoUrlArabic?: string;
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
  __v: number;
};

const STORAGE_KEY = "lp:brands";

export default function BrandPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Brand | null>(null);

  useEffect(() => {
    fetchBrands();
  }, []);

  const fetchBrands = async () => {
    try {
      const data = await api.get<Brand[]>('/admin/brand');
      setBrands(data);
    } catch (error) {
      console.error('Failed to fetch brands:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (payload: any) => {
    try {
      if (editing) {
        // Update
        await api.put(`/admin/brand/${editing._id}`, payload);
      } else {
        // Create
        await api.post('/admin/brand', payload);
      }
      await fetchBrands(); // Refresh list
    } catch (error) {
      console.error('Failed to save brand:', error);
      throw error;
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this brand?")) return;
    try {
      await api.delete(`/admin/brand/${id}`);
      await fetchBrands(); // Refresh list
    } catch (error) {
      console.error('Failed to delete brand:', error);
    }
  };

  const toggleStatus = async (id: string) => {
    const brand = brands.find(b => b._id === id);
    if (!brand) return;
    
    const newStatus = brand.status === 'active' ? 'inactive' : 'active';
    try {
      await api.put(`/admin/brand/${id}`, { ...brand, status: newStatus });
      await fetchBrands(); // Refresh list
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Brands</h2>
          <div>
            <Button onClick={() => { setEditing(null); setOpen(true); }}><Plus className="mr-2 h-4 w-4" />New Brand</Button>
          </div>
        </div>

        <Card className="p-4 overflow-auto">
          {loading ? (
            <div className="py-12 text-center text-muted-foreground">Loading brands...</div>
          ) : brands.length === 0 ? (
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
                  <tr key={b._id} className="border-t">
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
                      <button className={`px-3 py-1 rounded text-sm font-medium ${b.status === 'active' ? 'bg-green-600 text-white' : 'bg-gray-200 text-muted-foreground'}`} onClick={() => toggleStatus(b._id)}>{b.status}</button>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => { setEditing(b); setOpen(true); }}>Edit</Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(b._id)}>Delete</Button>
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
