"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Sidebar from "@/components/Sidebar";
import {
  Package,
  Eye,
  TrendingUp,
  Clock,
  AlertTriangle,
  Loader2,
} from "lucide-react";

interface SellerData {
  shopName: string;
  ownerName: string;
  isDisabled: boolean;
}

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  created_at: string;
  is_paused: boolean;
}

interface Stats {
  totalProducts: number;
  activeProducts: number;
  pausedProducts: number;
  categories: string[];
}

export default function SellerDashboardPage() {
  const router = useRouter();
  const [seller, setSeller] = useState<SellerData | null>(null);
  const [stats, setStats] = useState<Stats>({
    totalProducts: 0,
    activeProducts: 0,
    pausedProducts: 0,
    categories: [],
  });
  const [recentProducts, setRecentProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push("/seller/login");
        return;
      }

      // Get seller profile
      const { data: profile } = await supabase
        .from("seller_profiles")
        .select("shop_name, owner_name, is_disabled")
        .eq("id", session.user.id)
        .single();

      if (!profile) {
        router.push("/seller/login");
        return;
      }

      setSeller({
        shopName: profile.shop_name || "",
        ownerName: profile.owner_name || "",
        isDisabled: profile.is_disabled || false,
      });

      // Get products
      const { data: products } = await supabase
        .from("products")
        .select("id, name, price, category, created_at, is_paused")
        .eq("seller_id", session.user.id)
        .order("created_at", { ascending: false });

      if (products) {
        const active = products.filter((p) => !p.is_paused);
        const paused = products.filter((p) => p.is_paused);
        const cats = [...new Set(products.map((p) => p.category).filter(Boolean))];

        setStats({
          totalProducts: products.length,
          activeProducts: active.length,
          pausedProducts: paused.length,
          categories: cats,
        });
        setRecentProducts(products.slice(0, 5));
      }
    } catch (err) {
      console.error("Dashboard load error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="night-market-bg min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#FF9A3C] animate-spin" />
      </div>
    );
  }

  if (!seller) {
    router.push("/seller/login");
    return null;
  }

  return (
    <div className="night-market-bg min-h-screen">
      <Sidebar sellerName={seller.ownerName} shopName={seller.shopName} />

      {/* Main content */}
      <main className="ml-64 p-8">
        {/* Disabled Banner */}
        {seller.isDisabled && (
          <div className="flex items-center gap-3 p-4 bg-[rgba(224,64,64,0.1)] border border-[rgba(224,64,64,0.2)] rounded-xl mb-6">
            <AlertTriangle className="w-5 h-5 text-[#E04040] flex-shrink-0" />
            <p className="text-sm text-[#E04040]">
              Your account has been disabled. Contact support for assistance.
            </p>
          </div>
        )}

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-black text-[#FFE4A0]">
            Welcome back, {seller.ownerName?.split(" ")[0] || "Seller"}!
          </h1>
          <p className="text-[#7A6E62] mt-1">
            Here&apos;s what&apos;s happening with your shop today
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={Package}
            label="Total Products"
            value={stats.totalProducts}
            color="orange"
          />
          <StatCard
            icon={TrendingUp}
            label="Active Products"
            value={stats.activeProducts}
            color="green"
          />
          <StatCard
            icon={Clock}
            label="Paused Products"
            value={stats.pausedProducts}
            color="amber"
          />
          <StatCard
            icon={Eye}
            label="Categories"
            value={stats.categories.length}
            color="gold"
          />
        </div>

        {/* Categories */}
        {stats.categories.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-bold text-[#FFE4A0] mb-3">
              Your Categories
            </h2>
            <div className="flex flex-wrap gap-2">
              {stats.categories.map((cat) => (
                <span
                  key={cat}
                  className="px-3 py-1.5 bg-[rgba(255,154,60,0.08)] border border-[rgba(255,154,60,0.15)] rounded-lg text-xs font-semibold text-[#FFB84D]"
                >
                  {cat}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Recent Products */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-[#FFE4A0]">
              Recent Products
            </h2>
            <button
              onClick={() => router.push("/seller/products")}
              className="btn-ghost-night text-xs"
            >
              View All
            </button>
          </div>

          {recentProducts.length === 0 ? (
            <div className="bg-[rgba(20,26,34,0.75)] backdrop-blur-xl border border-[rgba(255,154,60,0.18)] rounded-2xl p-8 text-center">
              <Package className="w-12 h-12 text-[#7A6E62] mx-auto mb-3" />
              <p className="text-[#B8A898] font-semibold mb-2">
                No products yet
              </p>
              <p className="text-sm text-[#7A6E62] mb-4">
                Start adding products to your shop
              </p>
              <button
                onClick={() => router.push("/seller/products")}
                className="btn-ember"
              >
                Add Your First Product
              </button>
            </div>
          ) : (
            <div className="bg-[rgba(20,26,34,0.75)] backdrop-blur-xl border border-[rgba(255,154,60,0.18)] rounded-2xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[rgba(255,154,60,0.12)]">
                    <th className="text-left text-xs font-semibold text-[#7A6E62] uppercase tracking-wider px-6 py-3">
                      Product
                    </th>
                    <th className="text-left text-xs font-semibold text-[#7A6E62] uppercase tracking-wider px-6 py-3">
                      Category
                    </th>
                    <th className="text-right text-xs font-semibold text-[#7A6E62] uppercase tracking-wider px-6 py-3">
                      Price
                    </th>
                    <th className="text-center text-xs font-semibold text-[#7A6E62] uppercase tracking-wider px-6 py-3">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recentProducts.map((product) => (
                    <tr
                      key={product.id}
                      className="border-b border-[rgba(255,154,60,0.06)] hover:bg-[rgba(255,154,60,0.03)] transition-colors"
                    >
                      <td className="px-6 py-4">
                        <p className="text-sm font-semibold text-[#FFE4A0]">
                          {product.name}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs text-[#B8A898]">
                          {product.category || "Uncategorized"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm font-bold text-[#FF9A3C]">
                          ₦{product.price?.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {product.is_paused ? (
                          <span className="inline-flex px-2 py-1 text-[10px] font-bold uppercase bg-[rgba(255,184,77,0.1)] text-[#FFB84D] rounded-md">
                            Paused
                          </span>
                        ) : (
                          <span className="inline-flex px-2 py-1 text-[10px] font-bold uppercase bg-[rgba(45,143,78,0.1)] text-[#3DAF62] rounded-md">
                            Active
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  color: "orange" | "green" | "amber" | "gold";
}) {
  const colorMap = {
    orange: {
      bg: "rgba(255,154,60,0.08)",
      border: "rgba(255,154,60,0.2)",
      icon: "#FF9A3C",
      text: "#FF9A3C",
    },
    green: {
      bg: "rgba(45,143,78,0.08)",
      border: "rgba(45,143,78,0.2)",
      icon: "#3DAF62",
      text: "#3DAF62",
    },
    amber: {
      bg: "rgba(255,184,77,0.08)",
      border: "rgba(255,184,77,0.2)",
      icon: "#FFB84D",
      text: "#FFB84D",
    },
    gold: {
      bg: "rgba(255,209,102,0.08)",
      border: "rgba(255,209,102,0.2)",
      icon: "#FFD166",
      text: "#FFD166",
    },
  };

  const c = colorMap[color];

  return (
    <div
      className="p-5 rounded-2xl border backdrop-blur-xl"
      style={{
        background: c.bg,
        borderColor: c.border,
      }}
    >
      <div className="flex items-center gap-3 mb-3">
        <Icon className="w-5 h-5" style={{ color: c.icon }} />
        <span className="text-xs font-semibold text-[#7A6E62] uppercase tracking-wider">
          {label}
        </span>
      </div>
      <p className="text-3xl font-black" style={{ color: c.text }}>
        {value}
      </p>
    </div>
  );
}
