import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function POST() {
  try {
    const client = createServerClient();
    await client.auth.signOut();
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: true });
  }
}
