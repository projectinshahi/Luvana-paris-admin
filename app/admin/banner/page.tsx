"use client";

import React, { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import BannerForm from "@/components/banner/BannerForm";

type Banner = {
  id: string;
  name?: string;
  titleEnglish: string;
  titleArabic?: string;
  descriptionEnglish?: string;
  descriptionArabic?: string;
  imageUrlEnglish?: string;
  imageUrlArabic?: string;
  sortOrder: number;
  status: "active" | "inactive";
};

const STORAGE_KEY = "lp:banners";

export default function BannerPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Banner | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      parsed.sort((a: Banner, b: Banner) => a.sortOrder - b.sortOrder);
      setBanners(parsed);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(banners));
  }, [banners]);

  const handleSave = async (payload: Partial<Banner>) => {
    if (payload.id) {
      setBanners((s) => s.map((b) => (b.id === payload.id ? { ...b, ...payload } as Banner : b)));
    } else {
      const id = String(Date.now());
      const maxOrder = banners.length > 0 ? Math.max(...banners.map(b => b.sortOrder)) + 1 : 1;
      setBanners((s) => [{
        id,
        name: payload.name || "",
        titleEnglish: payload.titleEnglish || "",
        titleArabic: payload.titleArabic || "",
        descriptionEnglish: payload.descriptionEnglish || "",
        descriptionArabic: payload.descriptionArabic || "",
        imageUrlEnglish: payload.imageUrlEnglish || "",
        imageUrlArabic: payload.imageUrlArabic || "",
        sortOrder: maxOrder,
        status: payload.status || "active",
      }, ...s]);
    }
  };

  const handleDelete = (id: string) => {
    if (!confirm("Delete this banner?")) return;
    setBanners((s) => s.filter((b) => b.id !== id));
  };

  const toggleStatus = (id: string) => {
    setBanners((s) => s.map((b) => b.id === id ? { ...b, status: b.status === 'active' ? 'inactive' : 'active' } : b));
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

  const handleDrop = (e: React.DragEvent<HTMLTableRowElement>, targetId: string) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) return;

    const draggedIdx = banners.findIndex(b => b.id === draggedId);
    const targetIdx = banners.findIndex(b => b.id === targetId);
    if (draggedIdx === -1 || targetIdx === -1) return;

    const newBanners = [...banners];
    const [draggedBanner] = newBanners.splice(draggedIdx, 1);
    newBanners.splice(targetIdx, 0, draggedBanner);

    // Recalculate sortOrder
    const updated = newBanners.map((b, idx) => ({ ...b, sortOrder: idx + 1 }));
    setBanners(updated);
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
          {banners.length === 0 ? (
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
                    key={b.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, b.id)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, b.id)}
                    className={`border-t cursor-move transition-opacity ${
                      draggedId === b.id ? 'opacity-50' : ''
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
                        onClick={() => toggleStatus(b.id)}
                      >
                        {b.status}
                      </button>
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

        <BannerForm open={open} onOpenChange={setOpen} initial={editing} onSave={handleSave} />
      </div>
    </AdminLayout>
  );
}
