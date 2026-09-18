"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/utils/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Country = {
  _id: string;
  nameEnglish: string;
  nameArabic: string;
  abbreviation?: string;
  flagUrl: string;
  publicId: string;
  currencyValue: string | number;
  status: string;
};

type CountryFormProps = {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  country: Country | null;
};

export default function CountryForm({ open, onClose, onSave, country }: CountryFormProps) {
  const [formData, setFormData] = useState({
    nameEnglish: "",
    nameArabic: "",
    abbreviation: "",
    flagUrl: "",
    publicId: "",
    currencyValue: "",
    status: "active",
  });

  const [flagFile, setFlagFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletedPublicId, setDeletedPublicId] = useState<string | null>(null);

  useEffect(() => {
    if (country) {
      setFormData({
        nameEnglish: country.nameEnglish || "",
        nameArabic: country.nameArabic || "",
        abbreviation: country.abbreviation || "",
        flagUrl: country.flagUrl || "",
        publicId: country.publicId || "",
        currencyValue: String(country.currencyValue || ""),
        status: country.status || "active",
      });
      setFlagFile(null);
      setDeletedPublicId(null);
    } else {
      setFormData({
        nameEnglish: "",
        nameArabic: "",
        abbreviation: "",
        flagUrl: "",
        publicId: "",
        currencyValue: "",
        status: "active",
      });
      setFlagFile(null);
      setDeletedPublicId(null);
    }
  }, [country, open]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFlagFile(e.target.files[0]);
      
      // Mark old image for deletion if exists
      if (formData.publicId) {
        setDeletedPublicId(formData.publicId);
      }
    }
  };

  const handleRemoveFlag = () => {
    if (formData.publicId) {
      setDeletedPublicId(formData.publicId);
    }
    setFormData({ ...formData, flagUrl: "", publicId: "" });
    setFlagFile(null);
  };

  const uploadImage = async (file: File) => {
    const formDataUpload = new FormData();
    formDataUpload.append("image", file);

    const response = await api.post<{
      image: { url: string; publicId: string; width: number; height: number; size: number; format: string };
    }>("/admin/general/upload-image", formDataUpload);

    return {
      url: response.image.url,
      publicId: response.image.publicId,
    };
  };

  const handleSave = async () => {
    if (!formData.nameEnglish || !formData.nameArabic || !formData.abbreviation || !formData.currencyValue) {
      alert("Please fill in all required fields");
      return;
    }

    setSaving(true);

    try {
      // Upload new flag if selected
      let flagUrl = formData.flagUrl;
      let publicId = formData.publicId;

      if (flagFile) {
        setUploading(true);
        const uploadResult = await uploadImage(flagFile);
        flagUrl = uploadResult.url;
        publicId = uploadResult.publicId;
        setUploading(false);
      }

      const payload = {
        nameEnglish: formData.nameEnglish,
        nameArabic: formData.nameArabic,
        abbreviation: formData.abbreviation,
        flagUrl: flagUrl,
        publicId: publicId,
        currencyValue: Number(formData.currencyValue),
        status: formData.status,
      };

      if (country) {
        await api.put(`/admin/country/${country._id}`, payload);
      } else {
        await api.post("/admin/country", payload);
      }

      // The old flag is deleted only once the saved country no longer uses it.
      if (deletedPublicId) {
        api.delete("/admin/general/delete-image", { publicId: deletedPublicId }).catch((error) => {
          console.error("Failed to delete old image:", error);
        });
      }

      onSave();
    } catch (error) {
      console.error("Failed to save country:", error);
      alert("Failed to save country");
    } finally {
      setSaving(false);
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{country ? "Edit Country" : "Add Country"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="nameEnglish">Country Name (English) *</Label>
              <Input
                id="nameEnglish"
                value={formData.nameEnglish}
                onChange={(e) => setFormData({ ...formData, nameEnglish: e.target.value })}
                placeholder="Enter English name"
              />
            </div>

            <div>
              <Label htmlFor="nameArabic">Country Name (Arabic) *</Label>
              <Input
                id="nameArabic"
                value={formData.nameArabic}
                onChange={(e) => setFormData({ ...formData, nameArabic: e.target.value })}
                placeholder="أدخل الاسم بالعربية"
                dir="rtl"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="abbreviation">Abbreviation *</Label>
              <Input
                id="abbreviation"
                value={formData.abbreviation}
                onChange={(e) => setFormData({ ...formData, abbreviation: e.target.value.toUpperCase() })}
                placeholder="e.g. KW"
                maxLength={5}
              />
            </div>

            <div>
              <Label htmlFor="currencyValue">Currency Value *</Label>
              <Input
                id="currencyValue"
                type="number"
                value={formData.currencyValue}
                onChange={(e) => setFormData({ ...formData, currencyValue: e.target.value })}
                placeholder="Enter currency value"
              />
            </div>

          </div>

          <div>
            <Label htmlFor="status">Status</Label>
            <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="flag">Flag Image</Label>
            <Input
              id="flag"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="cursor-pointer"
            />
            {(formData.flagUrl || flagFile) && (
              <div className="mt-2">
                <div className="relative inline-block">
                  <img
                    src={flagFile ? URL.createObjectURL(flagFile) : formData.flagUrl}
                    alt="Flag preview"
                    className="h-20 w-32 object-cover rounded border"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute -top-2 -right-2"
                    onClick={handleRemoveFlag}
                  >
                    ×
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={saving || uploading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || uploading}>
            {uploading ? "Uploading..." : saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
