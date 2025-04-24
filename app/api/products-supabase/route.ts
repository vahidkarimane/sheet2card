import {NextRequest, NextResponse} from "next/server";
import {fetchAllProducts, fetchProductsByCategory, fetchCategories} from "@/lib/supabase";
import {fetchProductsFromSheet, fetchSheetNames} from "@/lib/googleSheets";

/**
 * API route for fetching products from Supabase
 *
 * This endpoint fetches products from Supabase with a fallback to Google Sheets
 * if the Supabase fetch fails.
 *
 * Query parameters:
 * - category: Optional. If provided, only fetch products for this category.
 */
export async function GET(request: NextRequest) {
	try {
		// Get category from query parameter
		const url = new URL(request.url);
		const category = url.searchParams.get("category");

		// Try to fetch from Supabase first
		try {
			// Fetch categories (sheet names)
			const categories = await fetchCategories();

			// Fetch products based on category
			const products = category ? await fetchProductsByCategory(category) : await fetchAllProducts();

			return NextResponse.json({
				products,
				sheetNames: categories,
				currentSheet: category || categories[0],
				source: "supabase",
			});
		} catch (supabaseError) {
			console.error("Error fetching from Supabase, falling back to Google Sheets:", supabaseError);

			// Fallback to Google Sheets
			// Fetch sheet names for the tabs
			const sheetNames = await fetchSheetNames();

			// Fetch products from the specified sheet or default
			const products = await fetchProductsFromSheet(category || undefined);

			return NextResponse.json({
				products,
				sheetNames,
				currentSheet: category || sheetNames[0],
				source: "google_sheets",
				fallbackReason: supabaseError instanceof Error ? supabaseError.message : String(supabaseError),
			});
		}
	} catch (error) {
		console.error("Error in products-supabase API route:", error);
		return NextResponse.json({error: "Failed to fetch products"}, {status: 500});
	}
}
