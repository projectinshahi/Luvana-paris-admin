"use client";

import React, { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import InfluencerForm from "@/components/influencer/InfluencerForm";
import { api } from "@/utils/api";

type Influencer = {
  _id: string;
  titleEnglish: string;
  titleArabic?: string;
  product: {
    _id: string;
    nameEnglish: string;
    nameArabic?: string;
  };
  variant: {
    _id: string;
    nameEnglish: string;
    nameArabic?: string;
    color?: string;
  };
  videoUrl: string;
  sortOrder: number;
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
  __v: number;
};

export default function InfluencerPage() {
  const [influencers, setInfluencers] = useState<Influencer[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Influencer | null>(null);

  useEffect(() => {
    fetchInfluencers();
  }, []);

  const fetchInfluencers = async () => {
    try {
      const data = await api.get<Influencer[]>('/admin/influencer');
      const sorted = data.sort((a, b) => a.sortOrder - b.sortOrder);
      setInfluencers(sorted);
    } catch (error) {
      console.error('Failed to fetch influencers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (payload: any) => {
    try {
      if (editing) {
        await api.put(`/admin/influencer/${editing._id}`, payload);
      } else {
        const maxOrder = influencers.length > 0 ? Math.max(...influencers.map(i => i.sortOrder)) + 1 : 1;
        await api.post('/admin/influencer', { ...payload, sortOrder: maxOrder });
      }
      await fetchInfluencers();
    } catch (error) {
      console.error('Failed to save influencer:', error);
      throw error;
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this influencer?")) return;
    try {
      await api.delete(`/admin/influencer/${id}`);
      await fetchInfluencers();
    } catch (error) {
      console.error('Failed to delete influencer:', error);
    }
  };

  const toggleStatus = async (id: string) => {
    const influencer = influencers.find(i => i._id === id);
    if (!influencer) return;
    
    const newStatus = influencer.status === 'active' ? 'inactive' : 'active';
    try {
      await api.put(`/admin/influencer/${id}`, { ...influencer, status: newStatus, product: influencer.product._id, variant: influencer.variant._id });
      await fetchInfluencers();
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Influencers</h2>
          <div>
            <Button onClick={() => { setEditing(null); setOpen(true); }}><Plus className="mr-2 h-4 w-4" />New Influencer</Button>
          </div>
        </div>

        <Card className="p-4 overflow-auto">
          {loading ? (
            <div className="py-12 text-center text-muted-foreground">Loading influencers...</div>
          ) : influencers.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">No influencers yet</div>
          ) : (
            <table className="w-full text-left table-auto">
              <thead>
                <tr className="text-sm text-muted-foreground">
                  <th className="px-4 py-2">Order</th>
                  <th className="px-4 py-2">Title</th>
                  <th className="px-4 py-2">Product</th>
                  <th className="px-4 py-2">Variant</th>
                  <th className="px-4 py-2">Video URL</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {influencers.map((inf) => (
                  <tr key={inf._id} className="border-t">
                    <td className="px-4 py-3 align-top text-sm text-muted-foreground font-medium">{inf.sortOrder}</td>
                    <td className="px-4 py-3 align-top">
                      <div className="font-medium">{inf.titleEnglish}</div>
                      {inf.titleArabic && <div className="text-sm text-muted-foreground">{inf.titleArabic}</div>}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="font-medium">{inf.product.nameEnglish}</div>
                      {inf.product.nameArabic && <div className="text-sm text-muted-foreground">{inf.product.nameArabic}</div>}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="font-medium">{inf.variant.nameEnglish}</div>
                      {inf.variant.color && <div className="text-sm text-muted-foreground">{inf.variant.color}</div>}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <a href={inf.videoUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm truncate max-w-xs block">
                        {inf.videoUrl}
                      </a>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <button
                        className={`px-3 py-1 rounded text-sm font-medium ${inf.status === 'active' ? 'bg-green-600 text-white' : 'bg-gray-200 text-muted-foreground'}`}
                        onClick={() => toggleStatus(inf._id)}
                      >
                        {inf.status}
                      </button>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => { setEditing(inf); setOpen(true); }}>Edit</Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(inf._id)}>Delete</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        <InfluencerForm open={open} onOpenChange={setOpen} initial={editing} onSave={handleSave} />
      </div>
    </AdminLayout>
  );
}
