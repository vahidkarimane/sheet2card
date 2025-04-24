#!/usr/bin/env node

// Use ESM syntax for imports
import * as dotenv from "dotenv";
import {fileURLToPath} from "url";
import {dirname, resolve} from "path";
import {createClient} from "@supabase/supabase-js";
import {fetchProductsFromSheet, fetchSheetNames} from "../lib/googleSheets.js";
import {convertToSupabaseProduct, mapToSupabaseColumns} from "../lib/supabase/schema.js";

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env.local
dotenv.config({path: resolve(__dirname, "../.env.local")});

// Check if environment variables are defined
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
	console.error("Missing Supabase credentials. Please check your .env.local file.");
	process.exit(1);
}

// Create a Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Sync result interface
 */
interface SyncResult {
	success: boolean;
	message: string;
	syncedCategories: string[];
	totalProductsSynced: number;
	errors?: any[];
}

/**
 * Sync all products from Google Sheets to Supabase
 */
async function syncAllProducts(): Promise<SyncResult> {
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
async function syncProductsByCategory(category: string): Promise<SyncResult> {
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
		const supabaseProducts = googleSheetProducts.map((product) => convertToSupabaseProduct(product, category));

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
 * Insert or update products in Supabase
 */
async function upsertProducts(products: any[]): Promise<void> {
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
 * Script to manually sync products from Google Sheets to Supabase
 */
async function main() {
	try {
		console.log("Starting manual sync of products from Google Sheets to Supabase...");

		// Sync all products
		const result = await syncAllProducts();

		console.log("Sync completed with result:", result);

		if (result.success) {
			console.log(
				`Successfully synced ${result.totalProductsSynced} products from ${result.syncedCategories.length} categories`
			);
		} else {
			console.error("Sync completed with errors:", result.errors);
		}
	} catch (error) {
		console.error("Error during sync:", error);
		process.exit(1);
	}
}

// Run the sync
main().catch(console.error);
