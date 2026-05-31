"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Sidebar from "@/components/Sidebar";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Upload,
  Loader2,
  Image as ImageIcon,
  Package,
  Search,
} from "lucide-react";
import { toast } from "sonner";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url: string | null;
  is_paused: boolean;
  created_at: string;
}

interface SellerInfo {
  shopName: string;
  ownerName: string;
}

const CATEGORIES = [
  "Electronics",
  "Fashion",
  "Home & Garden",
  "Food & Drinks",
  "Health & Beauty",
  "Sports",
  "Books",
  "Auto Parts",
  "Phones & Tablets",
  "Computers",
  "Clothing",
  "Shoes",
  "Bags",
  "Jewelry",
  "Art & Crafts",
  "Other",
];

export default function SellerProductsPage() {
  const router = useRouter();
  const [seller, setSeller] = useState<SellerInfo | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formCategory, setFormCategory] = useState("");
  const [formImage, setFormImage] = useState<File | null>(null);
  const [formImagePreview, setFormImagePreview] = useState<string | null>(null);

  const loadProducts = useCallback(async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.push("/seller/login");
        return;
      }

      // Get profile
      const { data: profile } = await supabase
        .from("seller_profiles")
        .select("shop_name, owner_name")
        .eq("id", session.user.id)
        .single();

      if (profile) {
        setSeller({ shopName: profile.shop_name, ownerName: profile.owner_name });
      }

      // Get products
      const { data: prods } = await supabase
        .from("products")
        .select("*")
        .eq("seller_id", session.user.id)
        .order("created_at", { ascending: false });

      if (prods) setProducts(prods);
    } catch (err) {
      console.error("Load products error:", err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const resetForm = () => {
    setFormName("");
    setFormDesc("");
    setFormPrice("");
    setFormCategory("");
    setFormImage(null);
    setFormImagePreview(null);
    setEditingProduct(null);
    setShowForm(false);
  };

  const openEditForm = (product: Product) => {
    setEditingProduct(product);
    setFormName(product.name);
    setFormDesc(product.description || "");
    setFormPrice(product.price.toString());
    setFormCategory(product.category || "");
    setFormImagePreview(product.image_url);
    setShowForm(true);
  };

  const openAddForm = () => {
    resetForm();
    setShowForm(true);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    setFormImage(file);
    const reader = new FileReader();
    reader.onload = (ev) => setFormImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const uploadImage = async (
    sellerId: string,
    file: File
  ): Promise<string | null> => {
    const ext = file.name.split(".").pop();
    const filename = `${sellerId}/${Date.now()}.${ext}`;

    const { error } = await supabase.storage
      .from("product-images")
      .upload(filename, file, { upsert: true });

    if (error) {
      console.error("Upload error:", error);
      return null;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("product-images").getPublicUrl(filename);

    return publicUrl;
  };

  const handleSave = async () => {
    if (!formName.trim() || !formPrice) {
      toast.error("Name and price are required");
      return;
    }

    setSaving(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.push("/seller/login");
        return;
      }

      let imageUrl = editingProduct?.image_url || null;

      // Upload new image if selected
      if (formImage) {
        setUploading(true);
        const url = await uploadImage(session.user.id, formImage);
        if (url) {
          imageUrl = url;
        } else {
          toast.error("Image upload failed. Product will be saved without image.");
        }
        setUploading(false);
      }

      const productData = {
        name: formName.trim(),
        description: formDesc.trim() || null,
        price: parseFloat(formPrice),
        category: formCategory || null,
        image_url: imageUrl,
        seller_id: session.user.id,
      };

      if (editingProduct) {
        // Update
        const { error } = await supabase
          .from("products")
          .update(productData)
          .eq("id", editingProduct.id);

        if (error) throw error;
        toast.success("Product updated successfully!");
      } else {
        // Create
        const { error } = await supabase.from("products").insert(productData);

        if (error) throw error;
        toast.success("Product added successfully!");
      }

      resetForm();
      loadProducts();
    } catch (err) {
      console.error("Save error:", err);
      toast.error("Failed to save product. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", productId);

      if (error) throw error;
      toast.success("Product deleted");
      loadProducts();
    } catch (err) {
      toast.error("Failed to delete product");
    }
  };

  const handleTogglePause = async (product: Product) => {
    try {
      const { error } = await supabase
        .from("products")
        .update({ is_paused: !product.is_paused })
        .eq("id", product.id);

      if (error) throw error;
      toast.success(product.is_paused ? "Product resumed" : "Product paused");
      loadProducts();
    } catch (err) {
      toast.error("Failed to update product status");
    }
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="night-market-bg min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#FF9A3C] animate-spin" />
      </div>
    );
  }

  return (
    <div className="night-market-bg min-h-screen">
      <Sidebar sellerName={seller?.ownerName || ""} shopName={seller?.shopName || ""} />

      <main className="ml-64 p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-[#FFE4A0]">Products</h1>
            <p className="text-[#7A6E62] text-sm mt-1">
              {products.length} product{products.length !== 1 ? "s" : ""} in your
              shop
            </p>
          </div>
          <button onClick={openAddForm} className="btn-ember">
            <Plus className="w-5 h-5" />
            Add Product
          </button>
        </div>

        {/* Search */}
        {products.length > 0 && (
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#7A6E62]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              className="auth-input pl-12"
            />
          </div>
        )}

        {/* Product Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#0F1317] border border-[rgba(255,154,60,0.18)] rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto custom-scrollbar">
              <div className="flex items-center justify-between p-6 border-b border-[rgba(255,154,60,0.12)]">
                <h2 className="text-lg font-bold text-[#FFE4A0]">
                  {editingProduct ? "Edit Product" : "Add New Product"}
                </h2>
                <button
                  onClick={resetForm}
                  className="text-[#7A6E62] hover:text-[#FFB84D] transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 space-y-5">
                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-semibold text-[#FFB84D] mb-2">
                    Product Image
                  </label>
                  <div
                    className="border-2 border-dashed border-[rgba(255,154,60,0.2)] rounded-xl p-6 text-center cursor-pointer hover:border-[rgba(255,154,60,0.4)] transition-colors"
                    onClick={() =>
                      document.getElementById("product-image-input")?.click()
                    }
                  >
                    {formImagePreview ? (
                      <div className="relative">
                        <img
                          src={formImagePreview}
                          alt="Preview"
                          className="max-h-48 mx-auto rounded-lg object-contain"
                        />
                        <p className="text-xs text-[#7A6E62] mt-2">
                          Click to change image
                        </p>
                      </div>
                    ) : (
                      <div className="py-4">
                        <Upload className="w-8 h-8 text-[#7A6E62] mx-auto mb-2" />
                        <p className="text-sm text-[#B8A898]">
                          Click to upload an image
                        </p>
                        <p className="text-xs text-[#7A6E62] mt-1">
                          Max 5MB, JPG/PNG/WebP
                        </p>
                      </div>
                    )}
                    <input
                      id="product-image-input"
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                  </div>
                </div>

                {/* Name */}
                <div>
                  <label className="block text-sm font-semibold text-[#FFB84D] mb-2">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="auth-input"
                    placeholder="e.g. Ankara Fabric Bundle"
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-semibold text-[#FFB84D] mb-2">
                    Description
                  </label>
                  <textarea
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                    className="auth-input min-h-[100px] resize-y"
                    placeholder="Describe your product..."
                  />
                </div>

                {/* Price */}
                <div>
                  <label className="block text-sm font-semibold text-[#FFB84D] mb-2">
                    Price (₦) *
                  </label>
                  <input
                    type="number"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    className="auth-input"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-semibold text-[#FFB84D] mb-2">
                    Category
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="auth-input"
                  >
                    <option value="">Select a category</option>
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Form Actions */}
              <div className="p-6 border-t border-[rgba(255,154,60,0.12)] flex gap-3">
                <button onClick={resetForm} className="btn-ghost-night flex-1">
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || !formName.trim() || !formPrice}
                  className="btn-ember flex-1"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {uploading ? "Uploading..." : "Saving..."}
                    </>
                  ) : editingProduct ? (
                    "Update Product"
                  ) : (
                    "Add Product"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Products Grid */}
        {filteredProducts.length === 0 && !loading ? (
          <div className="bg-[rgba(20,26,34,0.75)] backdrop-blur-xl border border-[rgba(255,154,60,0.18)] rounded-2xl p-12 text-center">
            <Package className="w-16 h-16 text-[#7A6E62] mx-auto mb-4" />
            <h3 className="text-xl font-bold text-[#FFE4A0] mb-2">
              {searchQuery ? "No products found" : "No products yet"}
            </h3>
            <p className="text-[#7A6E62] mb-6">
              {searchQuery
                ? "Try a different search term"
                : "Add your first product and start selling on KASUWA!"}
            </p>
            {!searchQuery && (
              <button onClick={openAddForm} className="btn-ember">
                <Plus className="w-5 h-5" />
                Add Your First Product
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className={`bg-[rgba(20,26,34,0.75)] backdrop-blur-xl border rounded-2xl overflow-hidden transition-all hover:border-[rgba(255,154,60,0.35)] ${
                  product.is_paused
                    ? "border-[rgba(255,184,77,0.2)] opacity-70"
                    : "border-[rgba(255,154,60,0.18)]"
                }`}
              >
                {/* Product Image */}
                <div className="h-48 bg-[#0A0E14] relative overflow-hidden">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="w-12 h-12 text-[#7A6E62]" />
                    </div>
                  )}
                  {product.is_paused && (
                    <div className="absolute inset-0 bg-[rgba(0,0,0,0.5)] flex items-center justify-center">
                      <span className="px-3 py-1 bg-[rgba(255,184,77,0.2)] text-[#FFB84D] text-xs font-bold uppercase rounded-lg">
                        Paused
                      </span>
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="text-sm font-bold text-[#FFE4A0] line-clamp-2">
                      {product.name}
                    </h3>
                  </div>
                  {product.category && (
                    <span className="inline-block text-[10px] font-semibold text-[#7A6E62] uppercase tracking-wider mb-2">
                      {product.category}
                    </span>
                  )}
                  <p className="text-lg font-black text-[#FF9A3C]">
                    ₦{product.price?.toLocaleString()}
                  </p>

                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-4 pt-3 border-t border-[rgba(255,154,60,0.08)]">
                    <button
                      onClick={() => openEditForm(product)}
                      className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#FFB84D] bg-[rgba(255,154,60,0.08)] hover:bg-[rgba(255,154,60,0.15)] rounded-lg transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleTogglePause(product)}
                      className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-colors ${
                        product.is_paused
                          ? "text-[#3DAF62] bg-[rgba(45,143,78,0.08)] hover:bg-[rgba(45,143,78,0.15)]"
                          : "text-[#FFB84D] bg-[rgba(255,184,77,0.08)] hover:bg-[rgba(255,184,77,0.15)]"
                      }`}
                    >
                      {product.is_paused ? "Resume" : "Pause"}
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#E04040] bg-[rgba(224,64,64,0.08)] hover:bg-[rgba(224,64,64,0.15)] rounded-lg transition-colors ml-auto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
