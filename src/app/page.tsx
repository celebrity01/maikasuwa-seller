"use client";

import React, { useState, useRef, useEffect, useCallback, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  X,
  Eye,
  MessageCircle,
  Store,
  ArrowRight,
  Search,
  ChevronLeft,
  CheckCheck,
  Wifi,
  Battery,
  Signal,
  MapPin,
  Phone,
  Clock,
  Star,
  ShieldCheck,
  Share2,
  Heart,
  ChevronRight,
  Navigation,
  Copy,
  ExternalLink,
  Users,
  Tag,
  Sparkles,
  CheckCircle2,
  MailCheck,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  formatPrice,
  PRODUCTS,
  CATEGORY_LABELS,
  CATEGORY_ICONS,
  CATEGORY_COLORS,
  CATEGORY_DESCRIPTIONS,
  getProductsByCategory,
  getSellerById,
  type Product,
  type Seller,
} from "@/lib/marketplace-data";

// ── Types ──

interface ProductCardData {
  id: string;
  name: string;
  category: string;
  categoryLabel: string;
  categoryIcon: string;
  subcategory: string;
  price: number;
  priceFormatted: string;
  condition: string;
  state: string;
  seller: string;
  sellerId: string;
  image: string;
  description: string;
  specs: Record<string, string>;
  negotiable: boolean;
  haggleMin: number;
  haggleMinFormatted: string;
  communityDeal: {
    minBuyers: number;
    discountPercent: number;
    currentBuyers: number;
    discountedPrice: number;
    discountedPriceFormatted: string;
  } | null;
  postedAt: string;
  views: number;
}

interface ChatMessage {
  id: string;
  role: "mai" | "user" | "system";
  content: string;
  products?: ProductCardData[];
  actions?: string[];
  timestamp: number;
}

interface CategoryChat {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
  lastMessage: string;
  lastTime: string;
  unread: number;
  online: boolean;
  messages: ChatMessage[];
  productCount: number;
}

// ── Time helpers ──

function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "Barka da safiya!";
  if (hour >= 12 && hour < 16) return "Barka da rana!";
  if (hour >= 16 && hour < 20) return "Barka da yamma!";
  return "Barka da dare!";
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit", hour12: true });
}

// ── Build category chats from product data ──

function buildCategoryChats(): CategoryChat[] {
  const categories = Object.keys(CATEGORY_LABELS);
  const greetings = [
    "Fresh stock just arrived! Come check it out",
    "Best deals in the market today",
    "Quality goods, fair prices! Step right in",
    "New items available! Ask me anything",
    "The stall is open! What are you looking for?",
    "Trusted sellers, great prices",
    "Reliable services, honest workers",
    "Fresh from the farm! Quality produce",
    "New positions listed daily",
    "Delicious food, fresh drinks!",
    "Everything for the little ones",
    "Gear up for the game!",
  ];
  const times = ["2m", "5m", "12m", "28m", "45m", "1h", "2h", "3h", "5h", "8h", "12h", "Yesterday"];

  return categories.map((catId, i) => {
    const products = getProductsByCategory(catId);
    return {
      id: catId,
      name: CATEGORY_LABELS[catId],
      icon: CATEGORY_ICONS[catId],
      color: CATEGORY_COLORS[catId] || "#FF9A3C",
      description: CATEGORY_DESCRIPTIONS[catId] || "",
      lastMessage: greetings[i % greetings.length],
      lastTime: times[i % times.length],
      unread: i < 3 ? Math.floor(Math.random() * 3) + 1 : 0,
      online: i < 6,
      messages: [],
      productCount: products.length,
    };
  });
}

// ── Product detail to card data ──

function productToCardData(p: Product): ProductCardData {
  return {
    id: p.id,
    name: p.name,
    category: p.category,
    categoryLabel: CATEGORY_LABELS[p.category] || p.category,
    categoryIcon: CATEGORY_ICONS[p.category] || "🏪",
    subcategory: p.subcategory,
    price: p.price,
    priceFormatted: formatPrice(p.price),
    condition: p.condition,
    state: p.state,
    seller: p.seller,
    sellerId: p.sellerId,
    image: p.image,
    description: p.description,
    specs: p.specs,
    negotiable: p.negotiable,
    haggleMin: p.haggleRange.min,
    haggleMinFormatted: formatPrice(p.haggleRange.min),
    communityDeal: p.communityDeal
      ? {
          minBuyers: p.communityDeal.minBuyers,
          discountPercent: p.communityDeal.discountPercent,
          currentBuyers: p.communityDeal.currentBuyers,
          discountedPrice: Math.round(p.price * (1 - p.communityDeal.discountPercent / 100)),
          discountedPriceFormatted: formatPrice(Math.round(p.price * (1 - p.communityDeal.discountPercent / 100))),
        }
      : null,
    postedAt: p.postedAt || "",
    views: p.views || 0,
  };
}

// ── Product Card Component ──

