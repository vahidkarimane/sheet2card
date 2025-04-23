import { NextResponse } from 'next/server';
import { fetchProductsFromSheet, Product } from '@/lib/googleSheets';

export async function GET() {
  try {
    const products = await fetchProductsFromSheet();
    return NextResponse.json({ products });
  } catch (error) {
    console.error('Error in products API route:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}
