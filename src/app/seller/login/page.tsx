"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Store, Eye, EyeOff, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function SellerLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // 1. Authenticate with Supabase Auth
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });

      if (authError) {
        setError("Invalid email or password. Please try again.");
        return;
      }

      if (!authData.user) {
        setError("Authentication failed. Please try again.");
        return;
      }

      // 2. Check seller profile status
      const { data: profile, error: profileError } = await supabase
        .from("seller_profiles")
        .select("id, shop_name, owner_name, is_disabled, status")
        .eq("id", authData.user.id)
        .single();

      if (profileError || !profile) {
        setError("Seller profile not found. Please contact support.");
        await supabase.auth.signOut();
        return;
      }

      // 3. Check if account is disabled
      if (profile.is_disabled) {
        setError(
          "Your account has been disabled. Please contact KASUWA support for assistance."
        );
        await supabase.auth.signOut();
        return;
      }

      // 4. Check if approved
      if (profile.status !== "approved") {
        setError(
          "Your account is pending approval. You will receive an email once approved."
        );
        await supabase.auth.signOut();
        return;
      }

      // 5. Success — store session info and redirect
      document.cookie = `seller_session=${authData.session?.access_token}; path=/; max-age=86400; SameSite=Lax`;
      document.cookie = `seller_shop=${encodeURIComponent(
        profile.shop_name || ""
      )}; path=/; max-age=86400; SameSite=Lax`;
      document.cookie = `seller_name=${encodeURIComponent(
        profile.owner_name || ""
      )}; path=/; max-age=86400; SameSite=Lax`;

      toast.success("Welcome back to KASUWA!");
      router.push("/seller/dashboard");
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="night-market-bg min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ember particles */}
      <div className="ember-particle ember-particle-1" />
      <div className="ember-particle ember-particle-2" />
      <div className="ember-particle ember-particle-3" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FF9A3C] to-[#FFD166] mb-4">
            <Store className="w-8 h-8 text-[#06080C]" />
          </div>
          <h1 className="text-3xl font-black text-[#FFE4A0] tracking-tight">
            KASUWA
          </h1>
          <p className="text-sm text-[#7A6E62] uppercase tracking-[0.2em] mt-1">
            Seller Portal
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-[rgba(20,26,34,0.75)] backdrop-blur-xl border border-[rgba(255,154,60,0.18)] rounded-2xl p-8">
          <div className="kente-stripe mb-6 rounded-full" />

          <h2 className="text-xl font-bold text-[#FFE4A0] mb-1">
            Sign In to Your Shop
          </h2>
          <p className="text-sm text-[#7A6E62] mb-6">
            Enter your credentials to manage your products
          </p>

          {error && (
            <div className="flex items-start gap-3 p-4 bg-[rgba(224,64,64,0.1)] border border-[rgba(224,64,64,0.2)] rounded-xl mb-6">
              <AlertCircle className="w-5 h-5 text-[#E04040] flex-shrink-0 mt-0.5" />
              <p className="text-sm text-[#E04040]">{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-[#FFB84D] mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="auth-input"
                placeholder="your@email.com"
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#FFB84D] mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="auth-input pr-12"
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#7A6E62] hover:text-[#FFB84D] transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !email || !password}
              className="btn-ember w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <div className="kente-stripe mt-6 rounded-full" />

          <p className="text-center text-xs text-[#7A6E62] mt-4">
            Forgot your password? Contact{" "}
            <a
              href="mailto:support@kasuwa.ng"
              className="text-[#FF9A3C] hover:underline"
            >
              support@kasuwa.ng
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
