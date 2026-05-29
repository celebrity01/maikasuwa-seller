"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  Phone,
  User,
  Mail,
  MapPin,
  Store,
  Home,
  Lock,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Camera,
  Image as ImageIcon,
} from "lucide-react";
import Link from "next/link";

// ── Step Configuration ──

const STEPS = [
  { id: 1, title: "Personal Info", icon: User },
  { id: 2, title: "Contact & Address", icon: MapPin },
  { id: 3, title: "Shop Details", icon: Store },
  { id: 4, title: "Photo & Security", icon: Lock },
];

// ── Main Component ──

export default function SellerRegisterPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [physicalAddress, setPhysicalAddress] = useState("");
  const [shopAddress, setShopAddress] = useState("");
  const [homeAsBusiness, setHomeAsBusiness] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Photo Upload Handler ──
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("Photo must be less than 5MB");
        return;
      }
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setError(null);
    }
  };

  // ── Step Validation ──
  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (!fullName.trim()) {
          setError("Full name is required");
          return false;
        }
        if (!email.trim() || !email.includes("@")) {
          setError("Valid email address is required");
          return false;
        }
        return true;
      case 2:
        if (!phone.trim() || phone.trim().length < 10) {
          setError("Valid phone number is required (at least 10 digits)");
          return false;
        }
        if (!physicalAddress.trim()) {
          setError("Physical address is required");
          return false;
        }
        return true;
      case 3:
        if (!homeAsBusiness && !shopAddress.trim()) {
          setError("Shop address is required, or select 'I use my home as my business address'");
          return false;
        }
        return true;
      case 4:
        if (!password || password.length < 6) {
          setError("Password must be at least 6 characters");
          return false;
        }
        if (password !== confirmPassword) {
          setError("Passwords do not match");
          return false;
        }
        if (!photoFile) {
          setError("Profile photo is required for verification");
          return false;
        }
        return true;
      default:
        return false;
    }
  };

  // ── Navigation ──
  const goNext = () => {
    setError(null);
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 4));
    }
  };

  const goBack = () => {
    setError(null);
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  // ── Submit Handler ──
  const handleSubmit = async () => {
    setError(null);
    if (!validateStep(4)) return;

    setIsSubmitting(true);

    try {
      // Convert photo to base64 for upload
      let avatarBase64 = "";
      if (photoFile) {
        avatarBase64 = photoPreview || "";
      }

      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password,
          name: fullName.trim(),
          role: "seller",
          phone: phone.trim(),
          physicalAddress: physicalAddress.trim(),
          shopAddress: homeAsBusiness ? physicalAddress.trim() : shopAddress.trim(),
          homeAsBusiness,
          avatarBase64: avatarBase64,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed. Please try again.");
        return;
      }

      setIsSuccess(true);
    } catch {
      setError("Connection failed. The lanterns flickered out. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Success Screen ──
  if (isSuccess) {
    return (
      <div className="night-market-bg min-h-screen flex flex-col items-center justify-center px-6">
        <div className="lantern-glow lantern-glow-1" />
        <div className="lantern-glow lantern-glow-2" />

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, type: "spring" }}
          className="text-center max-w-md"
        >
          <div className="w-20 h-20 rounded-full bg-[rgba(45,143,78,0.15)] border border-[rgba(45,143,78,0.3)] flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="size-10 text-[var(--kente-green-bright)]" />
          </div>
          <h1 className="text-2xl font-black text-[var(--text-lantern)] mb-3">
            Welcome to the Market, {fullName.split(" ")[0]}!
          </h1>
          <p className="text-sm text-[var(--text-smoke)] leading-relaxed mb-2">
            Your seller registration has been submitted successfully. Our team will review your
            KYB information and verify your identity.
          </p>
          <p className="text-xs text-[var(--text-ash)] mb-8">
            You will receive a confirmation email at <strong className="text-[var(--text-ember)]">{email}</strong> once your account is approved.
          </p>
          <Link
            href="/"
            className="btn-ember inline-flex items-center gap-2"
          >
            <ArrowLeft className="size-4" />
            Return to the Market
          </Link>
        </motion.div>
      </div>
    );
  }

  // ── Progress Bar ──
  const progressPercent = (currentStep / STEPS.length) * 100;

  return (
    <div className="night-market-bg min-h-screen flex flex-col">
      {/* Ambient elements */}
      <div className="lantern-glow lantern-glow-1" />
      <div className="lantern-glow lantern-glow-2" />

      {/* ── Header ── */}
      <header className="relative z-10 px-4 py-4 flex items-center gap-3 border-b border-[var(--border-ember)] bg-[rgba(6,8,12,0.8)] backdrop-blur-xl">
        <Link
          href="/"
          className="w-10 h-10 rounded-full bg-[var(--night-card)] flex items-center justify-center hover:bg-[var(--night-card-hover)] transition-colors border border-[var(--border-ember)]"
        >
          <ArrowLeft className="size-4 text-[var(--text-ash)]" />
        </Link>
        <div>
          <h1 className="text-sm font-black text-[var(--text-lantern)] tracking-tight">
            Seller Registration
          </h1>
          <p className="text-[10px] text-[var(--text-ash)] uppercase tracking-widest">
            Know Your Business (KYB)
          </p>
        </div>
      </header>

      {/* ── Progress ── */}
      <div className="relative z-10 px-4 pt-4">
        {/* Step indicators */}
        <div className="flex items-center justify-between mb-2">
          {STEPS.map((step) => (
            <div key={step.id} className="flex items-center gap-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                  currentStep >= step.id
                    ? "bg-gradient-to-br from-[var(--ember-orange)] to-[var(--lantern-gold)] text-[var(--night-void)]"
                    : "bg-[var(--night-card)] text-[var(--text-ash)] border border-[var(--border-ember)]"
                }`}
              >
                {currentStep > step.id ? (
                  <CheckCircle2 className="size-4" />
                ) : (
                  step.id
                )}
              </div>
              <span
                className={`hidden sm:inline text-[10px] font-bold uppercase tracking-wider transition-colors ${
                  currentStep >= step.id
                    ? "text-[var(--text-ember)]"
                    : "text-[var(--text-ash)]"
                }`}
              >
                {step.title}
              </span>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div className="w-full h-1.5 bg-[var(--night-card)] rounded-full overflow-hidden mb-6">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-[var(--ember-orange)] to-[var(--lantern-gold)]"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* ── Form Content ── */}
      <main className="flex-1 overflow-y-auto custom-scrollbar px-4 pb-6 relative z-10">
        <AnimatePresence mode="wait">
          {/* Step 1: Personal Info */}
          {currentStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-5"
            >
              <div>
                <h2 className="text-lg font-black text-[var(--text-lantern)] mb-1">
                  Personal Information
                </h2>
                <p className="text-xs text-[var(--text-ash)]">
                  Tell us about yourself. This information is used for verification purposes.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="flex items-center gap-2 text-xs font-bold text-[var(--text-ash)] uppercase tracking-wider mb-2">
                    <User className="size-3.5" />
                    Full Name <span className="text-[var(--fire-red)]">*</span>
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your full name"
                    className="auth-input w-full"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-xs font-bold text-[var(--text-ash)] uppercase tracking-wider mb-2">
                    <Mail className="size-3.5" />
                    Email Address <span className="text-[var(--fire-red)]">*</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="auth-input w-full"
                  />
                  <p className="text-[10px] text-[var(--text-shadow)] mt-1.5">
                    This will be used for account verification and communication.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 2: Contact & Address */}
          {currentStep === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-5"
            >
              <div>
                <h2 className="text-lg font-black text-[var(--text-lantern)] mb-1">
                  Contact & Address
                </h2>
                <p className="text-xs text-[var(--text-ash)]">
                  How can we reach you? Where are you located?
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="flex items-center gap-2 text-xs font-bold text-[var(--text-ash)] uppercase tracking-wider mb-2">
                    <Phone className="size-3.5" />
                    Phone Number <span className="text-[var(--fire-red)]">*</span>
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 08012345678"
                    className="auth-input w-full"
                  />
                  <p className="text-[10px] text-[var(--text-shadow)] mt-1.5">
                    Nigerian phone number. Buyers will see this to contact you.
                  </p>
                </div>

                <div>
                  <label className="flex items-center gap-2 text-xs font-bold text-[var(--text-ash)] uppercase tracking-wider mb-2">
                    <MapPin className="size-3.5" />
                    Physical Address <span className="text-[var(--fire-red)]">*</span>
                  </label>
                  <textarea
                    value={physicalAddress}
                    onChange={(e) => setPhysicalAddress(e.target.value)}
                    placeholder="Street, Area, City, State"
                    rows={3}
                    className="auth-input w-full resize-none"
                  />
                  <p className="text-[10px] text-[var(--text-shadow)] mt-1.5">
                    Your home or residential address for verification.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 3: Shop Details */}
          {currentStep === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-5"
            >
              <div>
                <h2 className="text-lg font-black text-[var(--text-lantern)] mb-1">
                  Shop Details
                </h2>
                <p className="text-xs text-[var(--text-ash)]">
                  Where do you run your business from?
                </p>
              </div>

              <div className="space-y-4">
                {/* Home as Business Toggle */}
                <button
                  type="button"
                  onClick={() => {
                    setHomeAsBusiness(!homeAsBusiness);
                    if (!homeAsBusiness) {
                      setShopAddress("");
                    }
                  }}
                  className={`w-full p-4 rounded-xl border text-left transition-all duration-200 ${
                    homeAsBusiness
                      ? "bg-[rgba(45,143,78,0.1)] border-[rgba(45,143,78,0.3)]"
                      : "bg-[var(--night-card)] border-[var(--border-ember)] hover:bg-[var(--night-card-hover)]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                        homeAsBusiness
                          ? "bg-[var(--kente-green-bright)] border-[var(--kente-green-bright)]"
                          : "border-[var(--text-ash)]"
                      }`}
                    >
                      {homeAsBusiness && (
                        <CheckCircle2 className="size-3.5 text-[var(--night-void)]" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <Home className="size-4 text-[var(--text-ember)]" />
                        <span className="text-sm font-bold text-[var(--text-lantern)]">
                          I use my home as my business address
                        </span>
                      </div>
                      <p className="text-[10px] text-[var(--text-ash)] mt-1 ml-6">
                        Your physical address will be used as your shop address
                      </p>
                    </div>
                  </div>
                </button>

                {/* Shop Address */}
                {!homeAsBusiness && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <label className="flex items-center gap-2 text-xs font-bold text-[var(--text-ash)] uppercase tracking-wider mb-2">
                      <Store className="size-3.5" />
                      Shop Address <span className="text-[var(--fire-red)]">*</span>
                    </label>
                    <textarea
                      value={shopAddress}
                      onChange={(e) => setShopAddress(e.target.value)}
                      placeholder="Shop name, Street, Market, City, State"
                      rows={3}
                      className="auth-input w-full resize-none"
                    />
                    <p className="text-[10px] text-[var(--text-shadow)] mt-1.5">
                      The address where your business is physically located.
                    </p>
                  </motion.div>
                )}

                {homeAsBusiness && (
                  <div className="p-4 rounded-xl bg-[rgba(45,143,78,0.06)] border border-[rgba(45,143,78,0.15)]">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="size-4 text-[var(--kente-green-bright)]" />
                      <span className="text-xs font-bold text-[var(--kente-green-bright)]">
                        Home Address Selected
                      </span>
                    </div>
                    <p className="text-xs text-[var(--text-smoke)]">
                      Your physical address will be used as your business address:
                    </p>
                    <p className="text-xs text-[var(--text-ember)] font-medium mt-1">
                      {physicalAddress || "No address provided yet"}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Step 4: Photo & Security */}
          {currentStep === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-5"
            >
              <div>
                <h2 className="text-lg font-black text-[var(--text-lantern)] mb-1">
                  Photo & Security
                </h2>
                <p className="text-xs text-[var(--text-ash)]">
                  Upload a photo for verification and secure your account.
                </p>
              </div>

              <div className="space-y-4">
                {/* Photo Upload */}
                <div>
                  <label className="flex items-center gap-2 text-xs font-bold text-[var(--text-ash)] uppercase tracking-wider mb-2">
                    <Camera className="size-3.5" />
                    Profile Photo <span className="text-[var(--fire-red)]">*</span>
                  </label>

                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="relative cursor-pointer group"
                  >
                    {photoPreview ? (
                      <div className="relative w-32 h-32 mx-auto">
                        <div className="w-32 h-32 rounded-2xl overflow-hidden border-2 border-[var(--ember-orange)] shadow-lg shadow-[rgba(255,154,60,0.15)]">
                          <img
                            src={photoPreview}
                            alt="Profile preview"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="absolute inset-0 rounded-2xl bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Camera className="size-6 text-white" />
                        </div>
                      </div>
                    ) : (
                      <div className="w-full py-10 rounded-xl border-2 border-dashed border-[var(--border-ember)] bg-[rgba(255,154,60,0.03)] hover:bg-[rgba(255,154,60,0.06)] transition-all flex flex-col items-center gap-3">
                        <div className="w-14 h-14 rounded-full bg-[var(--night-card)] flex items-center justify-center">
                          <ImageIcon className="size-6 text-[var(--text-ash)]" />
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-bold text-[var(--text-smoke)]">
                            Click to upload photo
                          </p>
                          <p className="text-[10px] text-[var(--text-ash)] mt-1">
                            PNG, JPG up to 5MB
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                  <p className="text-[10px] text-[var(--text-shadow)] mt-2 text-center">
                    A clear photo of yourself for identity verification.
                  </p>
                </div>

                {/* Password */}
                <div>
                  <label className="flex items-center gap-2 text-xs font-bold text-[var(--text-ash)] uppercase tracking-wider mb-2">
                    <Lock className="size-3.5" />
                    Password <span className="text-[var(--fire-red)]">*</span>
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="auth-input w-full"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-xs font-bold text-[var(--text-ash)] uppercase tracking-wider mb-2">
                    <Lock className="size-3.5" />
                    Confirm Password <span className="text-[var(--fire-red)]">*</span>
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your password"
                    className="auth-input w-full"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error Display */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-4 flex items-center gap-2 text-sm text-[var(--fire-red)] py-3 bg-[rgba(232,93,44,0.08)] rounded-xl px-4"
            >
              <AlertCircle className="size-4 flex-shrink-0" />
              {error}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* ── Bottom Navigation ── */}
      <div className="relative z-10 px-4 py-4 pb-[max(16px,env(safe-area-inset-bottom))] border-t border-[var(--border-ember)] bg-[rgba(6,8,12,0.9)] backdrop-blur-xl">
        <div className="flex gap-3">
          {currentStep > 1 && (
            <button
              onClick={goBack}
              className="btn-ghost-night flex-1"
            >
              <ArrowLeft className="size-4" />
              Back
            </button>
          )}

          {currentStep < 4 ? (
            <button
              onClick={goNext}
              className="btn-ember flex-1"
            >
              Continue
              <ChevronRightIcon />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="btn-ember flex-1 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="size-4 border-2 border-[var(--night-void)] border-t-transparent rounded-full animate-spin" />
                  Submitting Registration...
                </>
              ) : (
                <>
                  <Upload className="size-4" />
                  Submit Registration
                </>
              )}
            </button>
          )}
        </div>

        {/* Step counter */}
        <p className="text-center text-[10px] text-[var(--text-shadow)] mt-3 uppercase tracking-widest">
          Step {currentStep} of {STEPS.length}
        </p>
      </div>
    </div>
  );
}

// ── Chevron Icon ──
function ChevronRightIcon() {
  return (
    <svg
      className="size-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2.5}
        d="M9 5l7 7-7 7"
      />
    </svg>
  );
}
