import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { z } from 'zod';

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6).max(100),
  name: z.string().min(1).max(100),
  role: z.enum(['seller', 'buyer']),
  // Seller KYB fields (optional for buyers, required for sellers validated in handler)
  phone: z.string().optional(),
  physicalAddress: z.string().optional(),
  shopAddress: z.string().optional(),
  homeAsBusiness: z.boolean().optional(),
  avatarBase64: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = signupSchema.parse(body);
    const { email, password, name, role, phone, physicalAddress, shopAddress, homeAsBusiness, avatarBase64 } = validated;

    // Validate seller-specific fields
    if (role === 'seller') {
      if (!phone || phone.trim().length < 10) {
        return NextResponse.json(
          { error: 'Phone number is required for seller registration (at least 10 digits).' },
          { status: 400 }
        );
      }
      if (!physicalAddress || physicalAddress.trim().length < 5) {
        return NextResponse.json(
          { error: 'Physical address is required for seller registration.' },
          { status: 400 }
        );
      }
      if (!homeAsBusiness && (!shopAddress || shopAddress.trim().length < 5)) {
        return NextResponse.json(
          { error: 'Shop address is required, or select "I use my home as my business address".' },
          { status: 400 }
        );
      }
    }

    const client = createServerClient();
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;
    const emailRedirectTo = `${baseUrl}/api/auth/callback`;

    const { data: authData, error: authError } = await client.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo,
        data: {
          name,
          role,
          phone: phone || '',
          physical_address: physicalAddress || '',
          shop_address: homeAsBusiness ? (physicalAddress || '') : (shopAddress || ''),
          home_as_business: homeAsBusiness || false,
          avatar_base64: avatarBase64 ? 'uploaded' : '', // Don't store full base64 in metadata
        },
      },
    });

    if (authError) {
      const msg = authError.message.toLowerCase();
      if (msg.includes('rate limit') || msg.includes('too many') || msg.includes('slow down')) {
        return NextResponse.json(
          { error: 'Too many signup attempts. Please wait a few minutes.' },
          { status: 429 }
        );
      }
      if (msg.includes('already registered')) {
        return NextResponse.json(
          { error: 'This email is already registered. Try signing in instead.' },
          { status: 409 }
        );
      }
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    if (!authData.user) {
      return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
    }

    // Insert profile with extended fields
    const profileData: Record<string, unknown> = {
      auth_id: authData.user.id,
      name,
      email,
      role,
      phone: phone || null,
      whatsapp: phone || null, // Default whatsapp to phone number
    };

    // Try to include extended fields - these may or may not exist in the profiles table
    // If they don't exist, the insert will still succeed for the base fields
    try {
      const { data: profile, error: profileError } = await client
        .from('profiles')
        .insert(profileData)
        .select()
        .single();

      if (profileError) {
        console.error('[Supabase] Profile creation error:', profileError.message);
        // Try minimal insert if extended fields caused the error
        const { data: minimalProfile, error: minimalError } = await client
          .from('profiles')
          .insert({
            auth_id: authData.user.id,
            name,
            email,
            role,
          })
          .select()
          .single();

        if (minimalError) {
          console.error('[Supabase] Minimal profile creation error:', minimalError.message);
        } else {
          profileData.id = minimalProfile?.id;
        }
      } else {
        profileData.id = profile?.id;
      }
    } catch (profileInsertError) {
      console.error('[Supabase] Profile insert exception:', profileInsertError);
    }

    // Store extended seller KYB data in a separate seller_profiles attempt
    // This table may need to be created in Supabase
    if (role === 'seller') {
      try {
        await client
          .from('seller_profiles')
          .insert({
            auth_id: authData.user.id,
            phone: phone || '',
            physical_address: physicalAddress || '',
            shop_address: homeAsBusiness ? (physicalAddress || '') : (shopAddress || ''),
            home_as_business: homeAsBusiness || false,
            avatar_base64: avatarBase64 || '',
            kyb_status: 'pending',
            created_at: new Date().toISOString(),
          });
      } catch (sellerProfileError) {
        // If seller_profiles table doesn't exist, data is still in user_metadata
        console.error('[Supabase] Seller profile creation error (table may not exist):', sellerProfileError);
      }
    }

    const needsConfirmation = !authData.session;

    if (needsConfirmation) {
      return NextResponse.json({
        user: {
          id: profileData.id || authData.user.id,
          name,
          email,
          role,
          phone: phone || '',
          createdAt: Date.now(),
        },
        needsConfirmation: true,
        message: 'Account created! Check your email to confirm your account.',
      });
    }

    return NextResponse.json({
      user: {
        id: profileData.id || authData.user.id,
        name,
        email,
        role,
        phone: phone || '',
        createdAt: Date.now(),
      },
      session: authData.session,
      needsConfirmation: false,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 400 });
    }
    console.error('[Supabase] Signup error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
