import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function getAuth(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  return authHeader.split(" ")[1];
}

async function getSellerProfileId(token: string): Promise<string | null> {
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("seller_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  return profile?.id || null;
}

// GET /api/seller/products — List products for the authenticated seller
export async function GET(request: NextRequest) {
  try {
    const token = getAuth(request);
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get seller profile ID
    const sellerId = await getSellerProfileId(token);
    if (!sellerId) {
      return NextResponse.json({ error: "Seller profile not found" }, { status: 404 });
    }

    const { data: products, error } = await supabase
      .from("products")
      .select("*")
      .eq("seller_id", sellerId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ products });
  } catch (err) {
    console.error("GET products error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/seller/products — Create a new product
export async function POST(request: NextRequest) {
  try {
    const token = getAuth(request);
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get seller profile ID
    const sellerId = await getSellerProfileId(token);
    if (!sellerId) {
      return NextResponse.json({ error: "Seller profile not found" }, { status: 404 });
    }

    const body = await request.json();
    const { name, description, price, category, subcategory, condition, state, negotiable, haggle_min, haggle_max, image_url, image_urls } = body;

    if (!name || !price) {
      return NextResponse.json(
        { error: "Name and price are required" },
        { status: 400 }
      );
    }

    const insertData: Record<string, unknown> = {
      name,
      description: description || null,
      price: parseFloat(price),
      category: category || null,
      subcategory: subcategory || null,
      condition: condition || "Brand New",
      state: state || "",
      negotiable: negotiable !== undefined ? negotiable : true,
      haggle_min: haggle_min ? parseFloat(haggle_min) : 0,
      haggle_max: haggle_max ? parseFloat(haggle_max) : 0,
      seller_id: sellerId,
    };

    // Handle both single image_url and array image_urls
    if (image_url) insertData.image_url = image_url;
    if (image_urls && Array.isArray(image_urls)) insertData.image_urls = image_urls;
    else if (image_url) insertData.image_urls = [image_url];

    const { data: product, error } = await supabase
      .from("products")
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ product }, { status: 201 });
  } catch (err) {
    console.error("POST product error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH /api/seller/products — Update a product
export async function PATCH(request: NextRequest) {
  try {
    const token = getAuth(request);
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get seller profile ID
    const sellerId = await getSellerProfileId(token);
    if (!sellerId) {
      return NextResponse.json({ error: "Seller profile not found" }, { status: 404 });
    }

    const body = await request.json();
    const { id, name, description, price, category, subcategory, condition, state, negotiable, haggle_min, haggle_max, image_url, image_urls, status: productStatus } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (price !== undefined) updateData.price = parseFloat(price);
    if (category !== undefined) updateData.category = category;
    if (subcategory !== undefined) updateData.subcategory = subcategory;
    if (condition !== undefined) updateData.condition = condition;
    if (state !== undefined) updateData.state = state;
    if (negotiable !== undefined) updateData.negotiable = negotiable;
    if (haggle_min !== undefined) updateData.haggle_min = parseFloat(haggle_min);
    if (haggle_max !== undefined) updateData.haggle_max = parseFloat(haggle_max);
    if (image_url !== undefined) updateData.image_url = image_url;
    if (image_urls !== undefined) updateData.image_urls = image_urls;
    // Handle status change (active/paused) — map is_paused for backward compat
    if (productStatus !== undefined) {
      updateData.status = productStatus;
    } else if (body.is_paused !== undefined) {
      updateData.status = body.is_paused ? "paused" : "active";
    }

    const { data: product, error } = await supabase
      .from("products")
      .update(updateData)
      .eq("id", id)
      .eq("seller_id", sellerId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ product });
  } catch (err) {
    console.error("PATCH product error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/seller/products — Delete a product
export async function DELETE(request: NextRequest) {
  try {
    const token = getAuth(request);
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get seller profile ID
    const sellerId = await getSellerProfileId(token);
    if (!sellerId) {
      return NextResponse.json({ error: "Seller profile not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", id)
      .eq("seller_id", sellerId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE product error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
