"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function SettingsRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const sellerData = localStorage.getItem("kasuwa_seller");
    if (!sellerData) {
      router.push("/seller/login");
      return;
    }
    // Redirect to dashboard with settings tab + force flag
    const force = searchParams.get("force");
    if (force === "true") {
      router.push("/seller/dashboard?force=true&view=settings");
    } else {
      router.push("/seller/dashboard?view=settings");
    }
  }, [router, searchParams]);

  return (
    <div className="night-market-bg min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="text-4xl animate-pulse mb-4">🏮</div>
        <p className="text-sm text-[var(--text-ash)]">Redirecting...</p>
      </div>
    </div>
  );
}

export default function SellerSettingsPage() {
  return (
    <Suspense fallback={
      <div className="night-market-bg min-h-screen flex items-center justify-center">
        <div className="text-4xl animate-pulse">🏮</div>
      </div>
    }>
      <SettingsRedirect />
    </Suspense>
  );
}
