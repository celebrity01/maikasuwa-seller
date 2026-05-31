"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Sidebar from "@/components/Sidebar";
import {
  Lock,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";

interface SellerInfo {
  shopName: string;
  fullName: string;
  email: string;
  isDisabled: boolean;
  defaultPasswordSet: boolean;
}

export default function SellerSettingsPage() {
  const router = useRouter();
  const [seller, setSeller] = useState<SellerInfo | null>(null);
  const [loading, setLoading] = useState(true);

  // Password change form
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push("/seller/login");
        return;
      }

      const { data: profile } = await supabase
        .from("seller_profiles")
        .select("shop_name, full_name, is_disabled, default_password_set")
        .eq("id", session.user.id)
        .single();

      if (profile) {
        setSeller({
          shopName: profile.shop_name || "",
          fullName: profile.full_name || "",
          email: session.user.email || "",
          isDisabled: profile.is_disabled || false,
          defaultPasswordSet: profile.default_password_set || false,
        });
      }
    } catch (err) {
      console.error("Load profile error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword || newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setChangingPassword(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      // Update default_password_set flag
      await supabase
        .from("seller_profiles")
        .update({ default_password_set: false })
        .eq("id", (await supabase.auth.getUser()).data.user?.id);

      toast.success("Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      // Reload profile to update the flag
      loadProfile();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to change password";
      toast.error(message);
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="night-market-bg min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#FF9A3C] animate-spin" />
      </div>
    );
  }

  return (
    <div className="night-market-bg min-h-screen">
      <Sidebar
        sellerName={seller?.fullName || ""}
        shopName={seller?.shopName || ""}
      />

      <main className="ml-64 p-8">
        <h1 className="text-2xl font-black text-[#FFE4A0] mb-6">Settings</h1>

        {/* Default Password Warning */}
        {seller?.defaultPasswordSet && (
          <div className="flex items-start gap-3 p-5 bg-[rgba(255,184,77,0.1)] border border-[rgba(255,184,77,0.2)] rounded-xl mb-6">
            <AlertTriangle className="w-6 h-6 text-[#FFB84D] flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-[#FFB84D]">
                Change Your Default Password
              </p>
              <p className="text-sm text-[#B8A898] mt-1">
                You are using the default password assigned by the admin. Please
                change it to secure your account.
              </p>
            </div>
          </div>
        )}

        {/* Account Info */}
        <div className="bg-[rgba(20,26,34,0.75)] backdrop-blur-xl border border-[rgba(255,154,60,0.18)] rounded-2xl p-6 mb-6">
          <h2 className="text-lg font-bold text-[#FFE4A0] mb-4">
            Account Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#7A6E62] uppercase tracking-wider mb-1">
                Shop Name
              </label>
              <p className="text-sm text-[#FFE4A0] font-semibold">
                {seller?.shopName || "Not set"}
              </p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#7A6E62] uppercase tracking-wider mb-1">
                Owner Name
              </label>
              <p className="text-sm text-[#FFE4A0] font-semibold">
                {seller?.fullName || "Not set"}
              </p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#7A6E62] uppercase tracking-wider mb-1">
                Email
              </label>
              <p className="text-sm text-[#FFB84D]">{seller?.email || ""}</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#7A6E62] uppercase tracking-wider mb-1">
                Account Status
              </label>
              {seller?.isDisabled ? (
                <span className="inline-flex items-center gap-1.5 text-sm text-[#E04040] font-semibold">
                  <AlertTriangle className="w-4 h-4" />
                  Disabled
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-sm text-[#3DAF62] font-semibold">
                  <CheckCircle className="w-4 h-4" />
                  Active
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Change Password */}
        <div className="bg-[rgba(20,26,34,0.75)] backdrop-blur-xl border border-[rgba(255,154,60,0.18)] rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <Lock className="w-5 h-5 text-[#FF9A3C]" />
            <h2 className="text-lg font-bold text-[#FFE4A0]">Change Password</h2>
          </div>

          <div className="space-y-5 max-w-md">
            <div>
              <label className="block text-sm font-semibold text-[#FFB84D] mb-2">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showNew ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="auth-input pr-12"
                  placeholder="Minimum 8 characters"
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#7A6E62] hover:text-[#FFB84D] transition-colors"
                >
                  {showNew ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#FFB84D] mb-2">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="auth-input"
                placeholder="Re-enter your new password"
              />
            </div>

            {newPassword && confirmPassword && newPassword !== confirmPassword && (
              <p className="text-sm text-[#E04040]">Passwords do not match</p>
            )}

            <button
              onClick={handleChangePassword}
              disabled={
                changingPassword ||
                !newPassword ||
                !confirmPassword ||
                newPassword !== confirmPassword ||
                newPassword.length < 8
              }
              className="btn-ember"
            >
              {changingPassword ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Changing...
                </>
              ) : (
                "Change Password"
              )}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
