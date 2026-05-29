import { NextRequest, NextResponse } from "next/server";
import {
  PRODUCTS,
  searchProducts,
  getProductsByCategory,
  getProductsUnderPrice,
  getProductById,
  getCommunityDeals,
  CATEGORY_LABELS,
  CATEGORY_ICONS,
  formatPrice,
  type Product,
} from "@/lib/marketplace-data";

// ── Time-of-day greeting ──

function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "Barka da safiya! 🌅";
  if (hour >= 12 && hour < 16) return "Barka da rana! ☀️";
  if (hour >= 16 && hour < 20) return "Barka da yamma! 🌇";
  return "Barka da dare! 🌙";
}

function getTimeContext(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "The market is fresh this morning.";
  if (hour >= 12 && hour < 16) return "The afternoon sun is warm, but the market is buzzing.";
  if (hour >= 16 && hour < 20) return "The evening lanterns are being lit across the market.";
  return "The night market is alive with glowing embers and warm lantern light.";
}

// ── Price extraction ──

function extractPrice(query: string): number | null {
  // Match patterns like "₦50,000", "50000", "50k", "under 50000"
  const nairaMatch = query.match(/[₦#]?\s*(\d[\d,]*)/);
  if (nairaMatch) {
    return parseInt(nairaMatch[1].replace(/,/g, ""), 10);
  }

  const kMatch = query.match(/(\d+)\s*k/i);
  if (kMatch) {
    return parseInt(kMatch[1], 10) * 1000;
  }

  return null;
}

// ── Category detection ──

function detectCategory(query: string): string | null {
  const q = query.toLowerCase();

  const categoryKeywords: Record<string, string[]> = {
    vehicles: ["car", "cars", "vehicle", "toyota", "honda", "suv", "bus", "truck", "motorcycle", "okada", "keke", "danfo", "tokunbo", "automobile"],
    electronics: ["phone", "phones", "laptop", "tv", "television", "samsung", "iphone", "galaxy", "gaming", "console", "ps5", "speaker", "electronics"],
    property: ["house", "flat", "apartment", "duplex", "rent", "land", "property", "self-contain", "bq", "room", "office", "shop", "warehouse"],
    fashion: ["cloth", "dress", "ankara", "senator", "agbada", "shoe", "bag", "jewelry", "fashion", "wear", "suit", "native", "cap", "gele", "okrika"],
    "home-garden": ["furniture", "sofa", "bed", "fridge", "generator", "kitchen", "home", "garden", "decor", "appliance"],
    "health-beauty": ["cream", "skincare", "wig", "hair", "makeup", "perfume", "beauty", "health", "supplement", "agbo"],
    services: ["plumber", "electrician", "carpenter", "mechanic", "cleaning", "service", "repair", "tailor", "moving", "caterer", "dj"],
    agriculture: ["farm", "poultry", "chicken", "crop", "seed", "livestock", "cattle", "goat", "yam", "rice", "cassava", "palm oil", "fish", "agric"],
    jobs: ["job", "work", "employment", "hire", "salary", "position", "vacancy", "driver", "remote", "freelance"],
    "food-drinks": ["food", "jollof", "rice", "suya", "zobo", "catering", "restaurant", "buka", "drink", "groceries", "foodstuff"],
    "kids-baby": ["baby", "kids", "children", "stroller", "toy", "toys", "nursery", "school"],
    "sports-outdoors": ["sport", "football", "jersey", "gym", "fitness", "cycling", "swimming", "betting", "chelsea", "manchester"],
  };

  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some((kw) => q.includes(kw))) {
      return category;
    }
  }

  return null;
}

// ── Intent detection ──

type Intent =
  | "greeting"
  | "search"
  | "browse_category"
  | "price_filter"
  | "product_detail"
  | "haggle"
  | "community_deal"
  | "add_to_cart"
  | "view_cart"
  | "gift_idea"
  | "help"
  | "general";

