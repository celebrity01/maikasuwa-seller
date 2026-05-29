import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { z } from 'zod';

const signinSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = signinSchema.parse(body);

    const client = createServerClient();

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

    // Fetch profile
    const { data: profile } = await client
      .from('profiles')
      .select('*')
      .eq('auth_id', authData.user.id)
      .single();

    return NextResponse.json({
      user: {
        id: profile?.id || authData.user.id,
        name: profile?.name || authData.user.user_metadata?.name || email.split('@')[0],
        email: profile?.email || authData.user.email,
        role: profile?.role || authData.user.user_metadata?.role || 'buyer',
        phone: profile?.phone || '',
        whatsapp: profile?.whatsapp || '',
        avatar: profile?.avatar_url || '',
        createdAt: profile ? new Date(profile.created_at).getTime() : Date.now(),
      },
      session: authData.session,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed' }, { status: 400 });
    }
    console.error('[Supabase] Signin error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
