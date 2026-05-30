"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SellerProductsPage() {
  const router = useRouter();

  useEffect(() => {
    const sellerData = localStorage.getItem("kasuwa_seller");
    if (!sellerData) {
      router.push("/seller/login");
      return;
    }
    router.push("/seller/dashboard?view=products");
  }, [router]);

  return (
    <div className="night-market-bg min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="text-4xl animate-pulse mb-4">🏮</div>
        <p className="text-sm text-[var(--text-ash)]">Redirecting...</p>
      </div>
    </div>
  );
}