function detectIntent(query: string): Intent {
  const q = query.toLowerCase().trim();

  // Greetings
  if (/^(hi|hello|hey|barka|sannu|good\s*(morning|afternoon|evening)|howdy|what'?s\s*up)/i.test(q)) {
    return "greeting";
  }

  // Haggle
  if (/haggle|negotiate|reduce|lower|discount|cheaper|best\s*price|last\s*price|how\s*much\s*less|can\s*you\s*do/i.test(q)) {
    return "haggle";
  }

  // Community deals
  if (/community|group\s*buy|bulk|circle|together|join/i.test(q)) {
    return "community_deal";
  }

  // Cart
  if (/add\s*to\s*cart|buy\s*this|i'?ll\s*take|i\s*want\s*this|purchase|checkout|view\s*cart|my\s*cart|cart/i.test(q)) {
    return "add_to_cart";
  }

  if (/what'?s\s*in\s*my\s*cart|show\s*cart|my\s*bag/i.test(q)) {
    return "view_cart";
  }

  // Gift
  if (/gift|birthday|present|surprise|mother|father|wife|husband|friend|anniversary/i.test(q)) {
    return "gift_idea";
  }

  // Product detail
  if (/tell\s*me\s*more|more\s*detail|more\s*info|about\s*this|specifics|what\s*about/i.test(q)) {
    return "product_detail";
  }

  // Price filter
  if (/under|below|less\s*than|max|budget|affordable|cheap/i.test(q)) {
    return "price_filter";
  }

  // Category browse
  if (/show\s*me|browse|category|categories|what\s*(do\s*you|can\s*you)\s*have|available/i.test(q)) {
    return "browse_category";
  }

  // Help
  if (/help|how\s*does\s*this\s*work|what\s*is\s*this|guide|tutorial/i.test(q)) {
    return "help";
  }

  // Default to search
  return "search";
}

// ── Format product for chat display ──

function formatProductCard(product: Product): object {
  return {
    type: "product_card",
    product: {
      id: product.id,
      name: product.name,
      category: product.category,
      categoryLabel: CATEGORY_LABELS[product.category] || product.category,
      categoryIcon: CATEGORY_ICONS[product.category] || "🏪",
      subcategory: product.subcategory,
      price: product.price,
      priceFormatted: formatPrice(product.price),
      condition: product.condition,
      state: product.state,
      seller: product.seller,
      image: product.image,
      description: product.description,
      specs: product.specs,
      negotiable: product.negotiable,
      haggleMin: product.haggleRange.min,
      haggleMinFormatted: formatPrice(product.haggleRange.min),
      communityDeal: product.communityDeal
        ? {
            minBuyers: product.communityDeal.minBuyers,
            discountPercent: product.communityDeal.discountPercent,
            currentBuyers: product.communityDeal.currentBuyers,
            discountedPrice: Math.round(
              product.price * (1 - product.communityDeal.discountPercent / 100)
            ),
            discountedPriceFormatted: formatPrice(
              Math.round(product.price * (1 - product.communityDeal.discountPercent / 100))
            ),
          }
        : null,
    },
  };
}

// ── Generate AI response ──

function generateResponse(query: string, conversationHistory: Array<{ role: string; content: string }>): object {
  const intent = detectIntent(query);
  const category = detectCategory(query);
  const maxPrice = extractPrice(query);

  switch (intent) {
    case "greeting": {
      const greeting = getTimeGreeting();
      const context = getTimeContext();
      return {
        message: `${greeting} ${context}\n\nI am **Mai Kasuwa** — The Market Master. Welcome to the night market! 🏮\n\nJust tell me what you're looking for. You can say things like:\n\n• "I need a gift for my mother's birthday, she loves traditional fabrics"\n• "Show me electronics under ₦50,000"\n• "Can we haggle on the leather bag?"\n• "Are there any community buying circles?"\n\nThe market is listening. What are you looking for today?`,
        products: [],
        actions: [],
      };
    }

    case "help": {
      return {
        message: `Let me guide you through the night market! 🏮\n\n**How KASUWA Works:**\n\n🔍 **Search** — Just describe what you need. I'll find it.\n💰 **Haggle** — Found something you like? Let's negotiate the price together.\n👥 **Community Circles** — Join group buying deals for massive discounts.\n🛒 **Cart** — Add items to your cart through conversation.\n🎁 **Gift Ideas** — Tell me about the person, I'll suggest the perfect gift.\n\n**Try saying:**\n• "Show me vehicles"\n• "I need a phone under ₦100,000"\n• "What's the best price for the Samsung Galaxy?"\n• "Any community deals on fashion?"`,
        products: [],
        actions: ["browse_categories"],
      };
    }

    case "browse_category": {
      if (category) {
        const products = getProductsByCategory(category);
        const catLabel = CATEGORY_LABELS[category] || category;
        const catIcon = CATEGORY_ICONS[category] || "🏪";

        if (products.length === 0) {
          return {
            message: `I searched the ${catIcon} ${catLabel} stalls, but I don't have items in stock right now. Check back soon — new goods arrive every evening! 🔥`,
            products: [],
            actions: [],
          };
        }

        return {
          message: `Ah, the ${catIcon} **${catLabel}** section! The stall keepers have some fine goods for you today. Take a look at what I found:`,
          products: products.map(formatProductCard),
          actions: ["haggle", "community_deal"],
        };
      }

      // No specific category — show all categories
      const categoryList = Object.entries(CATEGORY_LABELS)
        .map(([id, label]) => `${CATEGORY_ICONS[id]} **${label}**`)
        .join("\n");

      return {
        message: `The night market has many stalls! 🏮 Here are the sections you can explore:\n\n${categoryList}\n\nJust tell me which section interests you, or describe what you need and I'll find it!`,
        products: [],
        actions: ["browse_categories"],
      };
    }

    case "price_filter": {
      let products: Product[];

      if (category && maxPrice) {
        products = getProductsByCategory(category).filter((p) => p.price <= maxPrice);
        const catLabel = CATEGORY_LABELS[category] || category;
        return {
          message: products.length > 0
            ? `I searched the ${CATEGORY_ICONS[category]} **${catLabel}** stalls for items under **${formatPrice(maxPrice)}**. Here's what I found:`
            : `I couldn't find anything in ${CATEGORY_ICONS[category]} ${catLabel} under ${formatPrice(maxPrice)}. Want me to check other sections or increase your budget?`,
          products: products.map(formatProductCard),
          actions: products.length > 0 ? ["haggle", "community_deal"] : [],
        };
      }

      if (maxPrice) {
        products = getProductsUnderPrice(maxPrice);
        return {
          message: products.length > 0
            ? `Here's what I found across the market under **${formatPrice(maxPrice)}**:`
            : `Nothing found under ${formatPrice(maxPrice)}. Try a higher amount or tell me what category you're interested in!`,
          products: products.map(formatProductCard),
          actions: products.length > 0 ? ["haggle", "community_deal"] : [],
        };
      }

      return {
        message: "What's your budget? Tell me a price range and I'll find the best deals for you! 💰",
        products: [],
        actions: [],
      };
    }

    case "search": {
      const products = searchProducts(query);

      if (products.length === 0) {
        // Try category-based fallback
        if (category) {
          const catProducts = getProductsByCategory(category);
          if (catProducts.length > 0) {
            return {
              message: `I couldn't find an exact match, but the ${CATEGORY_ICONS[category]} **${CATEGORY_LABELS[category]}** stalls have these items:`,
              products: catProducts.map(formatProductCard),
              actions: ["haggle", "community_deal"],
            };
          }
        }
        return {
          message: `I searched every stall in the market, but couldn't find exactly that. 🔦\n\nTry describing it differently, or tell me:\n• A category (e.g. "vehicles", "electronics")\n• A price range (e.g. "under ₦100,000")\n• What you need it for (e.g. "gift for my wife")`,
          products: [],
          actions: [],
        };
      }

      return {
        message: `I found some matches in the market! 🔥 Take a look:`,
        products: products.map(formatProductCard),
        actions: ["haggle", "community_deal"],
      };
    }

    case "product_detail": {
      // Find the last mentioned product from conversation history
      const lastProductMsg = [...conversationHistory].reverse().find((m) => m.role === "assistant");
      // Try to find product by name in the query
      const mentionedProduct = PRODUCTS.find((p) => {
        const nameParts = p.name.toLowerCase().split(" ");
        return nameParts.some((part) => part.length > 3 && query.toLowerCase().includes(part));
      });

      if (mentionedProduct) {
        return {
          message: `Here are the full details for **${mentionedProduct.name}**:\n\n${mentionedProduct.description}\n\n${mentionedProduct.negotiable ? "💬 The seller is open to haggling! Just say the word." : "⚠️ This item has a fixed price."}${mentionedProduct.communityDeal ? `\n\n👥 **Community Deal:** Join ${mentionedProduct.communityDeal.currentBuyers}/${mentionedProduct.communityDeal.minBuyers} buyers for ${mentionedProduct.communityDeal.discountPercent}% off!` : ""}`,
          products: [formatProductCard(mentionedProduct)],
          actions: mentionedProduct.negotiable ? ["haggle", "add_to_cart"] : ["add_to_cart"],
        };
      }

      return {
        message: "Which item would you like to know more about? Just mention the product name and I'll give you all the details!",
        products: [],
        actions: [],
      };
    }

    case "haggle": {
      // Find product to haggle on
      const haggleProduct = PRODUCTS.find((p) => {
        const nameParts = p.name.toLowerCase().split(" ");
        return nameParts.some((part) => part.length > 3 && query.toLowerCase().includes(part));
      }) || PRODUCTS.find((p) => p.negotiable);

      if (!haggleProduct) {
        return {
          message: "There's nothing to haggle on right now. Tell me what you're interested in first! 🤝",
          products: [],
          actions: [],
        };
      }

      const hagglePrice = Math.round(
        haggleProduct.haggleRange.min +
        Math.random() * (haggleProduct.haggleRange.max - haggleProduct.haggleRange.min) * 0.3
      );

      return {
        message: `Ah, you have a good eye for bargaining! 😄\n\nFor the **${haggleProduct.name}**, the seller is asking **${formatPrice(haggleProduct.price)}**.\n\nI've spoken to the stall keeper, and they're willing to come down to **${formatPrice(hagglePrice)}** if you're serious. That's a saving of **${formatPrice(haggleProduct.price - hagglePrice)}**!\n\nWant to:\n• **Accept** this price and add to cart\n• **Push harder** for a lower price\n• **Walk away** and check other stalls`,
        products: [formatProductCard(haggleProduct)],
        actions: ["accept_haggle", "push_harder", "walk_away"],
        haggleData: {
          productId: haggleProduct.id,
          originalPrice: haggleProduct.price,
          offeredPrice: hagglePrice,
        },
      };
    }

    case "community_deal": {
      const deals = getCommunityDeals();

      if (deals.length === 0) {
        return {
          message: "No community buying circles are active right now. Check back later — new circles form every evening! 👥",
          products: [],
          actions: [],
        };
      }

      return {
        message: `🔥 **Community Buying Circles** are where the real savings happen!\n\nWhen enough buyers join together, everyone gets a discount. Here are the active circles:`,
        products: deals.map(formatProductCard),
        actions: ["join_circle"],
      };
    }

    case "add_to_cart": {
      const cartProduct = PRODUCTS.find((p) => {
        const nameParts = p.name.toLowerCase().split(" ");
        return nameParts.some((part) => part.length > 3 && query.toLowerCase().includes(part));
      }) || PRODUCTS[0];

      return {
        message: `✅ **${cartProduct.name}** added to your cart at **${formatPrice(cartProduct.price)}**!\n\nYou can:\n• Continue shopping — tell me what else you need\n• View your cart — say "show my cart"\n• Checkout — say "checkout"`,
        products: [formatProductCard(cartProduct)],
        actions: ["view_cart", "checkout", "continue_shopping"],
        cartAction: {
          type: "add",
          productId: cartProduct.id,
          price: cartProduct.price,
        },
      };
    }

    case "view_cart": {
      return {
        message: 'Your cart is ready to be filled! 🛒\n\nTell me what you\'d like to buy, and I\'ll add it to your cart. You can say things like:\n• "Add the Toyota Camry to my cart"\n• "I want the Samsung Galaxy"\n• "Put 2 Ankara fabrics in my bag"',
        products: [],
        actions: [],
      };
    }

    case "gift_idea": {
      const q = query.toLowerCase();
      let giftProducts: Product[] = [];

      if (q.includes("mother") || q.includes("mom") || q.includes("wife") || q.includes("woman") || q.includes("female")) {
        giftProducts = PRODUCTS.filter(
          (p) =>
            p.category === "fashion" ||
            p.category === "health-beauty" ||
            (p.category === "electronics" && p.subcategory === "phones")
        ).slice(0, 3);
      } else if (q.includes("father") || q.includes("dad") || q.includes("husband") || q.includes("man") || q.includes("male")) {
        giftProducts = PRODUCTS.filter(
          (p) =>
            (p.category === "fashion" && p.subcategory === "senator") ||
            p.category === "electronics" ||
            p.category === "sports-outdoors"
        ).slice(0, 3);
      } else if (q.includes("friend") || q.includes("colleague")) {
        giftProducts = PRODUCTS.filter(
          (p) => p.category === "fashion" || p.category === "electronics"
        ).slice(0, 3);
      } else {
        // General popular items
        giftProducts = PRODUCTS.filter((p) => p.communityDeal).slice(0, 3);
      }

      if (giftProducts.length === 0) {
        giftProducts = PRODUCTS.slice(0, 3);
      }

      return {
        message: `🎁 Great idea! Let me find something special.\n\nHere are my gift suggestions based on what you told me:`,
        products: giftProducts.map(formatProductCard),
        actions: ["haggle", "add_to_cart", "community_deal"],
      };
    }

    default: {
      // General fallback — try search
      const fallbackProducts = searchProducts(query);
      if (fallbackProducts.length > 0) {
        return {
          message: "I found some items that might interest you:",
          products: fallbackProducts.map(formatProductCard),
          actions: ["haggle", "community_deal"],
        };
      }

      return {
        message: `I'm here to help you navigate the night market! 🏮\n\nYou can:\n• **Describe what you need** — "I need a phone under ₦100,000"\n• **Browse a category** — "Show me vehicles"\n• **Haggle** — "Can we negotiate on the TV?"\n• **Find gift ideas** — "Gift for my mother who loves fabrics"\n\nJust tell me what you're looking for!`,
        products: [],
        actions: [],
      };
    }
  }
}

// ── API Route Handler ──

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, conversationHistory = [] } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    const response = generateResponse(message, conversationHistory);

    return NextResponse.json(response);
  } catch (error) {
    console.error("[KASUWA] Error:", error);
    return NextResponse.json(
      {
        message: "The market stalls are being rearranged. Please try again in a moment! 🔧",
        products: [],
        actions: [],
      },
      { status: 500 }
    );
  }
}
