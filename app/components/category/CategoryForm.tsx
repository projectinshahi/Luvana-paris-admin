"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { api } from "@/utils/api";

type CategoryPayload = {
    _id?: string;
    nameEnglish: string;
    imageUrlEnglish?: string;
    publicIdEnglish?: string;
    nameArabic?: string;
    imageUrlArabic?: string;
    publicIdArabic?: string;
    descriptionEnglish?: string;
    descriptionArabic?: string;
    status?: "active" | "inactive";
};

export default function CategoryForm({
    open,
    onOpenChange,
    onSave,
    initial,
}: {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    onSave: (payload: CategoryPayload) => Promise<void> | void;
    initial?: CategoryPayload | null;
}) {
    const [form, setForm] = useState<CategoryPayload>({ nameEnglish: "", status: "active" });
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [deletedPublicIds, setDeletedPublicIds] = useState<string[]>([]);

    useEffect(() => {
        if (initial) setForm(initial);
        else setForm({ nameEnglish: "", status: "active" });
        setDeletedPublicIds([]);
    }, [initial, open]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target as HTMLInputElement;
        setForm((s) => ({ ...s, [name]: value }));
    };

    const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, files } = e.target;
        if (!files || files.length === 0) return;
        
        const file = files[0];
        setUploading(true);
        
        try {
            const formData = new FormData();
            formData.append("image", file);
            
            const response = await api.post<{ 
                message: string; 
                image: { 
                    url: string; 
                    publicId: string; 
                    width: number; 
                    height: number; 
                    size: number; 
                    format: string; 
                } 
            }>("/admin/general/upload-image", formData);
            
            const fieldKey = name as "imageUrlEnglish" | "imageUrlArabic";
            const publicIdKey = (name === "imageUrlEnglish" ? "publicIdEnglish" : "publicIdArabic") as "publicIdEnglish" | "publicIdArabic";
            
            setForm((s) => ({
                ...s,
                [fieldKey]: response.image.url,
                [publicIdKey]: response.image.publicId,
            }));
        } catch (error) {
            console.error("Failed to upload image:", error);
            alert("Failed to upload image");
        } finally {
            setUploading(false);
            e.target.value = "";
        }
    };

    const deleteImage = (imageType: "imageUrlEnglish" | "imageUrlArabic") => {
        const publicIdKey = imageType === "imageUrlEnglish" ? "publicIdEnglish" : "publicIdArabic";
        const publicId = form[publicIdKey];
        
        if (publicId && !deletedPublicIds.includes(publicId)) {
            setDeletedPublicIds((prev) => [...prev, publicId]);
        }
        
        setForm((s) => ({ ...s, [imageType]: undefined, [publicIdKey]: undefined }));
    };

    const submit = async () => {
        setSaving(true);
        try {
            if (deletedPublicIds.length > 0) {
                await Promise.all(
                    deletedPublicIds.map((publicId) =>
                        api.delete(`/admin/general/delete-image`, { publicId })
                    )
                );
            }
            
            await onSave(form);
            onOpenChange(false);
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>{initial?._id ? "Edit Category" : "Create Category"}</DialogTitle>
                </DialogHeader>
                <ScrollArea className="flex-1 overflow-auto">
                    <div className="space-y-3 mt-2 pr-4">
                    <div>
                        <label className="block text-sm text-muted-foreground mb-1">Name (English)</label>
                        <Input name="nameEnglish" value={form.nameEnglish} onChange={handleChange} />
                    </div>
                    <div>
                        <label className="block text-sm text-muted-foreground mb-1">Name (Arabic)</label>
                        <Input name="nameArabic" value={form.nameArabic || ""} onChange={handleChange} dir="rtl" lang="ar" className="text-right" />
                    </div>
                    <div>
                        <label className="block text-sm text-muted-foreground mb-1">Image (English)</label>
                        {form.imageUrlEnglish && (
                            <div className="mb-2">
                                <img src={form.imageUrlEnglish} alt="preview" className="h-24 w-24 object-cover rounded" />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="mt-1 text-red-600 hover:text-red-700"
                                    onClick={() => deleteImage("imageUrlEnglish")}
                                >
                                    Remove
                                </Button>
                            </div>
                        )}
                        <input 
                            type="file" 
                            name="imageUrlEnglish" 
                            accept="image/*" 
                            onChange={handleFile} 
                            className="w-full"
                            disabled={uploading}
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-muted-foreground mb-1">Description (English)</label>
                        <Textarea name="descriptionEnglish" value={form.descriptionEnglish || ""} onChange={handleChange} />
                    </div>
                    <div>
                        <label className="block text-sm text-muted-foreground mb-1">Description (Arabic)</label>
                        <Textarea name="descriptionArabic" value={form.descriptionArabic || ""} onChange={handleChange} dir="rtl" lang="ar" className="text-right" />
                    </div>
                    <div>
                        <label className="block text-sm text-muted-foreground mb-1">Image (Arabic)</label>
                        {form.imageUrlArabic && (
                            <div className="mb-2">
                                <img src={form.imageUrlArabic} alt="preview" className="h-24 w-24 object-cover rounded" />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="mt-1 text-red-600 hover:text-red-700"
                                    onClick={() => deleteImage("imageUrlArabic")}
                                >
                                    Remove
                                </Button>
                            </div>
                        )}
                        <input 
                            type="file" 
                            name="imageUrlArabic" 
                            accept="image/*" 
                            onChange={handleFile} 
                            className="w-full"
                            disabled={uploading}
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-muted-foreground mb-1">Status</label>
                        <select name="status" value={form.status} onChange={(e) => setForm((s) => ({ ...s, status: e.target.value as any }))} className="w-full rounded-md border border-input bg-transparent px-3 py-2">
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        </select>
                    </div>
                    </div>
                </ScrollArea>

                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline" disabled={uploading}>Cancel</Button>
                    </DialogClose>
                    <Button onClick={submit} disabled={saving || uploading}>{saving ? 'Saving...' : uploading ? 'Uploading...' : 'Save'}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
