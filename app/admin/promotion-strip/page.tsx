"use client";

import React, { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import PromotionForm from "@/components/promotion/PromotionForm";
import { api } from "@/utils/api";

type Promotion = {
  _id: string;
  name?: string;
  contentEnglish: string;
  contentArabic?: string;
  sortOrder: number;
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
  __v: number;
};

const STORAGE_KEY = "lp:promotionStrips";

export default function PromotionStripPage() {
  const [items, setItems] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Promotion | null>(null);

  useEffect(() => {
    fetchPromotions();
  }, []);

  const fetchPromotions = async () => {
    try {
      const data = await api.get<Promotion[]>('/admin/promotion-strip');
      const sorted = data.sort((a, b) => a.sortOrder - b.sortOrder);
      setItems(sorted);
    } catch (error) {
      console.error('Failed to fetch promotions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (payload: any) => {
    try {
      if (editing) {
        // Update
        await api.put(`/admin/promotion-strip/${editing._id}`, payload);
      } else {
        // Create
        const maxOrder = items.length > 0 ? Math.max(...items.map(i => i.sortOrder)) + 1 : 1;
        await api.post('/admin/promotion-strip', { ...payload, sortOrder: maxOrder });
      }
      await fetchPromotions(); // Refresh list
    } catch (error) {
      console.error('Failed to save promotion:', error);
      throw error;
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this promotion strip?")) return;
    try {
      await api.delete(`/admin/promotion-strip/${id}`);
      await fetchPromotions(); // Refresh list
    } catch (error) {
      console.error('Failed to delete promotion:', error);
    }
  };

  const toggleStatus = async (id: string) => {
    const item = items.find(i => i._id === id);
    if (!item) return;
    
    const newStatus = item.status === 'active' ? 'inactive' : 'active';
    try {
      await api.put(`/admin/promotion-strip/${id}`, { ...item, status: newStatus });
      await fetchPromotions(); // Refresh list
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

    const draggedIdx = items.findIndex(i => i._id === draggedId);
    const targetIdx = items.findIndex(i => i._id === targetId);
    if (draggedIdx === -1 || targetIdx === -1) return;

    const newItems = [...items];
    const [draggedItem] = newItems.splice(draggedIdx, 1);
    newItems.splice(targetIdx, 0, draggedItem);

    // Update sortOrder for all items
    const updatedItems = newItems.map((item, idx) => ({ ...item, sortOrder: idx + 1 }));
    
    // Update local state immediately for better UX
    setItems(updatedItems);
    
    // Update all items on the server
    try {
      await Promise.all(updatedItems.map(item => 
        api.put(`/admin/promotion-strip/${item._id}`, { sortOrder: item.sortOrder })
      ));
    } catch (error) {
      console.error('Failed to update sort order:', error);
      // Revert on error
      await fetchPromotions();
    }
    
    setDraggedId(null);
  };

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Promotion Strips</h2>
          <div>
            <Button onClick={() => { setEditing(null); setOpen(true); }}><Plus className="mr-2 h-4 w-4" />New Promotion</Button>
          </div>
        </div>

        <Card className="p-4 overflow-auto">
          {loading ? (
            <div className="py-12 text-center text-muted-foreground">Loading promotion strips...</div>
          ) : items.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">No promotion strips yet</div>
          ) : (
            <table className="w-full text-left table-auto">
              <thead>
                <tr className="text-sm text-muted-foreground">
                  <th className="px-4 py-2">Order</th>
                  <th className="px-4 py-2">Name</th>
                  <th className="px-4 py-2">Content</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it) => (
                  <tr
                    key={it._id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, it._id)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, it._id)}
                    className={`border-t cursor-move transition-opacity ${draggedId === it._id ? 'opacity-50' : ''}`}
                  >
                    <td className="px-4 py-3 align-top text-sm text-muted-foreground font-medium">{it.sortOrder}</td>
                    <td className="px-4 py-3 align-top">
                      <div className="font-medium">{it.name || '-'}</div>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="font-medium">{it.contentEnglish}</div>
                      {it.contentArabic && <div className="text-sm text-muted-foreground">{it.contentArabic}</div>}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <button
                        className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${it.status === 'active' ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                        onClick={() => toggleStatus(it._id)}
                      >
                        {it.status}
                      </button>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="flex items-center gap-2">
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white" size="sm" onClick={() => { setEditing(it); setOpen(true); }}>Edit</Button>
                        <Button className="bg-red-600 hover:bg-red-700 text-white" size="sm" onClick={() => handleDelete(it._id)}>Delete</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        <PromotionForm open={open} onOpenChange={setOpen} initial={editing} onSave={handleSave} />
      </div>
    </AdminLayout>
  );
}
