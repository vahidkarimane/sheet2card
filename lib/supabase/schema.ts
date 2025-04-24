import {Product as GoogleSheetProduct} from "../googleSheets.js";

/**
 * Extended Product interface for Supabase with additional fields
 */
export interface SupabaseProduct extends GoogleSheetProduct {
	// Additional fields
	category: string;
	last_synced_at: string;
	created_at: string;
	updated_at: string;
	is_active: boolean;
	sync_source: string;
	custom_data?: Record<string, any>;
}

// Map Google Sheets product to Supabase product with correct column names
export function mapToSupabaseColumns(product: SupabaseProduct): Record<string, any> {
	return {
		id: product.id,
		name: product.name,
		url: product.url,
		imageurl1: product.imageUrl1, // lowercase in Supabase
		imageurl2: product.imageUrl2, // lowercase in Supabase
		originalprice: product.originalPrice, // lowercase in Supabase
		price: product.price,
		stockstatus: product.stockStatus, // lowercase in Supabase
		description: product.description,
		category: product.category,
		last_synced_at: product.last_synced_at,
		created_at: product.created_at,
		updated_at: product.updated_at,
		is_active: product.is_active,
		sync_source: product.sync_source,
		custom_data: product.custom_data,
	};
}

/**
 * SQL definition for creating the products table in Supabase
 */
export const productsTableSQL = `
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT,
  imageUrl1 TEXT,
  imageUrl2 TEXT,
  originalPrice NUMERIC,
  price NUMERIC,
  stockStatus TEXT,
  description TEXT,
  category TEXT NOT NULL,
  last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  sync_source TEXT,
  custom_data JSONB
);

-- Create index on category for faster filtering
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);

-- Create index on is_active for faster filtering
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
`;

/**
 * Convert a GoogleSheetProduct to a SupabaseProduct
 */
export function convertToSupabaseProduct(product: GoogleSheetProduct, category: string): SupabaseProduct {
	const now = new Date().toISOString();

	return {
		...product,
		category,
		last_synced_at: now,
		created_at: now,
		updated_at: now,
		is_active: true,
		sync_source: "google_sheets",
	};
}
