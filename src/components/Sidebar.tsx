"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Settings,
  LogOut,
  Store,
} from "lucide-react";

interface SidebarProps {
  sellerName: string;
  shopName: string;
}

const navItems = [
  { href: "/seller/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/seller/products", label: "Products", icon: Package },
  { href: "/seller/settings", label: "Settings", icon: Settings },
];

export default function Sidebar({ sellerName, shopName }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    document.cookie =
      "seller_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    router.push("/seller/login");
  };

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-[#0A0E14] border-r border-[rgba(255,154,60,0.18)] flex flex-col z-50">
      {/* Logo */}
      <div className="p-6 border-b border-[rgba(255,154,60,0.12)]">
        <Link href="/seller/dashboard" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF9A3C] to-[#FFD166] flex items-center justify-center">
            <Store className="w-5 h-5 text-[#06080C]" />
          </div>
          <div>
            <h1 className="text-lg font-black text-[#FFE4A0] tracking-tight">
              KASUWA
            </h1>
            <p className="text-[10px] text-[#7A6E62] uppercase tracking-widest">
              Seller Portal
            </p>
          </div>
        </Link>
      </div>

      {/* Seller Info */}
      <div className="px-6 py-4 border-b border-[rgba(255,154,60,0.08)]">
        <p className="text-sm font-bold text-[#FFE4A0] truncate">
          {shopName || sellerName}
        </p>
        <p className="text-xs text-[#7A6E62] truncate">{sellerName}</p>
      </div>

      {/* Kente Stripe */}
      <div className="kente-stripe" />

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                isActive
                  ? "bg-[rgba(255,154,60,0.12)] text-[#FF9A3C] border border-[rgba(255,154,60,0.2)]"
                  : "text-[#B8A898] hover:bg-[rgba(255,154,60,0.06)] hover:text-[#FFB84D]"
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-[rgba(255,154,60,0.08)]">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-[#E04040] hover:bg-[rgba(224,64,64,0.08)] transition-all w-full"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
    </aside>
  );
}
