"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SellerPortalHome() {
  const router = useRouter();

  useEffect(() => {
    // Check if seller is already logged in
    const sellerData = localStorage.getItem("kasuwa_seller");
    if (sellerData) {
      try {
        const parsed = JSON.parse(sellerData);
        if (parsed.accessToken && parsed.seller) {
          router.push("/seller/dashboard");
          return;
        }
      } catch {
        // Invalid data, go to login
      }
    }
    router.push("/seller/login");
  }, [router]);

  return (
    <div className="night-market-bg min-h-screen flex items-center justify-center">
      <div className="lantern-glow lantern-glow-1" />
      <div className="lantern-glow lantern-glow-2" />
      <div className="text-center">
        <div className="text-5xl animate-pulse mb-4">🏮</div>
        <h1 className="text-xl font-black text-[var(--text-lantern)]">KASUWA Seller Portal</h1>
        <p className="text-sm text-[var(--text-ash)] mt-2">Redirecting...</p>
      </div>
    </div>
  );
}
