import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { z } from 'zod';

const listingSchema = z.object({
  category: z.string().min(1),
  subcategory: z.string().min(1),
  price: z.string().min(1),
  condition: z.string().min(1),
  state: z.string().min(1),
  sellerName: z.string().min(1),
  sellerPhone: z.string().optional(),
  sellerWhatsApp: z.string().optional(),
  categoryFields: z.record(z.string()),
  images: z.array(z.string()).optional(),
});

// GET — Fetch listings
export async function GET(request: NextRequest) {
  try {
    const client = createServerClient();
    const url = new URL(request.url);
    const category = url.searchParams.get('category');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    let query = client
      .from('listings')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ listings: data || [] });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch listings' }, { status: 500 });
  }
}

// POST — Create listing
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const client = createServerClient();
    const { data: userData, error: authError } = await client.auth.getUser(token);

    if (authError || !userData.user) {
      return NextResponse.json({ error: 'Invalid authentication' }, { status: 401 });
    }

    const body = await request.json();
    const validated = listingSchema.parse(body);

    const { data, error } = await client
      .from('listings')
      .insert({
        seller_id: userData.user.id,
        category: validated.category,
        subcategory: validated.subcategory,
        price: validated.price,
        condition: validated.condition,
        state: validated.state,
        seller_name: validated.sellerName,
        seller_phone: validated.sellerPhone || null,
        seller_whatsapp: validated.sellerWhatsApp || null,
        category_fields: validated.categoryFields,
        images: validated.images || [],
        status: 'active',
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ listing: data }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 400 });
    }
    console.error('[Listings] Create error:', error);
    return NextResponse.json({ error: 'Failed to create listing' }, { status: 500 });
  }
}
