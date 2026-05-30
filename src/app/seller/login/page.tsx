"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, Eye, EyeOff, Lock, Mail, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SellerLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/seller/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed");
        return;
      }

      // Store seller session
      localStorage.setItem("kasuwa_seller", JSON.stringify({
        seller: data.seller,
        accessToken: data.session?.access_token,
      }));

      // If using default password, force change
      if (data.seller.default_password_set) {
        router.push("/seller/settings?force=true");
      } else {
        router.push("/seller/dashboard");
      }
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="night-market-bg min-h-screen flex items-center justify-center px-4">
      <div className="lantern-glow lantern-glow-1" />
      <div className="lantern-glow lantern-glow-2" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🏮</div>
          <h1 className="text-2xl font-black text-[var(--text-lantern)] tracking-tight">KASUWA Seller</h1>
          <p className="text-xs text-[var(--text-ash)] mt-1 uppercase tracking-widest">Seller Portal</p>
          <div className="kente-stripe mt-4 mx-auto max-w-[120px]" />
        </div>

        {/* Login Card */}
        <div className="bg-[var(--night-surface)] border border-[var(--border-ember)] rounded-2xl p-6 backdrop-blur-xl">
          <div className="flex items-center gap-2 mb-6">
            <ShieldCheck className="size-5 text-[var(--ember-orange)]" />
            <h2 className="text-sm font-bold text-[var(--text-lantern)] uppercase tracking-wider">Seller Sign In</h2>
          </div>

          {error && (
            <div className="flex items-center gap-2 px-3 py-2.5 mb-4 rounded-lg bg-red-500/10 border border-red-500/20">
              <AlertCircle className="size-4 text-red-400 flex-shrink-0" />
              <span className="text-xs text-red-400">{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-[var(--text-ash)] uppercase tracking-wider mb-1.5 block">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[var(--text-ash)]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="auth-input w-full !pl-10"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-[var(--text-ash)] uppercase tracking-wider mb-1.5 block">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[var(--text-ash)]" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="auth-input w-full !pl-10 !pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-ash)] hover:text-[var(--ember-orange)] transition-colors"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-ember w-full"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        </div>

        <div className="text-center mt-6 space-y-2">
          <Link
            href="/seller/register"
            className="text-xs text-[var(--ember-orange)] hover:text-[var(--lantern-gold)] transition-colors"
          >
            Don&apos;t have an account? Register your shop
          </Link>
          <p className="text-[10px] text-[var(--text-shadow)]">
            KASUWA 2.0 Seller Portal — The Market That Listens
          </p>
        </div>
      </motion.div>
    </div>
  );
}