function ProductGlowCard({
  product,
  onViewDetails,
}: {
  product: ProductCardData;
  onViewDetails: () => void;
}) {
  return (
    <motion.button
      onClick={onViewDetails}
      className="product-glow-card p-3 w-full text-left cursor-pointer"
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2.5">
          <div className="text-2xl">{product.image}</div>
          <div>
            <h3 className="font-bold text-[var(--text-lantern)] text-xs leading-tight">
              {product.name}
            </h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span
                className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md"
                style={{
                  background: "rgba(255,154,60,0.15)",
                  color: "var(--ember-orange)",
                }}
              >
                {product.categoryIcon} {product.categoryLabel}
              </span>
              <span className="text-[10px] text-[var(--text-ash)]">{product.condition}</span>
            </div>
          </div>
        </div>
        <ChevronRight className="size-4 text-[var(--text-ash)] flex-shrink-0 mt-1" />
      </div>

      <div className="mb-2">
        <div className="text-lg font-black text-[var(--ember-orange)]">{product.priceFormatted}</div>
        {product.negotiable && (
          <div className="text-[10px] text-[var(--text-ash)]">From {product.haggleMinFormatted}</div>
        )}
      </div>

      {product.communityDeal && (
        <div className="circle-bubble p-2 mb-2">
          <div className="flex items-center gap-1.5">
            <Users className="size-3 text-[var(--kente-green-bright)]" />
            <span className="text-[10px] font-bold text-[var(--kente-green-bright)]">
              {product.communityDeal.discountPercent}% OFF with {product.communityDeal.currentBuyers}/{product.communityDeal.minBuyers} buyers
            </span>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between text-[10px] text-[var(--text-ash)]">
        <span className="flex items-center gap-1"><MapPin className="size-2.5" />{product.state}</span>
        <span className="flex items-center gap-1"><Eye className="size-2.5" />{product.views} views</span>
        <span>{product.postedAt}</span>
      </div>

      <div className="kente-stripe mt-2" />

      <div className="flex items-center justify-center gap-1.5 mt-2">
        <span className="text-[10px] font-bold text-[var(--ember-orange)]">Tap to view details</span>
        <ChevronRight className="size-3 text-[var(--ember-orange)]" />
      </div>
    </motion.button>
  );
}

// ── Product Detail View ──

function ProductDetailPanel({
  product,
  onClose,
}: {
  product: ProductCardData;
  onClose: () => void;
}) {
  const [showCopied, setShowCopied] = useState(false);
  const [liked, setLiked] = useState(false);
  const seller = getSellerById(product.sellerId);

  const copyToClipboard = (text: string) => {
    navigator.clipboard?.writeText(text);
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 2000);
  };

  const shopTypeLabels: Record<string, string> = {
    market_stall: "Market Stall",
    shop: "Physical Shop",
    warehouse: "Warehouse / Showroom",
    home_business: "Home Business",
    office: "Office",
    online: "Online Only",
  };

  return (
    <motion.div
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", damping: 28, stiffness: 220 }}
      className="fixed inset-0 z-[300] flex flex-col bg-[var(--night-void)]"
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border-ember)] bg-[rgba(6,8,12,0.95)] backdrop-blur-xl">
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-full bg-[var(--night-card)] flex items-center justify-center border border-[var(--border-ember)]"
        >
          <ChevronLeft className="size-4 text-[var(--text-ash)]" />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-bold text-[var(--text-lantern)] truncate">Product Details</h2>
          <p className="text-[10px] text-[var(--text-ash)]">{product.categoryIcon} {product.categoryLabel}</p>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setLiked(!liked)}
            className="w-9 h-9 rounded-full bg-[var(--night-card)] flex items-center justify-center border border-[var(--border-ember)]"
          >
            <Heart className={`size-4 ${liked ? "text-red-500 fill-red-500" : "text-[var(--text-ash)]"}`} />
          </button>
          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({ title: product.name, text: `Check out ${product.name} for ${product.priceFormatted} on KASUWA 2.0!` });
              }
            }}
            className="w-9 h-9 rounded-full bg-[var(--night-card)] flex items-center justify-center border border-[var(--border-ember)]"
          >
            <Share2 className="size-4 text-[var(--text-ash)]" />
          </button>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {/* Product Hero */}
        <div className="px-4 pt-5 pb-4">
          <div className="flex items-center gap-4 mb-4">
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl flex-shrink-0"
              style={{
                background: `linear-gradient(135deg, ${product.categoryIcon === "🚗" ? "#3b82f6" : product.categoryIcon === "📱" ? "#8b5cf6" : "#FF9A3C"}20, ${product.categoryIcon === "🚗" ? "#3b82f6" : product.categoryIcon === "📱" ? "#8b5cf6" : "#FF9A3C"}08)`,
                border: `1.5px solid ${product.categoryIcon === "🚗" ? "#3b82f6" : product.categoryIcon === "📱" ? "#8b5cf6" : "#FF9A3C"}30`,
              }}
            >
              {product.image}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-base font-black text-[var(--text-lantern)] leading-tight mb-1">{product.name}</h1>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-[rgba(255,154,60,0.15)] text-[var(--ember-orange)]">
                  {product.condition}
                </span>
                <span className="text-[10px] text-[var(--text-ash)] flex items-center gap-1">
                  <MapPin className="size-2.5" />{product.state}
                </span>
                <span className="text-[10px] text-[var(--text-ash)] flex items-center gap-1">
                  <Eye className="size-2.5" />{product.views} views
                </span>
              </div>
            </div>
          </div>

          {/* Price */}
          <div className="bg-[var(--night-card)] rounded-2xl p-4 border border-[var(--border-ember)] mb-4">
            <div className="flex items-end justify-between">
              <div>
                <div className="text-2xl font-black text-[var(--ember-orange)]">{product.priceFormatted}</div>
                {product.negotiable && (
                  <div className="text-xs text-[var(--text-ash)] mt-0.5">
                    Negotiable from <span className="text-[var(--lantern-gold)] font-bold">{product.haggleMinFormatted}</span>
                  </div>
                )}
              </div>
              {product.negotiable && (
                <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-[rgba(74,63,138,0.12)] border border-[rgba(74,63,138,0.15)] text-[var(--text-ash)]">
                  <Tag className="size-2.5 inline mr-1" />Haggle
                </span>
              )}
            </div>
            {product.communityDeal && (
              <div className="circle-bubble p-3 mt-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Users className="size-3.5 text-[var(--kente-green-bright)]" />
                  <span className="text-xs font-bold text-[var(--kente-green-bright)]">
                    Community Deal: {product.communityDeal.discountPercent}% OFF
                  </span>
                </div>
                <div className="text-[10px] text-[var(--text-ash)]">
                  {product.communityDeal.currentBuyers}/{product.communityDeal.minBuyers} buyers joined &middot; Price drops to <span className="text-[var(--kente-green-bright)] font-bold">{product.communityDeal.discountedPriceFormatted}</span>
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="mb-4">
            <h3 className="text-xs font-bold text-[var(--text-lantern)] mb-2 uppercase tracking-wider">Description</h3>
            <p className="text-xs text-[var(--text-smoke)] leading-relaxed">{product.description}</p>
          </div>

          {/* Specs */}
          <div className="mb-4">
            <h3 className="text-xs font-bold text-[var(--text-lantern)] mb-2 uppercase tracking-wider">Specifications</h3>
            <div className="bg-[var(--night-card)] rounded-2xl border border-[var(--border-ember)] overflow-hidden">
              {Object.entries(product.specs).map(([key, value], i) => (
                <div
                  key={key}
                  className={`flex items-center justify-between px-4 py-2.5 ${i < Object.entries(product.specs).length - 1 ? "border-b border-[rgba(255,154,60,0.06)]" : ""}`}
                >
                  <span className="text-xs text-[var(--text-ash)]">{key}</span>
                  <span className="text-xs text-[var(--text-smoke)] font-medium">{value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="kente-stripe mb-4" />

          {/* Seller Info */}
          {seller && (
            <div className="mb-4">
              <h3 className="text-xs font-bold text-[var(--text-lantern)] mb-2 uppercase tracking-wider">Seller Information</h3>
              <div className="bg-[var(--night-card)] rounded-2xl border border-[var(--border-ember)] p-4">
                {/* Seller header */}
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-xl"
                    style={{
                      background: `${CATEGORY_COLORS[product.category] || "#FF9A3C"}15`,
                      border: `1.5px solid ${CATEGORY_COLORS[product.category] || "#FF9A3C"}30`,
                    }}
                  >
                    {seller.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold text-[var(--text-lantern)]">{seller.shopName}</span>
                      {seller.verified && (
                        <ShieldCheck className="size-3.5 text-[#3DAF62]" />
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] text-[var(--text-ash)]">by {seller.name}</span>
                      <span className="text-[10px] text-[var(--text-ash)]">&middot;</span>
                      <span className="text-[10px] text-[var(--text-ash)] flex items-center gap-0.5">
                        <Star className="size-2.5 text-[var(--lantern-gold)] fill-[var(--lantern-gold)]" />
                        {seller.rating}
                      </span>
                      <span className="text-[10px] text-[var(--text-ash)]">&middot;</span>
                      <span className="text-[10px] text-[var(--text-ash)]">{seller.totalSales} sales</span>
                    </div>
                  </div>
                </div>

                {/* Shop type badge */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[10px] font-semibold px-2 py-1 rounded-lg bg-[rgba(255,154,60,0.08)] border border-[rgba(255,154,60,0.1)] text-[var(--text-ash)]">
                    {shopTypeLabels[seller.shopType] || seller.shopType}
                  </span>
                  {seller.verified && (
                    <span className="text-[10px] font-semibold px-2 py-1 rounded-lg bg-[rgba(45,143,78,0.08)] border border-[rgba(45,143,78,0.1)] text-[var(--kente-green-bright)] flex items-center gap-1">
                      <ShieldCheck className="size-2.5" />Verified Seller
                    </span>
                  )}
                </div>

                <div className="kente-stripe mb-3" />

                {/* Address */}
                <div className="space-y-2.5">
                  <div className="flex items-start gap-2.5">
                    <MapPin className="size-3.5 text-[var(--ember-orange)] mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-[10px] text-[var(--text-ash)] uppercase tracking-wider mb-0.5">Address</div>
                      <div className="text-xs text-[var(--text-smoke)] leading-relaxed">{seller.address}</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <Navigation className="size-3.5 text-[var(--ember-orange)] mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-[10px] text-[var(--text-ash)] uppercase tracking-wider mb-0.5">Landmark</div>
                      <div className="text-xs text-[var(--text-smoke)] leading-relaxed">{seller.landmark}</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <MapPin className="size-3.5 text-[var(--ember-orange)] mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-[10px] text-[var(--text-ash)] uppercase tracking-wider mb-0.5">Location</div>
                      <div className="text-xs text-[var(--text-smoke)]">
                        {seller.city}, {seller.state} &middot; {seller.lga} LGA
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <Phone className="size-3.5 text-[var(--ember-orange)] mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="text-[10px] text-[var(--text-ash)] uppercase tracking-wider mb-0.5">Phone</div>
                      <div className="text-xs text-[var(--text-smoke)]">{seller.phone}</div>
                    </div>
                    <button
                      onClick={() => copyToClipboard(seller.phone)}
                      className="text-[10px] px-2 py-1 rounded-lg bg-[rgba(255,154,60,0.08)] border border-[rgba(255,154,60,0.12)] text-[var(--ember-orange)] flex items-center gap-1"
                    >
                      <Copy className="size-2.5" />
                      {showCopied ? "Copied!" : "Copy"}
                    </button>
                  </div>

                  {seller.whatsapp && (
                    <div className="flex items-start gap-2.5">
                      <MessageCircle className="size-3.5 text-[var(--kente-green-bright)] mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="text-[10px] text-[var(--text-ash)] uppercase tracking-wider mb-0.5">WhatsApp</div>
                        <div className="text-xs text-[var(--text-smoke)]">{seller.whatsapp}</div>
                      </div>
                      <a
                        href={`https://wa.me/${seller.whatsapp.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(`Hello, I saw ${product.name} (${product.priceFormatted}) on KASUWA 2.0. Is it still available?`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] px-2 py-1 rounded-lg bg-[rgba(45,143,78,0.12)] border border-[rgba(45,143,78,0.2)] text-[var(--kente-green-bright)] flex items-center gap-1"
                      >
                        <ExternalLink className="size-2.5" />
                        Chat
                      </a>
                    </div>
                  )}

                  {seller.email && (
                    <div className="flex items-start gap-2.5">
                      <Sparkles className="size-3.5 text-[var(--ember-orange)] mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="text-[10px] text-[var(--text-ash)] uppercase tracking-wider mb-0.5">Email</div>
                        <div className="text-xs text-[var(--text-smoke)]">{seller.email}</div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-2.5">
                    <Clock className="size-3.5 text-[var(--ember-orange)] mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-[10px] text-[var(--text-ash)] uppercase tracking-wider mb-0.5">Member Since</div>
                      <div className="text-xs text-[var(--text-smoke)]">
                        {new Date(seller.joinedDate).toLocaleDateString("en-NG", { year: "numeric", month: "long" })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Bottom padding for safe area */}
          <div className="h-8" />
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="px-4 py-3 pb-[max(12px,env(safe-area-inset-bottom))] border-t border-[var(--border-ember)] bg-[rgba(6,8,12,0.98)] backdrop-blur-xl">
        {seller && (
          <div className="flex gap-2">
            <a
              href={`tel:${seller.phone.replace(/[^0-9+]/g, "")}`}
              className="btn-ghost-night flex-1 py-3 text-xs"
            >
              <Phone className="size-3.5" />Call Seller
            </a>
            <a
              href={`https://wa.me/${seller.whatsapp.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(`Hello, I saw ${product.name} (${product.priceFormatted}) on KASUWA 2.0. Is it still available?`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 bg-[rgba(45,143,78,0.15)] border border-[rgba(45,143,78,0.2)] text-[var(--kente-green-bright)] hover:bg-[rgba(45,143,78,0.2)] transition-all"
            >
              <MessageCircle className="size-3.5" />WhatsApp
            </a>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ── Main Component (with Suspense for useSearchParams) ──

export default function KasuwaMarketPage() {
  return (
    <Suspense
      fallback={
        <div className="night-market-bg h-[100dvh] flex items-center justify-center">
          <div className="lantern-glow lantern-glow-1" />
          <div className="lantern-glow lantern-glow-2" />
          <div className="text-4xl animate-pulse">🏮</div>
        </div>
      }
    >
      <KasuwaMarket />
    </Suspense>
  );
}

function KasuwaMarket() {
  const searchParams = useSearchParams();
  const [categories] = useState<CategoryChat[]>(buildCategoryChats);
  const [activeCategory, setActiveCategory] = useState<CategoryChat | null>(null);
  const [chatMessages, setChatMessages] = useState<Record<string, ChatMessage[]>>({});
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<ProductCardData | null>(null);

  // ── Email confirmation state ──
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // ── Check for email confirmation / auth error on mount ──
  useEffect(() => {
    const confirmed = searchParams.get("confirmed");
    const errorParam = searchParams.get("auth_error");
    if (confirmed === "true") {
      setShowConfirmation(true);
      // Clean up URL without reloading the page
      const url = new URL(window.location.href);
      url.searchParams.delete("confirmed");
      url.searchParams.delete("auth_error");
      window.history.replaceState({}, "", url.pathname);
    } else if (errorParam) {
      setAuthError(decodeURIComponent(errorParam));
      // Clean up URL
      const url = new URL(window.location.href);
      url.searchParams.delete("auth_error");
      url.searchParams.delete("confirmed");
      window.history.replaceState({}, "", url.pathname);
    }
  }, [searchParams]);

  // ── Auto-scroll ──
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, activeCategory, isTyping]);

  // ── Open a category chat ──
  const openCategory = useCallback((category: CategoryChat) => {
    setActiveCategory(category);
    setShowSidebar(false);

    // Initialize chat if empty
    if (!chatMessages[category.id] || chatMessages[category.id].length === 0) {
      const products = getProductsByCategory(category.id);
      const productCards = products.map(productToCardData);

      const welcomeMsg: ChatMessage = {
        id: `welcome-${category.id}`,
        role: "mai",
        content: `${getTimeGreeting()} Welcome to ${category.icon} ${category.name}!\n\n${category.description}\n\n${products.length > 0 ? `I have ${products.length} item${products.length > 1 ? "s" : ""} ready for you. Browse below or ask me anything!` : "The stall is set up. Check back soon for new items!"}`,
        products: productCards,
        actions: products.length > 0 ? ["haggle", "community_deal"] : [],
        timestamp: Date.now(),
      };

      setChatMessages((prev) => ({
        ...prev,
        [category.id]: [welcomeMsg],
      }));
    }
  }, [chatMessages]);

  // ── Send message ──
  const sendMessage = useCallback(
    async (text?: string, catId?: string) => {
      const categoryId = catId || activeCategory?.id;
      if (!categoryId) return;
      const messageText = text || inputValue.trim();
      if (!messageText) return;

      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: messageText,
        timestamp: Date.now(),
      };

      setChatMessages((prev) => ({
        ...prev,
        [categoryId]: [...(prev[categoryId] || []), userMsg],
      }));
      setInputValue("");
      setIsTyping(true);

      try {
        const history = chatMessages[categoryId] || [];
        const conversationHistory = history.map((m) => ({
          role: m.role === "mai" ? "assistant" : m.role === "user" ? "user" : "system",
          content: m.content,
        }));

        const res = await fetch("/api/kasuwa", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: messageText, conversationHistory }),
        });

        const data = await res.json();
        const maiMsg: ChatMessage = {
          id: `mai-${Date.now()}`,
          role: "mai",
          content: data.message || "The market is quiet right now.",
          products: (data.products || []).map((p: Record<string, unknown>) => {
            const raw = p.product || p;
            if (raw && typeof raw === "object" && "id" in raw) {
              return productToCardData(raw as unknown as Product);
            }
            return null;
          }).filter(Boolean),
          actions: data.actions || [],
          timestamp: Date.now(),
        };

        setChatMessages((prev) => ({
          ...prev,
          [categoryId]: [...(prev[categoryId] || []), maiMsg],
        }));
      } catch {
        const errorMsg: ChatMessage = {
          id: `error-${Date.now()}`, role: "system",
          content: "Connection lost. The lanterns flickered out. Try again!",
          timestamp: Date.now(),
        };
        setChatMessages((prev) => ({
          ...prev,
          [categoryId]: [...(prev[categoryId] || []), errorMsg],
        }));
      } finally {
        setIsTyping(false);
      }
    },
    [inputValue, activeCategory, chatMessages]
  );

  // ── Filtered categories ──
  const filteredCategories = categories.filter(
    (c) => !searchQuery || c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ── Get current chat messages ──
  const currentMessages = activeCategory ? chatMessages[activeCategory.id] || [] : [];

  return (
    <div className="night-market-bg h-[100dvh] flex flex-col overflow-hidden relative">
      {/* Ambient */}
      <div className="lantern-glow lantern-glow-1" />
      <div className="lantern-glow lantern-glow-2" />

      {/* ── Top Status Bar (WhatsApp-style) ── */}
      <div className="relative z-50 flex items-center justify-between px-4 py-1.5 bg-[rgba(6,8,12,0.95)] border-b border-[rgba(255,154,60,0.08)]">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-[var(--text-ash)]">{new Date().toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit", hour12: true })}</span>
        </div>
        <div className="flex items-center gap-2 text-[var(--text-ash)]">
          <Signal className="size-3" />
          <Wifi className="size-3" />
          <Battery className="size-3.5" />
        </div>
      </div>

      {/* ── Main Content Area ── */}
      <div className="flex-1 flex overflow-hidden relative z-10">

        {/* ── Sidebar: Category Chat List ── */}
        <AnimatePresence>
          {showSidebar && (
            <motion.div
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="w-full md:w-80 lg:w-96 flex-shrink-0 flex flex-col bg-[var(--night-void)] border-r border-[var(--border-ember)] md:relative absolute inset-0 z-30 md:z-auto"
            >
              {/* Sidebar Header */}
              <div className="px-4 py-3 flex items-center justify-between border-b border-[var(--border-ember)] bg-[rgba(6,8,12,0.9)]">
                <div className="flex items-center gap-2.5">
                  <div className="text-2xl">🏮</div>
                  <div>
                    <h1 className="text-sm font-black text-[var(--text-lantern)] tracking-tight">KASUWA 2.0</h1>
                    <p className="text-[9px] text-[var(--text-ash)] uppercase tracking-widest">The Market That Listens</p>
                  </div>
                </div>
                <Link href="/seller/register" className="w-9 h-9 rounded-full bg-[var(--night-card)] flex items-center justify-center border border-[var(--border-ember)]" title="Sell on Kasuwa">
                  <Store className="size-4 text-[var(--ember-orange)]" />
                </Link>
              </div>

              {/* Seller CTA */}
              <Link href="/seller/register" className="mx-3 mt-2 mb-1 px-3 py-2.5 rounded-xl bg-[rgba(255,154,60,0.06)] border border-[rgba(255,154,60,0.1)] flex items-center justify-between hover:bg-[rgba(255,154,60,0.1)] transition-all group">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[rgba(255,154,60,0.1)] flex items-center justify-center">
                    <Store className="size-3.5 text-[var(--ember-orange)]" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-[var(--text-lantern)] block leading-tight">Sell on Kasuwa</span>
                    <span className="text-[9px] text-[var(--text-ash)]">Register your shop today</span>
                  </div>
                </div>
                <ArrowRight className="size-3.5 text-[var(--text-ash)] group-hover:text-[var(--ember-orange)] transition-colors" />
              </Link>

              {/* Search */}
              <div className="px-3 py-2">
                <div className="flex items-center gap-2 bg-[var(--night-card)] rounded-xl px-3 py-2 border border-[var(--border-ember)]">
                  <Search className="size-3.5 text-[var(--text-ash)]" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search categories..."
                    className="flex-1 bg-transparent outline-none text-xs text-[var(--text-lantern)] placeholder:text-[var(--text-ash)]"
                  />
                </div>
              </div>

              {/* Category List */}
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                {filteredCategories.map((category) => {
                  const isActive = activeCategory?.id === category.id;
                  return (
                    <button
                      key={category.id}
                      onClick={() => openCategory(category)}
                      className={`w-full flex items-center gap-3 px-4 py-3 transition-all hover:bg-[rgba(255,154,60,0.04)] active:bg-[rgba(255,154,60,0.08)] ${
                        isActive ? "bg-[rgba(255,154,60,0.08)]" : ""
                      }`}
                    >
                      {/* Avatar */}
                      <div className="relative flex-shrink-0">
                        <div
                          className="w-12 h-12 rounded-full flex items-center justify-center text-xl"
                          style={{ background: `${category.color}15`, border: `1.5px solid ${category.color}30` }}
                        >
                          {category.icon}
                        </div>
                        {category.online && (
                          <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-[var(--kente-green-bright)] border-2 border-[var(--night-void)]" />
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0 text-left">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-[var(--text-lantern)] truncate">
                            {category.name}
                          </span>
                          <span className="text-[10px] text-[var(--text-ash)] flex-shrink-0 ml-2">
                            {category.lastTime}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mt-0.5">
                          <span className="text-[11px] text-[var(--text-ash)] truncate">
                            {category.lastMessage}
                          </span>
                          <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                            {category.productCount > 0 && (
                              <span className="text-[9px] text-[var(--text-shadow)]">{category.productCount} items</span>
                            )}
                            {category.unread > 0 && (
                              <span className="w-5 h-5 rounded-full bg-[var(--ember-orange)] text-[var(--night-void)] text-[9px] font-bold flex items-center justify-center">
                                {category.unread}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Chevron */}
                      <ChevronRight className="size-4 text-[var(--text-ash)] flex-shrink-0 opacity-30" />
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Chat Area ── */}
        {activeCategory ? (
          <div className="flex-1 flex flex-col bg-[var(--night-void)] min-w-0">
            {/* Chat Header */}
            <div className="px-3 py-2.5 flex items-center gap-3 border-b border-[var(--border-ember)] bg-[rgba(6,8,12,0.95)] backdrop-blur-xl">
              <button
                onClick={() => setShowSidebar(true)}
                className="w-9 h-9 rounded-full bg-[var(--night-card)] flex items-center justify-center border border-[var(--border-ember)] md:hidden"
              >
                <ChevronLeft className="size-4 text-[var(--text-ash)]" />
              </button>
              <div className="relative">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
                  style={{ background: `${activeCategory.color}15`, border: `1.5px solid ${activeCategory.color}30` }}
                >
                  {activeCategory.icon}
                </div>
                {activeCategory.online && (
                  <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[var(--kente-green-bright)] border-2 border-[var(--night-void)]" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-sm font-bold text-[var(--text-lantern)]">{activeCategory.name}</h2>
                <p className="text-[10px] text-[var(--kente-green-bright)]">
                  {isTyping ? "typing..." : activeCategory.online ? "online" : "last seen recently"}
                </p>
              </div>
            </div>

            {/* Chat Messages */}
            <main className="flex-1 overflow-y-auto custom-scrollbar px-3 py-3 space-y-3">
              {/* Date header */}
              <div className="flex justify-center">
                <span className="text-[10px] text-[var(--text-ash)] bg-[var(--night-card)] px-3 py-1 rounded-lg">
                  Today
                </span>
              </div>

              {currentMessages.map((msg) => (
                <div key={msg.id} className="chat-message">
                  {/* Mai Kasuwa message */}
                  {msg.role === "mai" && (
                    <div className="flex gap-2">
                      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-[rgba(255,154,60,0.15)] flex items-center justify-center mt-1">
                        <Sparkles className="size-3.5 text-[var(--ember-orange)]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="mai-message p-3 max-w-[88%]">
                          <div
                            className="text-xs text-[var(--text-smoke)] leading-relaxed whitespace-pre-line"
                            dangerouslySetInnerHTML={{
                              __html: msg.content
                                .replace(/\*\*(.*?)\*\*/g, '<strong class="text-[var(--text-lantern)]">$1</strong>')
                                .replace(/• /g, '<span class="text-[var(--ember-orange)]">•</span> '),
                            }}
                          />
                          <div className="flex items-center justify-end gap-1 mt-1">
                            <span className="text-[9px] text-[var(--text-shadow)]">{formatTime(msg.timestamp)}</span>
                            <CheckCheck className="size-3 text-[rgba(45,143,78,0.6)]" />
                          </div>
                        </div>

                        {/* Product Cards */}
                        {msg.products && msg.products.length > 0 && (
                          <div className="mt-2 space-y-2 max-w-[92%]">
                            {msg.products.map((product: ProductCardData, idx: number) => (
                              <motion.div
                                key={product.id}
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.08, duration: 0.25 }}
                              >
                                <ProductGlowCard
                                  product={product}
                                  onViewDetails={() => setSelectedProduct(product)}
                                />
                              </motion.div>
                            ))}
                          </div>
                        )}

                        {/* Action buttons */}
                        {msg.actions && msg.actions.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2 max-w-[88%]">
                            {msg.actions.includes("haggle") && (
                              <button onClick={() => sendMessage("Can we haggle?")} className="text-[10px] font-bold px-2.5 py-1.5 rounded-lg bg-[rgba(74,63,138,0.1)] border border-[rgba(74,63,138,0.15)] text-[var(--text-ash)] hover:text-[var(--text-lantern)] transition-all">
                                <Tag className="size-2.5 inline mr-1" />Haggle
                              </button>
                            )}
                            {msg.actions.includes("community_deal") && (
                              <button onClick={() => sendMessage("Show community deals")} className="text-[10px] font-bold px-2.5 py-1.5 rounded-lg bg-[rgba(45,143,78,0.08)] border border-[rgba(45,143,78,0.12)] text-[var(--text-ash)] hover:text-[var(--text-lantern)] transition-all">
                                <Users className="size-2.5 inline mr-1" />Circles
                              </button>
                            )}
                            {msg.actions.includes("browse_categories") && (
                              <button onClick={() => sendMessage("What categories are available?")} className="text-[10px] font-bold px-2.5 py-1.5 rounded-lg bg-[rgba(255,154,60,0.08)] border border-[rgba(255,154,60,0.12)] text-[var(--text-ash)] hover:text-[var(--text-lantern)] transition-all">
                                <Eye className="size-2.5 inline mr-1" />Browse
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* User message */}
                  {msg.role === "user" && (
                    <div className="flex justify-end">
                      <div className="user-message p-3 max-w-[80%]">
                        <p className="text-xs text-[var(--text-smoke)] leading-relaxed">{msg.content}</p>
                        <div className="flex items-center justify-end gap-1 mt-1">
                          <span className="text-[9px] text-[rgba(255,255,255,0.25)]">{formatTime(msg.timestamp)}</span>
                          <CheckCheck className="size-3 text-[rgba(45,143,78,0.6)]" />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* System message */}
                  {msg.role === "system" && (
                    <div className="flex justify-center">
                      <div className="system-message px-3 py-2">
                        <div
                          className="text-[10px] text-[var(--text-ash)] text-center"
                          dangerouslySetInnerHTML={{
                            __html: msg.content.replace(/\*\*(.*?)\*\*/g, '<strong class="text-[var(--text-lantern)]">$1</strong>'),
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Typing indicator */}
              {isTyping && (
                <div className="flex gap-2">
                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-[rgba(255,154,60,0.15)] flex items-center justify-center mt-1">
                    <Sparkles className="size-3.5 text-[var(--ember-orange)]" />
                  </div>
                  <div className="mai-message p-3">
                    <div className="flex items-center gap-1.5 py-0.5">
                      <span className="typing-dot" />
                      <span className="typing-dot" />
                      <span className="typing-dot" />
                    </div>
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </main>

            {/* Chat Input */}
            <div className="chat-input-container px-3 py-2.5 pb-[max(10px,env(safe-area-inset-bottom))]">
              {currentMessages.length <= 1 && (
                <div className="flex gap-1.5 mb-2 overflow-x-auto scrollbar-hide pb-0.5">
                  {["Best price?", "Any deals?", "Show me more", "Community circles"].map((s) => (
                    <button
                      key={s}
                      onClick={() => sendMessage(s)}
                      className="flex-shrink-0 text-[10px] font-medium px-2.5 py-1.5 rounded-xl bg-[rgba(255,154,60,0.06)] border border-[rgba(255,154,60,0.1)] text-[var(--text-ash)] hover:text-[var(--text-lantern)] hover:bg-[rgba(255,154,60,0.12)] transition-all whitespace-nowrap"
                    >
                      <MessageCircle className="size-2.5 inline mr-1 opacity-50" />
                      {s}
                    </button>
                  ))}
                </div>
              )}
              <form
                onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
                className="flex items-center gap-2"
              >
                <div className="chat-input-box flex-1 flex items-center px-3 py-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder={`Ask about ${activeCategory.name}...`}
                    className="flex-1 bg-transparent outline-none text-xs text-[var(--text-lantern)] placeholder:text-[var(--text-ash)]"
                    disabled={isTyping}
                  />
                </div>
                <button
                  type="submit"
                  disabled={!inputValue.trim() || isTyping}
                  className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--ember-orange)] to-[var(--lantern-gold)] flex items-center justify-center disabled:opacity-30 transition-all hover:shadow-lg hover:shadow-[rgba(255,154,60,0.2)] active:scale-95"
                >
                  <Send className="size-4 text-[var(--night-void)]" />
                </button>
              </form>
            </div>
          </div>
        ) : (
          /* ── Empty state (desktop when no chat selected) ── */
          <div className="hidden md:flex flex-1 items-center justify-center flex-col gap-4">
            <div className="text-6xl">🏮</div>
            <h2 className="text-xl font-black text-[var(--text-lantern)]">KASUWA 2.0</h2>
            <p className="text-sm text-[var(--text-ash)] max-w-xs text-center">
              Select a category from the sidebar to start browsing products
            </p>
          </div>
        )}
      </div>

      {/* ── Product Detail Panel ── */}
      <AnimatePresence>
        {selectedProduct && (
          <ProductDetailPanel
            product={selectedProduct}
            onClose={() => setSelectedProduct(null)}
          />
        )}
      </AnimatePresence>

      {/* ── Email Confirmation Welcome Modal ── */}
      <AnimatePresence>
        {showConfirmation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-[rgba(6,8,12,0.85)] backdrop-blur-md"
            onClick={() => setShowConfirmation(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 30 }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="w-full max-w-sm bg-[var(--night-surface)] border border-[var(--border-ember)] rounded-2xl overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Kente stripe top */}
              <div className="kente-stripe" />

              <div className="p-6 text-center">
                {/* Success icon */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", damping: 12, stiffness: 180, delay: 0.15 }}
                  className="w-20 h-20 rounded-full bg-[rgba(45,143,78,0.15)] border border-[rgba(45,143,78,0.3)] flex items-center justify-center mx-auto mb-5"
                >
                  <CheckCircle2 className="size-10 text-[var(--kente-green-bright)]" />
                </motion.div>

                <h2 className="text-xl font-black text-[var(--text-lantern)] mb-2">
                  Email Confirmed!
                </h2>

                <div className="flex items-center justify-center gap-2 mb-4">
                  <MailCheck className="size-4 text-[var(--kente-green-bright)]" />
                  <span className="text-sm text-[var(--text-smoke)]">
                    You have successfully confirmed your email
                  </span>
                </div>

                <div className="bg-[rgba(255,154,60,0.06)] border border-[rgba(255,154,60,0.12)] rounded-xl p-4 mb-5">
                  <p className="text-sm text-[var(--text-smoke)] leading-relaxed">
                    Please wait for admin approval. Once approved, you will be able to
                    log in and start uploading your products to the marketplace.
                  </p>
                  <p className="text-xs text-[var(--text-ash)] mt-2">
                    You will receive an email notification when your account is approved. Thank you!
                  </p>
                </div>

                <button
                  onClick={() => setShowConfirmation(false)}
                  className="btn-ember w-full"
                >
                  Browse the Market
                </button>
              </div>

              {/* Kente stripe bottom */}
              <div className="kente-stripe" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Auth Error Modal ── */}
      <AnimatePresence>
        {authError && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-[rgba(6,8,12,0.85)] backdrop-blur-md"
            onClick={() => setAuthError(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 30 }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="w-full max-w-sm bg-[var(--night-surface)] border border-[rgba(232,93,44,0.3)] rounded-2xl overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="kente-stripe" />

              <div className="p-6 text-center">
                <div className="w-16 h-16 rounded-full bg-[rgba(232,93,44,0.12)] border border-[rgba(232,93,44,0.25)] flex items-center justify-center mx-auto mb-4">
                  <X className="size-8 text-[var(--fire-red)]" />
                </div>

                <h2 className="text-lg font-black text-[var(--fire-red)] mb-2">
                  Confirmation Failed
                </h2>

                <p className="text-sm text-[var(--text-smoke)] mb-5">
                  {authError}
                </p>

                <button
                  onClick={() => setAuthError(null)}
                  className="btn-ghost-night w-full"
                >
                  Dismiss
                </button>
              </div>

              <div className="kente-stripe" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
