import {createClient} from "@supabase/supabase-js";
import {SupabaseProduct, mapToSupabaseColumns} from "./schema";
import {Product as GoogleSheetProduct} from "../googleSheets.js";

// Create a Supabase client for server-side operations
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

/**
 * Fetch all products from Supabase
 */
export async function fetchAllProducts(): Promise<SupabaseProduct[]> {
	try {
		const {data, error} = await supabase.from("products").select("*").eq("is_active", true).order("category");

		if (error) {
			console.error("Error fetching products from Supabase:", error);
			throw error;
		}

		return data || [];
	} catch (error) {
		console.error("Failed to fetch products from Supabase:", error);
		throw error;
	}
}

/**
 * Fetch products by category from Supabase
 */
export async function fetchProductsByCategory(category: string): Promise<SupabaseProduct[]> {
	try {
		const {data, error} = await supabase
			.from("products")
			.select("*")
			.eq("category", category)
			.eq("is_active", true)
			.order("name");

		if (error) {
			console.error(`Error fetching products for category ${category}:`, error);
			throw error;
		}

		return data || [];
	} catch (error) {
		console.error(`Failed to fetch products for category ${category}:`, error);
		throw error;
	}
}

/**
 * Fetch all available categories from Supabase
 */
export async function fetchCategories(): Promise<string[]> {
	try {
		const {data, error} = await supabase.from("products").select("category").eq("is_active", true).order("category");

		if (error) {
			console.error("Error fetching categories from Supabase:", error);
			throw error;
		}

		// Extract unique categories
		const categories = [...new Set(data.map((item) => item.category))];
		return categories;
	} catch (error) {
		console.error("Failed to fetch categories from Supabase:", error);
		throw error;
	}
}

/**
 * Insert or update products in Supabase
 */
export async function upsertProducts(products: SupabaseProduct[]): Promise<void> {
	try {
		if (products.length === 0) {
			return;
		}

		// Update the updated_at timestamp for all products
		const now = new Date().toISOString();

		// Filter out duplicate IDs by creating a Map with ID as key
		const uniqueProductsMap = new Map();
		products.forEach((product) => {
			uniqueProductsMap.set(product.id, product);
		});

		// Convert Map back to array and prepare for Supabase
		const uniqueProducts = Array.from(uniqueProductsMap.values());
		const productsWithTimestamp = uniqueProducts.map((product) => {
			const updatedProduct = {
				...product,
				updated_at: now,
				last_synced_at: now,
			};
			// Map to Supabase column names
			return mapToSupabaseColumns(updatedProduct);
		});

		console.log(`Upserting ${productsWithTimestamp.length} unique products to Supabase`);

		// Process in smaller batches to avoid potential issues
		const batchSize = 10;
		for (let i = 0; i < productsWithTimestamp.length; i += batchSize) {
			const batch = productsWithTimestamp.slice(i, i + batchSize);
			const {error} = await supabase.from("products").upsert(batch, {
				onConflict: "id",
				ignoreDuplicates: true, // Changed to true to ignore duplicates
			});

			if (error) {
				console.error(`Error upserting batch ${i / batchSize + 1} to Supabase:`, error);
				throw error;
			}

			console.log(`Successfully upserted batch ${i / batchSize + 1} (${batch.length} products) to Supabase`);
		}

		console.log(`Successfully upserted all ${productsWithTimestamp.length} products to Supabase`);
	} catch (error) {
		console.error("Failed to upsert products to Supabase:", error);
		throw error;
	}
}

/**
 * Delete products from Supabase
 */
export async function deleteProducts(productIds: string[]): Promise<void> {
	try {
		if (productIds.length === 0) {
			return;
		}

		const {error} = await supabase.from("products").delete().in("id", productIds);

		if (error) {
			console.error("Error deleting products from Supabase:", error);
			throw error;
		}

		console.log(`Successfully deleted ${productIds.length} products from Supabase`);
	} catch (error) {
		console.error("Failed to delete products from Supabase:", error);
		throw error;
	}
}

/**
 * Mark products as inactive instead of deleting them
 */
export async function markProductsAsInactive(productIds: string[]): Promise<void> {
	try {
		if (productIds.length === 0) {
			return;
		}

		const {error} = await supabase
			.from("products")
			.update({is_active: false, updated_at: new Date().toISOString()})
			.in("id", productIds);

		if (error) {
			console.error("Error marking products as inactive in Supabase:", error);
			throw error;
		}

		console.log(`Successfully marked ${productIds.length} products as inactive in Supabase`);
	} catch (error) {
		console.error("Failed to mark products as inactive in Supabase:", error);
		throw error;
	}
}

/**
 * Check if the products table exists in Supabase
 */
export async function checkProductsTableExists(): Promise<boolean> {
	try {
		// Try to select a single row from the products table
		const {data, error} = await supabase.from("products").select("id").limit(1);

		// If there's no error, the table exists
		return !error;
	} catch (error) {
		console.error("Error checking if products table exists:", error);
		return false;
	}
}
