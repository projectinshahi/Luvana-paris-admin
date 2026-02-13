"use client";

import React, { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import PromotionForm from "@/components/promotion/PromotionForm";

type Promotion = {
  id: string;
  name?: string;
  contentEnglish: string;
  contentArabic?: string;
  sortOrder: number;
  status: "active" | "inactive";
};

const STORAGE_KEY = "lp:promotionStrips";

export default function PromotionStripPage() {
  const [items, setItems] = useState<Promotion[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Promotion | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      parsed.sort((a: Promotion, b: Promotion) => a.sortOrder - b.sortOrder);
      setItems(parsed);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const handleSave = async (payload: Partial<Promotion>) => {
    if (payload.id) {
      setItems((s) => s.map((it) => (it.id === payload.id ? { ...it, ...payload } as Promotion : it)));
    } else {
      const id = String(Date.now());
      const maxOrder = items.length > 0 ? Math.max(...items.map(i => i.sortOrder)) + 1 : 1;
      setItems((s) => [{
        id,
        name: payload.name || "",
        contentEnglish: payload.contentEnglish || "",
        contentArabic: payload.contentArabic || "",
        sortOrder: maxOrder,
        status: payload.status || "active",
      }, ...s]);
    }
  };

  const handleDelete = (id: string) => {
    if (!confirm("Delete this promotion strip?")) return;
    setItems((s) => s.filter((i) => i.id !== id));
  };

  const toggleStatus = (id: string) => {
    setItems((s) => s.map((i) => i.id === id ? { ...i, status: i.status === 'active' ? 'inactive' : 'active' } : i));
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

    const draggedIdx = items.findIndex(i => i.id === draggedId);
    const targetIdx = items.findIndex(i => i.id === targetId);
    if (draggedIdx === -1 || targetIdx === -1) return;

    const newItems = [...items];
    const [draggedItem] = newItems.splice(draggedIdx, 1);
    newItems.splice(targetIdx, 0, draggedItem);

    const updated = newItems.map((b, idx) => ({ ...b, sortOrder: idx + 1 }));
    setItems(updated);
    setDraggedId(null);
  };

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Promotion Strips</h2>
          <div>
            <Button onClick={() => { setEditing(null); setOpen(true); }}>New Promotion</Button>
          </div>
        </div>

        <Card className="p-4 overflow-auto">
          {items.length === 0 ? (
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
                    key={it.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, it.id)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, it.id)}
                    className={`border-t cursor-move transition-opacity ${draggedId === it.id ? 'opacity-50' : ''}`}
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
                        className={`px-3 py-1 rounded text-sm font-medium ${it.status === 'active' ? 'bg-green-600 text-white' : 'bg-gray-200 text-muted-foreground'}`}
                        onClick={() => toggleStatus(it.id)}
                      >
                        {it.status}
                      </button>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => { setEditing(it); setOpen(true); }}>Edit</Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(it.id)}>Delete</Button>
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
