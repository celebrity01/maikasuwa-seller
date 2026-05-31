import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Authenticate
    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

    if (authError || !authData.user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Check seller profile
    const { data: profile, error: profileError } = await supabase
      .from("seller_profiles")
      .select("id, shop_name, full_name, is_disabled, status, default_password_set")
      .eq("id", authData.user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "Seller profile not found" },
        { status: 404 }
      );
    }

    if (profile.is_disabled) {
      return NextResponse.json(
        { error: "Account has been disabled. Contact support." },
        { status: 403 }
      );
    }

    if (profile.status !== "approved") {
      return NextResponse.json(
        { error: "Account pending approval" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      user: {
        id: authData.user.id,
        email: authData.user.email,
      },
      profile: {
        shop_name: profile.shop_name,
        full_name: profile.full_name,
        default_password_set: profile.default_password_set,
      },
      session: authData.session,
    });
  } catch (err) {
    console.error("Login API error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
