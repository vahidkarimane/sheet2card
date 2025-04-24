import {NextRequest, NextResponse} from "next/server";
import {syncAllProducts, syncProductsByCategory} from "@/lib/sync";
import {getAuth} from "@clerk/nextjs/server";

/**
 * API route for manually syncing products from Google Sheets to Supabase
 *
 * This endpoint can be called to trigger a sync operation.
 * It supports syncing all products or a specific category.
 *
 * Query parameters:
 * - category: Optional. If provided, only sync products for this category.
 * - key: Optional. API key for authentication when called from external services.
 */
export async function POST(request: NextRequest) {
	try {
		// Basic authentication check
		// For Clerk authentication
		const {userId} = getAuth(request);

		// For API key authentication (for cron jobs)
		const url = new URL(request.url);
		const apiKey = url.searchParams.get("key");
		const validApiKey = process.env.SYNC_API_KEY;

		// Check if user is authenticated or valid API key is provided
		if (!userId && (!apiKey || apiKey !== validApiKey)) {
			return NextResponse.json({error: "Unauthorized"}, {status: 401});
		}

		// Get category from query parameter
		const category = url.searchParams.get("category");

		// Sync products
		const result = category ? await syncProductsByCategory(category) : await syncAllProducts();

		// Return result
		return NextResponse.json(result);
	} catch (error) {
		console.error("Error in sync-products API route:", error);
		return NextResponse.json(
			{
				success: false,
				message: `Failed to sync products: ${error instanceof Error ? error.message : String(error)}`,
			},
			{status: 500}
		);
	}
}

/**
 * GET method for checking sync status or triggering a sync
 */
export async function GET(request: NextRequest) {
	// For simplicity, we'll just redirect to the POST handler
	// In a real-world scenario, you might want to implement a separate
	// endpoint for checking sync status
	return POST(request);
}
