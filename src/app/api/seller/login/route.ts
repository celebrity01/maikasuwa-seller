import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required.' },
        { status: 400 }
      );
    }

    const client = createServerClient();

    // Authenticate with Supabase Auth
    const { data: authData, error: authError } = await client.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      const msg = authError.message.toLowerCase();
      if (msg.includes('invalid') || msg.includes('incorrect') || msg.includes('wrong')) {
        return NextResponse.json(
          { error: 'Invalid email or password.' },
          { status: 401 }
        );
      }
      if (msg.includes('email not confirmed')) {
        return NextResponse.json(
          { error: 'Please confirm your email before signing in.' },
          { status: 403 }
        );
      }
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    // Fetch seller profile from seller_profiles table
    const { data: sellerProfile, error: profileError } = await client
      .from('seller_profiles')
      .select('*')
      .eq('email', email)
      .single();

    if (profileError || !sellerProfile) {
      return NextResponse.json(
        { error: 'Seller profile not found. Please register first.' },
        { status: 404 }
      );
    }

    // Check if seller is approved
    if (sellerProfile.status !== 'approved') {
      if (sellerProfile.status === 'pending') {
        return NextResponse.json(
          { error: 'Your account is pending approval. Please wait for admin to review your KYB information.' },
          { status: 403 }
        );
      }
      if (sellerProfile.status === 'rejected') {
        return NextResponse.json(
          { error: 'Your seller application has been rejected. Please contact support for more information.' },
          { status: 403 }
        );
      }
      return NextResponse.json(
        { error: 'Your account is not active. Please contact support.' },
        { status: 403 }
      );
    }

    // Check if seller is disabled by admin
    if (sellerProfile.is_disabled) {
      return NextResponse.json(
        { error: 'Your seller account has been disabled by the admin. Please contact support for assistance.' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      seller: {
        id: sellerProfile.id,
        user_id: sellerProfile.user_id,
        full_name: sellerProfile.full_name,
        email: sellerProfile.email,
        phone: sellerProfile.phone,
        shop_name: sellerProfile.shop_name,
        shop_address: sellerProfile.shop_address,
        shop_type: sellerProfile.shop_type,
        city: sellerProfile.city,
        state: sellerProfile.state,
        photo_url: sellerProfile.photo_url,
        status: sellerProfile.status,
        is_disabled: sellerProfile.is_disabled,
        default_password_set: sellerProfile.default_password_set,
        created_at: sellerProfile.created_at,
      },
      session: authData.session,
    });
  } catch (error) {
    console.error('[Seller Login] Error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
