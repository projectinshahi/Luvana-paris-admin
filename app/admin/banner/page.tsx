"use client";

import React, { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import BannerForm from "@/components/banner/BannerForm";
import { api } from "@/utils/api";

type Banner = {
  _id: string;
  name?: string;
  titleEnglish: string;
  titleArabic?: string;
  descriptionEnglish?: string;
  descriptionArabic?: string;
  imageUrlEnglish?: string;
  imageUrlArabic?: string;
  sortOrder: number;
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
  __v: number;
};

const STORAGE_KEY = "lp:banners";

export default function BannerPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Banner | null>(null);

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      const data = await api.get<Banner[]>('/admin/banner');
      const sorted = data.sort((a, b) => a.sortOrder - b.sortOrder);
      setBanners(sorted);
    } catch (error) {
      console.error('Failed to fetch banners:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (payload: any) => {
    try {
      if (editing) {
        // Update
        await api.put(`/admin/banner/${editing._id}`, payload);
      } else {
        // Create
        const maxOrder = banners.length > 0 ? Math.max(...banners.map(b => b.sortOrder)) + 1 : 1;
        await api.post('/admin/banner', { ...payload, sortOrder: maxOrder });
      }
      await fetchBanners(); // Refresh list
    } catch (error) {
      console.error('Failed to save banner:', error);
      throw error;
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this banner?")) return;
    try {
      await api.delete(`/admin/banner/${id}`);
      await fetchBanners(); // Refresh list
    } catch (error) {
      console.error('Failed to delete banner:', error);
    }
  };

  const toggleStatus = async (id: string) => {
    const banner = banners.find(b => b._id === id);
    if (!banner) return;
    
    const newStatus = banner.status === 'active' ? 'inactive' : 'active';
    try {
      await api.put(`/admin/banner/${id}`, { ...banner, status: newStatus });
      await fetchBanners(); // Refresh list
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const [draggedId, setDraggedId] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent<HTMLTableRowElement>, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent<HTMLTableRowElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e: React.DragEvent<HTMLTableRowElement>, targetId: string) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) return;

    const draggedIdx = banners.findIndex(b => b._id === draggedId);
    const targetIdx = banners.findIndex(b => b._id === targetId);
    if (draggedIdx === -1 || targetIdx === -1) return;

    const newBanners = [...banners];
    const [draggedBanner] = newBanners.splice(draggedIdx, 1);
    newBanners.splice(targetIdx, 0, draggedBanner);

    // Update sortOrder for all items
    const updatedBanners = newBanners.map((b, idx) => ({ ...b, sortOrder: idx + 1 }));
    
    // Update local state immediately for better UX
    setBanners(updatedBanners);
    
    // Update all items on the server
    try {
      await Promise.all(updatedBanners.map(b => 
        api.put(`/admin/banner/${b._id}`, { sortOrder: b.sortOrder })
      ));
    } catch (error) {
      console.error('Failed to update sort order:', error);
      // Revert on error
      await fetchBanners();
    }
    
    setDraggedId(null);
  };

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Banners</h2>
          <div>
            <Button onClick={() => { setEditing(null); setOpen(true); }}><Plus className="mr-2 h-4 w-4" />New Banner</Button>
          </div>
        </div>

        <Card className="p-4 overflow-auto">
          {loading ? (
            <div className="py-12 text-center text-muted-foreground">Loading banners...</div>
          ) : banners.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">No banners yet</div>
          ) : (
            <table className="w-full text-left table-auto">
              <thead>
                <tr className="text-sm text-muted-foreground">
                  <th className="px-4 py-2">Order</th>
                  <th className="px-4 py-2">Name</th>
                  <th className="px-4 py-2">Title</th>
                  <th className="px-4 py-2">Image</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {banners.map((b) => (
                  <tr
                    key={b._id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, b._id)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, b._id)}
                    className={`border-t cursor-move transition-opacity ${
                      draggedId === b._id ? 'opacity-50' : ''
                    }`}
                  >
                    <td className="px-4 py-3 align-top text-sm text-muted-foreground font-medium">{b.sortOrder}</td>
                    <td className="px-4 py-3 align-top">
                      <div className="font-medium">{b.name || '-'}</div>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="font-medium">{b.titleEnglish}</div>
                      {b.titleArabic && <div className="text-sm text-muted-foreground">{b.titleArabic}</div>}
                    </td>
                    <td className="px-4 py-3 align-top">
                      {b.imageUrlEnglish || b.imageUrlArabic ? (
                        <img src={b.imageUrlEnglish || b.imageUrlArabic} alt={b.titleEnglish} className="h-20 w-40 object-cover rounded" />
                      ) : (
                        <div className="h-20 w-40 bg-muted rounded flex items-center justify-center text-sm text-muted-foreground">No Image</div>
                      )}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <button
                        className={`px-3 py-1 rounded text-sm font-medium ${b.status === 'active' ? 'bg-green-600 text-white' : 'bg-gray-200 text-muted-foreground'}`}
                        onClick={() => toggleStatus(b._id)}
                      >
                        {b.status}
                      </button>
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

        <BannerForm open={open} onOpenChange={setOpen} initial={editing} onSave={handleSave} />
      </div>
    </AdminLayout>
  );
}
