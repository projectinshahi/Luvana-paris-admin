"use client";

import React, { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { api } from "@/utils/api";
import CountryForm from "@/components/country/CountryForm";
import { Badge } from "@/components/ui/badge";

type Country = {
  _id: string;
  nameEnglish: string;
  nameArabic: string;
  abbreviation?: string;
  flagUrl: string;
  publicId: string;
  currencyValue: string | number;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export default function CountryPage() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingCountry, setEditingCountry] = useState<Country | null>(null);

  useEffect(() => {
    fetchCountries();
  }, []);

  const fetchCountries = async () => {
    setLoading(true);
    try {
      const data = await api.get<Country[]>("/admin/country");
      setCountries(data);
    } catch (error) {
      console.error("Failed to fetch countries:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, publicId: string) => {
    if (!confirm("Are you sure you want to delete this country?")) return;

    try {
      await api.delete(`/admin/country/${id}`);
      
      // Delete the flag image from Cloudinary
      if (publicId) {
        try {
          await api.delete("/admin/general/delete-image", { publicId });
        } catch (error) {
          console.error("Failed to delete flag image:", error);
        }
      }
      
      fetchCountries();
    } catch (error) {
      console.error("Failed to delete country:", error);
      alert("Failed to delete country");
    }
  };

  const handleStatusToggle = async (country: Country) => {
    const newStatus = country.status === "active" ? "inactive" : "active";
    try {
      await api.put(`/admin/country/${country._id}`, {
        ...country,
        status: newStatus,
      });
      fetchCountries();
    } catch (error) {
      console.error("Failed to update status:", error);
      alert("Failed to update status");
    }
  };

  const handleEdit = (country: Country) => {
    setEditingCountry(country);
    setFormOpen(true);
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setEditingCountry(null);
  };

  const handleSaveSuccess = () => {
    fetchCountries();
    handleCloseForm();
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Countries</h2>
          <Button onClick={() => setFormOpen(true)}>Add Country</Button>
        </div>

        {loading ? (
          <div className="text-center text-muted-foreground">Loading countries...</div>
        ) : countries.length === 0 ? (
          <div className="text-center text-muted-foreground">No countries found</div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Flag
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name (English)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Abbreviation
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Currency Value
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {countries.map((country) => (
                  <tr key={country._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {country.flagUrl ? (
                        <img
                          src={country.flagUrl}
                          alt={country.nameEnglish}
                          className="h-10 w-16 object-cover rounded"
                        />
                      ) : (
                        <div className="h-10 w-16 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500">
                          No flag
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {country.nameEnglish}
                      </div>
                      <div className="text-sm text-gray-900" dir="rtl">
                        {country.nameArabic}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {country.abbreviation || "-"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {country.currencyValue}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge
                        className={`cursor-pointer font-medium px-3 py-1 rounded-full text-xs ${
                          country.status === "active"
                            ? "bg-green-100 text-green-700 hover:bg-green-200"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                        onClick={() => handleStatusToggle(country)}
                      >
                        {country.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <Button
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                        onClick={() => handleEdit(country)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        className="bg-red-600 hover:bg-red-700 text-white"
                        onClick={() => handleDelete(country._id, country.publicId)}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <CountryForm
          open={formOpen}
          onClose={handleCloseForm}
          onSave={handleSaveSuccess}
          country={editingCountry}
        />
      </div>
    </AdminLayout>
  );
}
