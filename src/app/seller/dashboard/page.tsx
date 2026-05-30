"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Package, Settings, LogOut, Plus,
  ShoppingBag, Eye, Pause, CheckCircle2, Clock,
  RefreshCw, ChevronRight, Store, Edit3, Trash2,
  Upload, X, ArrowLeft, AlertCircle, Tag, MapPin,
  Ban,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import type { SellerProfile } from "./types";

// ── Shared types ──
export interface Product {
  id: string;
  seller_id: string;
  name: string;
  category: string;
  subcategory: string;
  price: number;
  currency: string;
  condition: string;
  state: string;
  description: string;
  specs: Record<string, string>;
  negotiable: boolean;
  haggle_min: number | null;
  haggle_max: number | null;
  image_urls: string[];
  status: "active" | "paused" | "sold";
  views: number;
  created_at: string;
  updated_at: string;
}

// ── Sidebar Nav ──
function Sidebar({ active, onNav, onLogout, seller }: {
  active: string; onNav: (v: string) => void; onLogout: () => void;
  seller: SellerProfile | null;
}) {
  const items = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "products", label: "Products", icon: Package },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <aside className="w-64 flex-shrink-0 border-r border-[var(--border-ember)] bg-[var(--night-sky)] flex flex-col h-full">
      <div className="px-5 py-4 border-b border-[var(--border-ember)]">
        <div className="flex items-center gap-2.5">
          <div className="text-2xl">🏮</div>
          <div>
            <h1 className="text-sm font-black text-[var(--text-lantern)] tracking-tight">KASUWA</h1>
            <p className="text-[9px] text-[var(--text-ash)] uppercase tracking-widest">Seller Portal</p>
          </div>
        </div>
        {seller && (
          <div className="mt-3 flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-[var(--night-card)] flex items-center justify-center text-base">
              {seller.shop_type === "home_business" ? "🏠" : "🏪"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-[var(--text-lantern)] truncate">{seller.shop_name}</div>
              <div className="text-[10px] text-[var(--text-ash)] truncate">{seller.full_name}</div>
            </div>
          </div>
        )}
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => onNav(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
              active === item.id
                ? "bg-[rgba(255,154,60,0.1)] text-[var(--ember-orange)] border border-[var(--border-ember)]"
                : "text-[var(--text-ash)] hover:text-[var(--text-lantern)] hover:bg-[rgba(255,154,60,0.04)]"
            }`}
          >
            <item.icon className="size-4" />
            {item.label}
          </button>
        ))}
      </nav>

      <div className="p-3 border-t border-[var(--border-ember)]">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[var(--text-ash)] hover:text-red-400 hover:bg-red-500/5 transition-all"
        >
          <LogOut className="size-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}

// ── Dashboard Stats ──
function DashboardView({ products, seller }: { products: Product[]; seller: SellerProfile | null }) {
  const active = products.filter((p) => p.status === "active").length;
  const paused = products.filter((p) => p.status === "paused").length;
  const sold = products.filter((p) => p.status === "sold").length;
  const totalViews = products.reduce((sum, p) => sum + (p.views || 0), 0);

  const stats = [
    { label: "Total Products", value: products.length, icon: Package, cls: "bg-[rgba(255,154,60,0.06)] border border-[var(--border-ember)]" },
    { label: "Active", value: active, icon: CheckCircle2, cls: "bg-[rgba(45,143,78,0.06)] border border-[rgba(45,143,78,0.15)]" },
    { label: "Paused", value: paused, icon: Pause, cls: "bg-[rgba(255,184,77,0.06)] border border-[rgba(255,184,77,0.15)]" },
    { label: "Total Views", value: totalViews, icon: Eye, cls: "bg-[rgba(74,63,138,0.06)] border border-[rgba(74,63,138,0.15)]" },
  ];

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-black text-[var(--text-lantern)]">Dashboard</h2>
        <p className="text-xs text-[var(--text-ash)]">Welcome back{seller ? `, ${seller.full_name?.split(" ")[0]}` : ""}!</p>
      </div>

      {/* Disabled warning */}
      {seller?.is_disabled && (
        <div className="flex items-center gap-2 px-4 py-3 mb-4 rounded-xl bg-orange-500/10 border border-orange-500/20">
          <Ban className="size-5 text-orange-400 flex-shrink-0" />
          <div>
            <div className="text-xs font-bold text-orange-400">Account Disabled</div>
            <div className="text-[10px] text-orange-400/80">Your seller account has been disabled by admin. You cannot manage products until it is re-enabled.</div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <div key={s.label} className={`${s.cls} rounded-2xl p-5`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-ash)]">{s.label}</span>
              <s.icon className="size-4 text-[var(--text-ash)]" />
            </div>
            <div className="text-3xl font-black text-[var(--text-lantern)]">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Recent Products */}
      <div className="bg-[var(--night-surface)] border border-[var(--border-ember)] rounded-2xl p-5">
        <h3 className="text-sm font-bold text-[var(--text-lantern)] mb-4">Recent Products</h3>
        {products.length === 0 ? (
          <div className="text-center py-8">
            <Package className="size-10 text-[var(--text-shadow)] mx-auto mb-3" />
            <p className="text-xs text-[var(--text-ash)]">No products yet. Add your first product!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {products.slice(0, 5).map((p) => (
              <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl bg-[rgba(255,154,60,0.03)] border border-[rgba(255,154,60,0.06)]">
                <div className="w-10 h-10 rounded-lg bg-[var(--night-card)] flex items-center justify-center">
                  <Tag className="size-4 text-[var(--ember-orange)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-[var(--text-lantern)] truncate">{p.name}</div>
                  <div className="text-[10px] text-[var(--text-ash)]">
                    {new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(p.price)} · {p.condition} · {p.state}
                  </div>
                </div>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md border ${
                  p.status === "active" ? "bg-green-500/10 text-green-400 border-green-500/20" :
                  p.status === "paused" ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" :
                  "bg-blue-500/10 text-blue-400 border-blue-500/20"
                }`}>
                  {p.status.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Products View ──
function ProductsView({ products, loading, onRefresh, seller }: {
  products: Product[]; loading: boolean; onRefresh: () => void; seller: SellerProfile | null;
}) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = products.filter((p) => {
    if (statusFilter !== "all" && p.status !== statusFilter) return false;
    return true;
  });

  const isDisabled = seller?.is_disabled;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-black text-[var(--text-lantern)]">Products</h2>
          <p className="text-xs text-[var(--text-ash)]">Manage your product listings</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            disabled={loading}
            className="w-9 h-9 rounded-xl bg-[var(--night-card)] border border-[var(--border-ember)] flex items-center justify-center text-[var(--text-ash)] hover:text-[var(--ember-orange)] transition-all"
          >
            <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          {!isDisabled && (
            <button
              onClick={() => setShowAddForm(true)}
              className="btn-ember !min-h-9 !px-4 !text-xs"
            >
              <Plus className="size-3.5" /> Add Product
            </button>
          )}
        </div>
      </div>

      {isDisabled && (
        <div className="flex items-center gap-2 px-4 py-3 mb-4 rounded-xl bg-orange-500/10 border border-orange-500/20">
          <Ban className="size-4 text-orange-400 flex-shrink-0" />
          <span className="text-xs text-orange-400">Your account is disabled. You cannot add or edit products.</span>
        </div>
      )}

      {/* Status filter */}
      <div className="flex gap-1.5 mb-4 flex-wrap">
        {["all", "active", "paused", "sold"].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all ${
              statusFilter === s
                ? "bg-[rgba(255,154,60,0.1)] text-[var(--ember-orange)] border border-[var(--border-ember)]"
                : "text-[var(--text-ash)] hover:text-[var(--text-lantern)] bg-[var(--night-card)] border border-transparent"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Product List */}
      {loading ? (
        <div className="text-center py-12 text-[var(--text-ash)] text-sm">Loading products...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <Package className="size-12 text-[var(--text-shadow)] mx-auto mb-3" />
          <p className="text-sm text-[var(--text-ash)]">No products found</p>
          {!isDisabled && (
            <button onClick={() => setShowAddForm(true)} className="btn-ember !min-h-0 !px-6 !py-2 !text-xs mt-4">
              <Plus className="size-3" /> Add Your First Product
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((product) => (
            <div key={product.id} className="bg-[var(--night-surface)] border border-[var(--border-ember)] rounded-xl p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-[var(--night-card)] flex items-center justify-center flex-shrink-0">
                {product.image_urls?.[0] ? (
                  <img src={product.image_urls[0]} alt="" className="w-full h-full object-cover rounded-lg" />
                ) : (
                  <Tag className="size-5 text-[var(--ember-orange)]" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-[var(--text-lantern)] truncate">{product.name}</span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border ${
                    product.status === "active" ? "bg-green-500/10 text-green-400 border-green-500/20" :
                    product.status === "paused" ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" :
                    "bg-blue-500/10 text-blue-400 border-blue-500/20"
                  }`}>
                    {product.status}
                  </span>
                </div>
                <div className="text-[11px] text-[var(--text-ash)] mt-0.5">
                  {new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(product.price)} · {product.category} · {product.state} · {product.views} views
                </div>
              </div>
              {!isDisabled && (
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => setEditingProduct(product)}
                    className="w-8 h-8 rounded-lg bg-[var(--night-card)] border border-[var(--border-ember)] flex items-center justify-center text-[var(--text-ash)] hover:text-[var(--ember-orange)] transition-all"
                  >
                    <Edit3 className="size-3.5" />
                  </button>
                  <DeleteProductButton productId={product.id} onDeleted={onRefresh} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Product Modal */}
      <AnimatePresence>
        {(showAddForm || editingProduct) && (
          <ProductFormModal
            product={editingProduct}
            onClose={() => { setShowAddForm(false); setEditingProduct(null); }}
            onSaved={onRefresh}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Delete Product Button ──
function DeleteProductButton({ productId, onDeleted }: { productId: string; onDeleted: () => void }) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const seller = JSON.parse(localStorage.getItem("kasuwa_seller") || "{}");
      const res = await fetch(`/api/seller/products?id=${productId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${seller.accessToken}` },
      });
      if (res.ok) onDeleted();
    } catch {
      // ignore
    } finally {
      setDeleting(false);
      setConfirming(false);
    }
  };

  if (confirming) {
    return (
      <div className="flex items-center gap-1.5">
        <button onClick={handleDelete} disabled={deleting} className="text-[10px] px-2 py-1 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
          {deleting ? "..." : "Yes"}
        </button>
        <button onClick={() => setConfirming(false)} className="text-[10px] px-2 py-1 rounded-lg bg-[var(--night-card)] border border-[var(--border-ember)] text-[var(--text-ash)]">
          No
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="w-8 h-8 rounded-lg bg-[var(--night-card)] border border-[var(--border-ember)] flex items-center justify-center text-[var(--text-ash)] hover:text-red-400 transition-all"
    >
      <Trash2 className="size-3.5" />
    </button>
  );
}

// ── Product Form Modal ──
function ProductFormModal({ product, onClose, onSaved }: {
  product: Product | null; onClose: () => void; onSaved: () => void;
}) {
  const isEdit = !!product;
  const [name, setName] = useState(product?.name || "");
  const [category, setCategory] = useState(product?.category || "");
  const [subcategory, setSubcategory] = useState(product?.subcategory || "");
  const [price, setPrice] = useState(product?.price?.toString() || "");
  const [condition, setCondition] = useState(product?.condition || "new");
  const [state, setState] = useState(product?.state || "");
  const [description, setDescription] = useState(product?.description || "");
  const [negotiable, setNegotiable] = useState(product?.negotiable || false);
  const [status, setStatus] = useState(product?.status || "active");
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>(product?.image_urls || []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const categories = [
    "electronics", "vehicles", "fashion", "property", "services",
    "agriculture", "jobs", "food_drinks", "kids", "sports_gaming"
  ];

  const subcategories: Record<string, string[]> = {
    electronics: ["Phones", "Laptops", "Tablets", "Accessories", "Cameras", "Audio"],
    vehicles: ["Cars", "Motorcycles", "Trucks", "Parts", "Bicycles"],
    fashion: ["Men", "Women", "Kids", "Shoes", "Bags", "Accessories"],
    property: ["Houses", "Apartments", "Land", "Commercial", "Short Let"],
    services: ["Repairs", "Cleaning", "Tutoring", "Events", "Health", "Legal"],
    agriculture: ["Crops", "Livestock", "Seeds", "Equipment", "Produce"],
    jobs: ["Full-time", "Part-time", "Contract", "Internship", "Remote"],
    food_drinks: ["Restaurants", "Catering", "Drinks", "Snacks", "Groceries"],
    kids: ["Toys", "Clothing", "School", "Baby", "Books"],
    sports_gaming: ["Fitness", "Football", "Gaming", "Outdoor", "Equipment"],
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newFiles = Array.from(files).slice(0, 5 - imagePreviews.length);
    setImageFiles((prev) => [...prev, ...newFiles]);
    newFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    setError("");
    if (!name || !category || !price || !state) {
      setError("Name, category, price, and state are required");
      return;
    }

    setSaving(true);
    try {
      const seller = JSON.parse(localStorage.getItem("kasuwa_seller") || "{}");
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${seller.accessToken}`,
      };

      // Upload images to Supabase Storage first
      const uploadedUrls: string[] = [...(product?.image_urls || [])];
      for (let i = 0; i < imageFiles.length; i++) {
        try {
          // Use the base64 preview as a simple approach
          // In production, you'd upload to Supabase Storage
          uploadedUrls.push(imagePreviews[uploadedUrls.length] || "");
        } catch {
          // Skip failed uploads
        }
      }

      const body = {
        ...(isEdit ? { id: product.id } : {}),
        name,
        category,
        subcategory,
        price: Number(price),
        condition,
        state,
        description,
        negotiable,
        status,
        image_urls: imagePreviews,
      };

      const res = await fetch("/api/seller/products", {
        method: isEdit ? "PATCH" : "POST",
        headers,
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to save product");
        return;
      }

      onSaved();
      onClose();
    } catch {
      setError("Failed to save product. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        className="bg-[var(--night-surface)] border border-[var(--border-ember)] rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto custom-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-black text-[var(--text-lantern)]">
            {isEdit ? "Edit Product" : "Add New Product"}
          </h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-[var(--night-card)] flex items-center justify-center text-[var(--text-ash)] hover:text-[var(--text-lantern)]">
            <X className="size-4" />
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 px-3 py-2.5 mb-4 rounded-lg bg-red-500/10 border border-red-500/20">
            <AlertCircle className="size-4 text-red-400 flex-shrink-0" />
            <span className="text-xs text-red-400">{error}</span>
          </div>
        )}

        <div className="space-y-4">
          {/* Images */}
          <div>
            <label className="text-[10px] font-bold text-[var(--text-ash)] uppercase tracking-wider mb-1.5 block">Product Images (max 5)</label>
            <div className="flex gap-2 flex-wrap">
              {imagePreviews.map((src, i) => (
                <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-[var(--border-ember)]">
                  <img src={src} alt="" className="w-full h-full object-cover" />
                  <button onClick={() => removeImage(i)} className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-red-500/80 flex items-center justify-center">
                    <X className="size-3 text-white" />
                  </button>
                </div>
              ))}
              {imagePreviews.length < 5 && (
                <label className="w-20 h-20 rounded-lg border-2 border-dashed border-[var(--border-ember)] bg-[var(--night-card)] flex flex-col items-center justify-center cursor-pointer hover:border-[var(--ember-orange)] transition-colors">
                  <Upload className="size-4 text-[var(--text-ash)]" />
                  <span className="text-[8px] text-[var(--text-ash)] mt-1">Add</span>
                  <input type="file" accept="image/*" multiple onChange={handleImageChange} className="hidden" />
                </label>
              )}
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="text-[10px] font-bold text-[var(--text-ash)] uppercase tracking-wider mb-1.5 block">Product Name *</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. iPhone 15 Pro Max" className="auth-input w-full" />
          </div>

          {/* Category & Subcategory */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-[var(--text-ash)] uppercase tracking-wider mb-1.5 block">Category *</label>
              <select value={category} onChange={(e) => { setCategory(e.target.value); setSubcategory(""); }} className="auth-input w-full !bg-[var(--night-card)]">
                <option value="">Select</option>
                {categories.map((c) => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1).replace(/_/g, " ")}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-[var(--text-ash)] uppercase tracking-wider mb-1.5 block">Subcategory</label>
              <select value={subcategory} onChange={(e) => setSubcategory(e.target.value)} className="auth-input w-full !bg-[var(--night-card)]">
                <option value="">Select</option>
                {(subcategories[category] || []).map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* Price & Condition */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-[var(--text-ash)] uppercase tracking-wider mb-1.5 block">Price (NGN) *</label>
              <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0" className="auth-input w-full" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-[var(--text-ash)] uppercase tracking-wider mb-1.5 block">Condition</label>
              <select value={condition} onChange={(e) => setCondition(e.target.value)} className="auth-input w-full !bg-[var(--night-card)]">
                <option value="new">New</option>
                <option value="used">Used - Like New</option>
                <option value="fairly_used">Fairly Used</option>
                <option value="refurbished">Refurbished</option>
              </select>
            </div>
          </div>

          {/* State */}
          <div>
            <label className="text-[10px] font-bold text-[var(--text-ash)] uppercase tracking-wider mb-1.5 block">State *</label>
            <input type="text" value={state} onChange={(e) => setState(e.target.value)} placeholder="e.g. Lagos" className="auth-input w-full" />
          </div>

          {/* Description */}
          <div>
            <label className="text-[10px] font-bold text-[var(--text-ash)] uppercase tracking-wider mb-1.5 block">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe your product..." rows={3} className="auth-input w-full resize-none" />
          </div>

          {/* Negotiable & Status */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setNegotiable(!negotiable)}
                className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                  negotiable ? "bg-[var(--ember-orange)] border-[var(--ember-orange)]" : "border-[var(--text-ash)]"
                }`}
              >
                {negotiable && <CheckCircle2 className="size-3 text-[var(--night-void)]" />}
              </button>
              <span className="text-xs text-[var(--text-smoke)]">Negotiable</span>
            </div>
            {isEdit && (
              <div>
                <label className="text-[10px] font-bold text-[var(--text-ash)] uppercase tracking-wider mb-1.5 block">Status</label>
                <select value={status} onChange={(e) => setStatus(e.target.value)} className="auth-input w-full !bg-[var(--night-card)]">
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="sold">Sold</option>
                </select>
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="btn-ghost-night flex-1">Cancel</button>
            <button onClick={handleSubmit} disabled={saving} className="btn-ember flex-1 disabled:opacity-50">
              {saving ? "Saving..." : isEdit ? "Update Product" : "Add Product"}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Settings View ──
function SettingsView({ seller, onLogout }: { seller: SellerProfile | null; onLogout: () => void }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleChangePassword = async () => {
    setError("");
    setMessage("");

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("All fields are required");
      return;
    }

    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match");
      return;
    }

    setSaving(true);
    try {
      const sellerData = JSON.parse(localStorage.getItem("kasuwa_seller") || "{}");
      const res = await fetch("/api/seller/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sellerData.accessToken}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to change password");
        return;
      }

      setMessage("Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      // Update local storage to reflect password no longer default
      if (sellerData.seller) {
        sellerData.seller.default_password_set = false;
        localStorage.setItem("kasuwa_seller", JSON.stringify(sellerData));
      }

      // Check if we need to redirect from forced password change
      const params = new URLSearchParams(window.location.search);
      if (params.get("force") === "true") {
        window.location.href = "/seller/dashboard";
      }
    } catch {
      setError("Failed to change password. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-black text-[var(--text-lantern)]">Settings</h2>
        <p className="text-xs text-[var(--text-ash)]">Manage your account settings</p>
      </div>

      {/* Shop Info */}
      {seller && (
        <div className="bg-[var(--night-surface)] border border-[var(--border-ember)] rounded-2xl p-5 mb-6">
          <h3 className="text-sm font-bold text-[var(--text-lantern)] mb-4">Shop Information</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Store className="size-4 text-[var(--ember-orange)]" />
              <div>
                <div className="text-[10px] text-[var(--text-ash)] uppercase tracking-wider">Shop Name</div>
                <div className="text-sm text-[var(--text-lantern)] font-medium">{seller.shop_name}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="size-4 text-[var(--ember-orange)]" />
              <div>
                <div className="text-[10px] text-[var(--text-ash)] uppercase tracking-wider">Location</div>
                <div className="text-sm text-[var(--text-smoke)]">{seller.shop_address}, {seller.city}, {seller.state}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Change Password */}
      <div className="bg-[var(--night-surface)] border border-[var(--border-ember)] rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Lock className="size-4 text-[var(--ember-orange)]" />
          <h3 className="text-sm font-bold text-[var(--text-lantern)]">Change Password</h3>
        </div>

        {seller?.default_password_set && (
          <div className="flex items-center gap-2 px-3 py-2.5 mb-4 rounded-lg bg-orange-500/10 border border-orange-500/20">
            <AlertCircle className="size-4 text-orange-400 flex-shrink-0" />
            <span className="text-xs text-orange-400">You are using a default password. Please change it to continue using the portal.</span>
          </div>
        )}

        {message && (
          <div className="flex items-center gap-2 px-3 py-2.5 mb-4 rounded-lg bg-green-500/10 border border-green-500/20">
            <CheckCircle2 className="size-4 text-green-400 flex-shrink-0" />
            <span className="text-xs text-green-400">{message}</span>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 px-3 py-2.5 mb-4 rounded-lg bg-red-500/10 border border-red-500/20">
            <AlertCircle className="size-4 text-red-400 flex-shrink-0" />
            <span className="text-xs text-red-400">{error}</span>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-bold text-[var(--text-ash)] uppercase tracking-wider mb-1.5 block">Current Password</label>
            <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="auth-input w-full" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-[var(--text-ash)] uppercase tracking-wider mb-1.5 block">New Password</label>
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="auth-input w-full" placeholder="At least 6 characters" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-[var(--text-ash)] uppercase tracking-wider mb-1.5 block">Confirm New Password</label>
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="auth-input w-full" />
          </div>
          <button onClick={handleChangePassword} disabled={saving} className="btn-ember w-full disabled:opacity-50">
            {saving ? "Changing Password..." : "Change Password"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Seller Dashboard (wrapped with Suspense) ──
export default function SellerDashboardPage() {
  return (
    <React.Suspense fallback={
      <div className="h-screen flex items-center justify-center bg-[var(--night-void)]">
        <div className="text-4xl animate-pulse">🏮</div>
      </div>
    }>
      <SellerDashboard />
    </React.Suspense>
  );
}

function SellerDashboard() {
  const [activeView, setActiveView] = useState("dashboard");
  const [seller, setSeller] = useState<SellerProfile | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const sellerData = JSON.parse(localStorage.getItem("kasuwa_seller") || "{}");
      if (!sellerData.accessToken) return;

      const res = await fetch("/api/seller/products", {
        headers: { Authorization: `Bearer ${sellerData.accessToken}` },
      });
      const data = await res.json();
      if (data.products) setProducts(data.products);
    } catch (err) {
      console.error("Failed to fetch products:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const sellerData = localStorage.getItem("kasuwa_seller");
    if (!sellerData) {
      router.push("/seller/login");
      return;
    }

    try {
      const parsed = JSON.parse(sellerData);
      setSeller(parsed.seller);
    } catch {
      router.push("/seller/login");
      return;
    }

    // Check for force password change or view parameter
    if (searchParams.get("force") === "true" || searchParams.get("view") === "settings") {
      setActiveView("settings");
    } else if (searchParams.get("view") === "products") {
      setActiveView("products");
    }

    fetchProducts();
  }, [fetchProducts, router, searchParams]);

  const handleLogout = () => {
    localStorage.removeItem("kasuwa_seller");
    router.push("/seller/login");
  };

  return (
    <div className="h-screen flex bg-[var(--night-void)] overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex">
        <Sidebar active={activeView} onNav={setActiveView} onLogout={handleLogout} seller={seller} />
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto custom-scrollbar p-6">
        {/* Mobile Nav */}
        <div className="md:hidden flex items-center gap-2 mb-4 overflow-x-auto pb-2">
          {["dashboard", "products", "settings"].map((v) => (
            <button
              key={v}
              onClick={() => setActiveView(v)}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
                activeView === v
                  ? "bg-[rgba(255,154,60,0.1)] text-[var(--ember-orange)] border border-[var(--border-ember)]"
                  : "text-[var(--text-ash)] bg-[var(--night-card)]"
              }`}
            >
              {v}
            </button>
          ))}
          <div className="flex-1" />
          <button onClick={handleLogout} className="px-3 py-2 rounded-xl text-xs font-bold text-red-400 bg-red-500/5">
            <LogOut className="size-3.5" />
          </button>
        </div>

        {activeView === "dashboard" && <DashboardView products={products} seller={seller} />}
        {activeView === "products" && <ProductsView products={products} loading={loading} onRefresh={fetchProducts} seller={seller} />}
        {activeView === "settings" && <SettingsView seller={seller} onLogout={handleLogout} />}
      </main>
    </div>
  );
}
