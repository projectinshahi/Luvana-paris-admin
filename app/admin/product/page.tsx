"use client";

import React, { useEffect, useState } from "react";
import { Plus, X } from "lucide-react";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/link";
import { api } from "@/utils/api";

type Product = {
  _id: string;
  category?: { _id: string; nameEnglish: string; nameArabic?: string };
  brand?: { _id: string; nameEnglish: string; nameArabic?: string };
  nameEnglish: string;
  nameArabic?: string;
  shortDescriptionEnglish?: string;
  shortDescriptionArabic?: string;
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
  __v: number;
};

type Category = {
  _id: string;
  nameEnglish: string;
  nameArabic?: string;
};

type Brand = {
  _id: string;
  nameEnglish: string;
  nameArabic?: string;
};

type PaginationInfo = {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
};

type ProductResponse = {
  items: Product[];
  pagination: PaginationInfo;
};

export default function ProductListPage() {
  const [items, setItems] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    totalItems: 0,
    totalPages: 1,
  });

  // Filter states
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [brandFilter, setBrandFilter] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchFiltersData();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search, status, categoryFilter, brandFilter]);

  useEffect(() => {
    fetchProducts();
  }, [search, status, categoryFilter, brandFilter, page]);

  const fetchFiltersData = async () => {
    try {
      const [categoriesData, brandsData] = await Promise.all([
        api.get<Category[]>('/admin/category'),
        api.get<Brand[]>('/admin/brand'),
      ]);
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
      setBrands(Array.isArray(brandsData) ? brandsData : []);
    } catch (error) {
      console.error('Failed to fetch filter data:', error);
      setCategories([]);
      setBrands([]);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', String(page));
      params.append('limit', '10');
      if (search) params.append('search', search);
      if (status) params.append('status', status);
      if (categoryFilter) params.append('category', categoryFilter);
      if (brandFilter) params.append('brand', brandFilter);

      const url = `/admin/product?${params.toString()}`;
      const data = await api.get<ProductResponse>(url);
      setItems(Array.isArray(data?.items) ? data.items : []);
      if (data?.pagination) {
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };


  const handleDelete = async (id: string) => {
    if (!confirm("Delete product?")) return;
    try {
      await api.delete(`/admin/product/${id}`);
      await fetchProducts();
    } catch (error) {
      console.error('Failed to delete product:', error);
    }
  };

  const toggleStatus = async (id: string) => {
    const product = items.find(p => p._id === id);
    if (!product) return;
    
    const newStatus = product.status === 'active' ? 'inactive' : 'active';
    try {
      await api.put(`/admin/product/${id}`, { ...product, status: newStatus });
      await fetchProducts();
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const clearFilters = () => {
    setSearch("");
    setStatus("");
    setCategoryFilter("");
    setBrandFilter("");
    setPage(1);
  };

  const hasActiveFilters = search || status || categoryFilter || brandFilter;

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Products</h2>
          <div>
            <Link href="/admin/product/new"><Button><Plus className="mr-2 h-4 w-4" />New Product</Button></Link>
          </div>
        </div>

        <Card className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="flex-1">
              <label className="text-sm text-muted-foreground">Search</label>
              <div className="flex gap-2">
                <Input
                  placeholder="Search by name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="flex-1"
                />
                {search && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSearch("")}
                    className="px-2"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            <div className="flex-1">
              <label className="text-sm text-muted-foreground">Status</label>
              <div className="flex gap-2 items-center">
                <Select value={status} onValueChange={(value) => setStatus(value === "__clear__" ? "" : value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="__clear__">Clear</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex-1">
              <label className="text-sm text-muted-foreground">Category</label>
              <Select value={categoryFilter} onValueChange={(value) => setCategoryFilter(value === "__clear__" ? "" : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat._id} value={cat._id}>
                      {cat.nameEnglish}
                    </SelectItem>
                  ))}
                  <SelectItem value="__clear__">Clear</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1">
              <label className="text-sm text-muted-foreground">Brand</label>
              <Select value={brandFilter} onValueChange={(value) => setBrandFilter(value === "__clear__" ? "" : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All Brands" />
                </SelectTrigger>
                <SelectContent>
                  {brands.map((brand) => (
                    <SelectItem key={brand._id} value={brand._id}>
                      {brand.nameEnglish}
                    </SelectItem>
                  ))}
                  <SelectItem value="__clear__">Clear</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {hasActiveFilters && (
              <div className="flex items-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearFilters}
                  className="w-full"
                >
                  <X className="mr-2 h-4 w-4" />
                  Clear Filters
                </Button>
              </div>
            )}
          </div>
        </Card>

        <Card className="p-4">
          {loading ? (
            <div className="py-12 text-center text-muted-foreground">Loading products...</div>
          ) : items.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">No products found</div>
          ) : (
            <table className="w-full text-left table-auto">
              <thead>
                <tr className="text-sm text-muted-foreground">
                  <th className="px-4 py-2">Name</th>
                  <th className="px-4 py-2">Category</th>
                  <th className="px-4 py-2">Brand</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((p) => (
                  <tr key={p._id} className="border-t">
                    <td className="px-4 py-3 align-top font-medium">{p.nameEnglish}</td>
                    <td className="px-4 py-3 align-top">{p.category?.nameEnglish || '-'}</td>
                    <td className="px-4 py-3 align-top">{p.brand?.nameEnglish || '-'}</td>
                    <td className="px-4 py-3 align-top">
                      <button className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${p.status === 'active' ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`} onClick={() => toggleStatus(p._id)}>{p.status}</button>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="flex items-center gap-2">
                        <Link href={`/admin/product/${p._id}/edit`}><Button className="bg-blue-600 hover:bg-blue-700 text-white" size="sm">Edit</Button></Link>
                        <Link href={`/admin/product/${p._id}`}><Button className="bg-purple-600 hover:bg-purple-700 text-white" size="sm">Variants</Button></Link>
                        <Button className="bg-red-600 hover:bg-red-700 text-white" size="sm" onClick={() => handleDelete(p._id)}>Delete</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {items.length > 0 && (
            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                {Math.min(pagination.page * pagination.limit, pagination.totalItems)} of{" "}
                {pagination.totalItems} products
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded">
                  Page {pagination.page} of {pagination.totalPages}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(Math.min(pagination.totalPages, page + 1))}
                  disabled={page === pagination.totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </AdminLayout>
  );
}
