"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { api } from "@/utils/api";

type DescriptionItem = { description: string };

type DescriptionSection = {
  titleEnglish?: string;
  titleArabic?: string;
  descriptionEnglish?: DescriptionItem[];
  descriptionArabic?: DescriptionItem[];
};

type ProductPayload = {
  _id?: string;
  category?: string;
  brand?: string;
  nameEnglish?: string;
  nameArabic?: string;
  shortDescriptionEnglish?: string;
  shortDescriptionArabic?: string;
  isFeatured?: boolean;
  isNew?: boolean;
  status?: "active" | "inactive";
  description?: DescriptionSection[];
  imageUrlEnglish?: Array<{ imageUrl: string; publicId?: string }>;
  imageUrlArabic?: Array<{ imageUrl: string; publicId?: string }>;
};

const STORAGE_KEY = "lp:products";

export default function ProductForm({ productId }: { productId?: string } = {}) {
  const router = useRouter();
  const [form, setForm] = useState<ProductPayload>({
    nameEnglish: "",
    nameArabic: "",
    shortDescriptionEnglish: "",
    shortDescriptionArabic: "",
    category: "",
    brand: "",
    isFeatured: false,
    isNew: false,
    status: "active",
    description: [],
    imageUrlEnglish: [],
    imageUrlArabic: [],
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deletedPublicIds, setDeletedPublicIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(!!productId);
  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);

  useEffect(() => {
    if (!productId) {
      setLoading(false);
      return;
    }
    fetchProduct();
  }, [productId]);

  const fetchProduct = async () => {
    try {
      const data = await api.get<any>(`/admin/product/${productId}`);
      setForm(data);
    } catch (error) {
      console.error('Failed to fetch product:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await api.get<any[]>('/admin/category');
        setCategories(data || []);
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const data = await api.get<any[]>('/admin/brand');
        setBrands(data || []);
      } catch (error) {
        console.error('Failed to fetch brands:', error);
      }
    };
    fetchBrands();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
    setForm((s) => ({ ...s, [name]: value }));
  };

  const handleCheckbox = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setForm((s) => ({ ...s, [name]: checked }));
  };

  const addDescriptionSection = () => {
    setForm((s) => ({
      ...s,
      description: [
        ...(s.description || []),
        {
          titleEnglish: "",
          titleArabic: "",
          descriptionEnglish: [{ description: "" }],
          descriptionArabic: [{ description: "" }],
        },
      ],
    }));
  };

  const removeDescriptionSection = (sectionIdx: number) => {
    setForm((s) => ({
      ...s,
      description: (s.description || []).filter((_, i) => i !== sectionIdx),
    }));
  };

  const updateSectionField = (sectionIdx: number, field: "titleEnglish" | "titleArabic", value: string) => {
    setForm((s) => ({
      ...s,
      description: (s.description || []).map((section, i) =>
        i === sectionIdx ? { ...section, [field]: value } : section
      ),
    }));
  };

  const updateSectionItem = (
    sectionIdx: number,
    lang: "descriptionEnglish" | "descriptionArabic",
    itemIdx: number,
    value: string
  ) => {
    setForm((s) => ({
      ...s,
      description: (s.description || []).map((section, i) => {
        if (i !== sectionIdx) return section;
        const items = (section[lang] || []).map((item, idx) =>
          idx === itemIdx ? { ...item, description: value } : item
        );
        return { ...section, [lang]: items };
      }),
    }));
  };

  const addSectionItem = (sectionIdx: number) => {
    setForm((s) => ({
      ...s,
      description: (s.description || []).map((section, i) => {
        if (i !== sectionIdx) return section;
        return {
          ...section,
          descriptionEnglish: [...(section.descriptionEnglish || []), { description: "" }],
          descriptionArabic: [...(section.descriptionArabic || []), { description: "" }],
        };
      }),
    }));
  };

  const removeSectionItem = (sectionIdx: number, itemIdx: number) => {
    setForm((s) => ({
      ...s,
      description: (s.description || []).map((section, i) => {
        if (i !== sectionIdx) return section;
        return {
          ...section,
          descriptionEnglish: (section.descriptionEnglish || []).filter((_, idx) => idx !== itemIdx),
          descriptionArabic: (section.descriptionArabic || []).filter((_, idx) => idx !== itemIdx),
        };
      }),
    }));
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const fieldName = (e.target as HTMLInputElement).name as "imageUrlEnglish" | "imageUrlArabic";
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
        };
      }>("/admin/general/upload-image", formData);

      setForm((s) => ({
        ...s,
        [fieldName]: [...(s[fieldName] || []), { imageUrl: response.image.url, publicId: response.image.publicId }],
      }));
    } catch (error) {
      console.error("Failed to upload image:", error);
      alert("Failed to upload image");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const removeImage = (field: "imageUrlEnglish" | "imageUrlArabic", idx: number) => {
    setForm((s) => {
      const current = s[field] || [];
      const removed = current[idx];
      if (removed?.publicId) {
        setDeletedPublicIds((prev) => (prev.includes(removed.publicId as string) ? prev : [...prev, removed.publicId as string]));
      }
      return {
        ...s,
        [field]: current.filter((_, i) => i !== idx),
      };
    });
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

      if (productId) {
        await api.put(`/admin/product/${productId}`, form);
      } else {
        await api.post('/admin/product', form);
      }
      router.push('/admin/product');
    } catch (error) {
      console.error('Failed to save product:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm text-muted-foreground mb-1">Category</label>
        <select name="category" value={form.category || ''} onChange={handleChange} className="w-full rounded-md border px-3 py-2">
          <option value="">-- Select category --</option>
          {categories.map((c) => (<option key={c._id} value={c._id}>{c.nameEnglish}</option>))}
        </select>
      </div>

      <div>
        <label className="block text-sm text-muted-foreground mb-1">Brand</label>
        <select name="brand" value={form.brand || ''} onChange={handleChange} className="w-full rounded-md border px-3 py-2">
          <option value="">-- Select brand --</option>
          {brands.map((b) => (<option key={b._id} value={b._id}>{b.nameEnglish}</option>))}
        </select>
      </div>

      <div>
        <label className="block text-sm text-muted-foreground mb-1">Name (English)</label>
        <Input name="nameEnglish" value={form.nameEnglish || ''} onChange={handleChange} />
      </div>

      <div>
        <label className="block text-sm text-muted-foreground mb-1">Name (Arabic)</label>
        <Input name="nameArabic" value={form.nameArabic || ''} onChange={handleChange} dir="rtl" lang="ar" className="text-right" />
      </div>

      <div>
        <label className="block text-sm text-muted-foreground mb-1">Short Description (English)</label>
        <Textarea name="shortDescriptionEnglish" value={form.shortDescriptionEnglish || ''} onChange={handleChange} />
      </div>

      <div>
        <label className="block text-sm text-muted-foreground mb-1">Short Description (Arabic)</label>
        <Textarea name="shortDescriptionArabic" value={form.shortDescriptionArabic || ''} onChange={handleChange} dir="rtl" lang="ar" className="text-right" />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="block text-sm text-muted-foreground">Description Sections</label>
          <Button type="button" variant="outline" size="sm" onClick={addDescriptionSection}>Add Section</Button>
        </div>

        {(form.description || []).map((section, sectionIdx) => (
          <div key={sectionIdx} className="rounded-md border p-3 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">Section {sectionIdx + 1}</div>
              <Button type="button" variant="ghost" size="sm" onClick={() => removeDescriptionSection(sectionIdx)}>Remove</Button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-muted-foreground mb-1">Title (English)</label>
                <Input
                  value={section.titleEnglish || ""}
                  onChange={(e) => updateSectionField(sectionIdx, "titleEnglish", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-1">Title (Arabic)</label>
                <Input
                  value={section.titleArabic || ""}
                  onChange={(e) => updateSectionField(sectionIdx, "titleArabic", e.target.value)}
                  dir="rtl"
                  lang="ar"
                  className="text-right"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-sm text-muted-foreground">Description (English)</label>
                <label className="block text-sm text-muted-foreground">Description (Arabic)</label>
              </div>
              {(section.descriptionEnglish || []).map((item, itemIdx) => (
                <div key={itemIdx} className="grid grid-cols-2 gap-3 items-start">
                  <Input
                    value={item.description || ""}
                    onChange={(e) => updateSectionItem(sectionIdx, "descriptionEnglish", itemIdx, e.target.value)}
                  />
                  <div className="flex items-center gap-2">
                    <Input
                      value={((section.descriptionArabic || [])[itemIdx] || {}).description || ""}
                      onChange={(e) => updateSectionItem(sectionIdx, "descriptionArabic", itemIdx, e.target.value)}
                      dir="rtl"
                      lang="ar"
                      className="text-right"
                    />
                    <Button type="button" variant="ghost" size="sm" onClick={() => removeSectionItem(sectionIdx, itemIdx)}>Remove</Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end">
              <Button type="button" variant="outline" size="sm" onClick={() => addSectionItem(sectionIdx)}>Add Item</Button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-6">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="isFeatured"
            checked={!!form.isFeatured}
            onChange={handleCheckbox}
          />
          Featured
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="isNew"
            checked={!!form.isNew}
            onChange={handleCheckbox}
          />
          New Arrival
        </label>
      </div>

      <div>
        <label className="block text-sm text-muted-foreground mb-1">Images (English)</label>
        <input type="file" name="imageUrlEnglish" accept="image/*" onChange={handleFile} disabled={uploading} />
        <div className="flex gap-2 mt-2">
          {(form.imageUrlEnglish || []).map((img, idx) => (
            <div key={idx} className="relative">
              <img src={img.imageUrl} className="h-20 w-20 object-cover rounded" alt="preview" />
              <button type="button" onClick={() => removeImage('imageUrlEnglish', idx)} className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">×</button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm text-muted-foreground mb-1">Images (Arabic)</label>
        <input type="file" name="imageUrlArabic" accept="image/*" onChange={handleFile} disabled={uploading} />
        <div className="flex gap-2 mt-2">
          {(form.imageUrlArabic || []).map((img, idx) => (
            <div key={idx} className="relative">
              <img src={img.imageUrl} className="h-20 w-20 object-cover rounded" alt="preview" />
              <button type="button" onClick={() => removeImage('imageUrlArabic', idx)} className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">×</button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={() => router.push('/admin/product')}>Cancel</Button>
        <Button onClick={submit} disabled={saving || uploading}>{saving ? 'Saving...' : uploading ? 'Uploading...' : 'Save'}</Button>
      </div>
    </div>
  );
}
