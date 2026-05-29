import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');
    const token = requestUrl.hash?.match(/access_token=([^&]+)/)?.[1];

    if (code) {
      const client = createServerClient();
      const { error } = await client.auth.exchangeCodeForSession(code);

      if (error) {
        return NextResponse.redirect(
          `${requestUrl.origin}?auth_error=${encodeURIComponent(error.message)}`
        );
      }
    }

    if (token) {
      return NextResponse.redirect(
        `${requestUrl.origin}?confirmed=true&token=${encodeURIComponent(token)}`
      );
    }

    return NextResponse.redirect(requestUrl.origin);
  } catch (error) {
    console.error('[Auth Callback] Error:', error);
    return NextResponse.redirect(
      `${new URL(request.url).origin}?auth_error=${encodeURIComponent('Authentication failed')}`
    );
  }
}
