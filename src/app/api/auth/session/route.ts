import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const client = createServerClient();
    const { data, error } = await client.auth.getUser(token);

    if (error || !data.user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Fetch profile
    const { data: profile } = await client
      .from('profiles')
      .select('*')
      .eq('auth_id', data.user.id)
      .single();

    return NextResponse.json({
      user: {
        id: profile?.id || data.user.id,
        name: profile?.name || data.user.user_metadata?.name || data.user.email?.split('@')[0],
        email: profile?.email || data.user.email,
        role: profile?.role || data.user.user_metadata?.role || 'buyer',
        phone: profile?.phone || '',
        whatsapp: profile?.whatsapp || '',
        avatar: profile?.avatar_url || '',
        createdAt: profile ? new Date(profile.created_at).getTime() : Date.now(),
      },
    });
  } catch {
    return NextResponse.json({ error: 'Session validation failed' }, { status: 500 });
  }
}
