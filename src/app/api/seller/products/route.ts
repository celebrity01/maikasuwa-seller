import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// GET /api/seller/products — Fetch products for the authenticated seller
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = createServerClient();
    const { data: { user }, error: authError } = await client.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find seller profile
    const { data: seller, error: sellerError } = await client
      .from('seller_profiles')
      .select('id, is_disabled')
      .eq('user_id', user.id)
      .single();

    if (sellerError || !seller) {
      return NextResponse.json({ error: 'Seller profile not found' }, { status: 404 });
    }

    if (seller.is_disabled) {
      return NextResponse.json({ error: 'Account is disabled' }, { status: 403 });
    }

    // Fetch products
    const { data: products, error: productsError } = await client
      .from('products')
      .select('*')
      .eq('seller_id', seller.id)
      .order('created_at', { ascending: false });

    if (productsError) {
      return NextResponse.json({ error: productsError.message }, { status: 400 });
    }

    return NextResponse.json({ products: products || [] });
  } catch (error) {
    console.error('[Seller Products GET] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/seller/products — Create a new product
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = createServerClient();
    const { data: { user }, error: authError } = await client.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find seller profile
    const { data: seller, error: sellerError } = await client
      .from('seller_profiles')
      .select('id, is_disabled, shop_name')
      .eq('user_id', user.id)
      .single();

    if (sellerError || !seller) {
      return NextResponse.json({ error: 'Seller profile not found' }, { status: 404 });
    }

    if (seller.is_disabled) {
      return NextResponse.json({ error: 'Account is disabled' }, { status: 403 });
    }

    const body = await request.json();
    const { name, category, subcategory, price, condition, state, description, specs, negotiable, haggle_min, haggle_max, image_urls } = body;

    if (!name || !category || !price || !state) {
      return NextResponse.json({ error: 'Name, category, price, and state are required' }, { status: 400 });
    }

    const { data: product, error: insertError } = await client
      .from('products')
      .insert({
        seller_id: seller.id,
        name,
        category,
        subcategory: subcategory || '',
        price: Number(price),
        currency: 'NGN',
        condition: condition || 'new',
        state,
        description: description || '',
        specs: specs || {},
        negotiable: negotiable || false,
        haggle_min: haggle_min ? Number(haggle_min) : null,
        haggle_max: haggle_max ? Number(haggle_max) : null,
        image_urls: image_urls || [],
        status: 'active',
        views: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 400 });
    }

    return NextResponse.json({ product });
  } catch (error) {
    console.error('[Seller Products POST] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/seller/products — Update a product
export async function PATCH(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = createServerClient();
    const { data: { user }, error: authError } = await client.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: seller } = await client
      .from('seller_profiles')
      .select('id, is_disabled')
      .eq('user_id', user.id)
      .single();

    if (!seller || seller.is_disabled) {
      return NextResponse.json({ error: 'Unauthorized or disabled' }, { status: 403 });
    }

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    // Verify the product belongs to this seller
    const { data: existing } = await client
      .from('products')
      .select('seller_id')
      .eq('id', id)
      .single();

    if (!existing || existing.seller_id !== seller.id) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const { data: product, error: updateError } = await client
      .from('products')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }

    return NextResponse.json({ product });
  } catch (error) {
    console.error('[Seller Products PATCH] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/seller/products — Delete a product
export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = createServerClient();
    const { data: { user }, error: authError } = await client.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: seller } = await client
      .from('seller_profiles')
      .select('id, is_disabled')
      .eq('user_id', user.id)
      .single();

    if (!seller || seller.is_disabled) {
      return NextResponse.json({ error: 'Unauthorized or disabled' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('id');

    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    // Verify ownership
    const { data: existing } = await client
      .from('products')
      .select('seller_id')
      .eq('id', productId)
      .single();

    if (!existing || existing.seller_id !== seller.id) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const { error: deleteError } = await client
      .from('products')
      .delete()
      .eq('id', productId);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 400 });
    }

    return NextResponse.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('[Seller Products DELETE] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
