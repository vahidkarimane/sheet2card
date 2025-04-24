import {fetchProductsFromSheet, fetchSheetNames} from "@/lib/googleSheets";
import {upsertProducts, markProductsAsInactive} from "@/lib/supabase";
import {convertToSupabaseProduct} from "@/lib/supabase/schema";
import {SupabaseProduct} from "@/lib/supabase/schema";

/**
 * Sync result interface
 */
export interface SyncResult {
	success: boolean;
	message: string;
	syncedCategories: string[];
	totalProductsSynced: number;
	errors?: any[];
}

/**
 * Sync all products from Google Sheets to Supabase
 */
export async function syncAllProducts(): Promise<SyncResult> {
	try {
		// Get all sheet names (categories)
		const sheetNames = await fetchSheetNames();

		let totalProductsSynced = 0;
		const errors: any[] = [];

		// Sync each sheet (category)
		for (const sheetName of sheetNames) {
			try {
				const result = await syncProductsByCategory(sheetName);
				totalProductsSynced += result.totalProductsSynced;
			} catch (error) {
				console.error(`Error syncing category ${sheetName}:`, error);
				errors.push({
					category: sheetName,
					error: error instanceof Error ? error.message : String(error),
				});
			}
		}

		return {
			success: errors.length === 0,
			message:
				errors.length === 0
					? `Successfully synced ${totalProductsSynced} products from ${sheetNames.length} categories`
					: `Synced with some errors: ${errors.length} categories failed`,
			syncedCategories: sheetNames.filter((name) => !errors.some((e) => e.category === name)),
			totalProductsSynced,
			errors: errors.length > 0 ? errors : undefined,
		};
	} catch (error) {
		console.error("Error in syncAllProducts:", error);
		return {
			success: false,
			message: `Failed to sync products: ${error instanceof Error ? error.message : String(error)}`,
			syncedCategories: [],
			totalProductsSynced: 0,
			errors: [error],
		};
	}
}

/**
 * Sync products for a specific category from Google Sheets to Supabase
 */
export async function syncProductsByCategory(category: string): Promise<SyncResult> {
	try {
		console.log(`Starting sync for category: ${category}`);

		// Fetch products from Google Sheets
		const googleSheetProducts = await fetchProductsFromSheet(category);

		if (!googleSheetProducts || googleSheetProducts.length === 0) {
			return {
				success: true,
				message: `No products found in Google Sheets for category: ${category}`,
				syncedCategories: [category],
				totalProductsSynced: 0,
			};
		}

		// Convert Google Sheet products to Supabase products
		const supabaseProducts: SupabaseProduct[] = googleSheetProducts.map((product) =>
			convertToSupabaseProduct(product, category)
		);

		// Upsert products to Supabase
		await upsertProducts(supabaseProducts);

		console.log(`Successfully synced ${supabaseProducts.length} products for category: ${category}`);

		return {
			success: true,
			message: `Successfully synced ${supabaseProducts.length} products for category: ${category}`,
			syncedCategories: [category],
			totalProductsSynced: supabaseProducts.length,
		};
	} catch (error) {
		console.error(`Error syncing products for category ${category}:`, error);
		throw error;
	}
}

/**
 * Handle products that exist in Supabase but no longer exist in Google Sheets
 * This function can either delete them or mark them as inactive
 */
export async function handleRemovedProducts(
	googleSheetProductIds: string[],
	category: string,
	action: "delete" | "mark_inactive" = "mark_inactive"
): Promise<void> {
	try {
		// This would require fetching all products from Supabase for the category
		// and comparing with the Google Sheets products
		// For now, we'll just mark products as inactive if they're not in the Google Sheets
		if (action === "mark_inactive") {
			await markProductsAsInactive(googleSheetProductIds);
		} else {
			// Implementation for delete would go here
			// await deleteProducts(googleSheetProductIds);
		}
	} catch (error) {
		console.error(`Error handling removed products for category ${category}:`, error);
		throw error;
	}
}
