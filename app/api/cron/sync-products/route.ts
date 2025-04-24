import {NextRequest, NextResponse} from "next/server";
import {syncAllProducts} from "@/lib/sync";

/**
 * API route for scheduled sync of products from Google Sheets to Supabase
 *
 * This endpoint is designed to be called by Vercel Cron Jobs once per day.
 * It syncs all products from all Google Sheets to Supabase.
 *
 * For security, it checks for a secret token in the Authorization header.
 */
export async function GET(request: NextRequest) {
	try {
		// Verify the request is coming from Vercel Cron
		const authHeader = request.headers.get("Authorization");
		const expectedToken = `Bearer ${process.env.CRON_SECRET_TOKEN}`;

		// If no token is set in env, skip auth check in development
		if (process.env.CRON_SECRET_TOKEN && authHeader !== expectedToken) {
			console.error("Unauthorized cron job request");
			return NextResponse.json({error: "Unauthorized"}, {status: 401});
		}

		console.log("Starting scheduled sync of products from Google Sheets to Supabase");

		// Sync all products
		const result = await syncAllProducts();

		console.log("Scheduled sync completed:", result);

		// Return result
		return NextResponse.json(result);
	} catch (error) {
		console.error("Error in scheduled sync:", error);
		return NextResponse.json(
			{
				success: false,
				message: `Failed to sync products: ${error instanceof Error ? error.message : String(error)}`,
			},
			{status: 500}
		);
	}
}

// Define the config for Vercel Cron Job
// This will run once per day at midnight
export const config = {
	runtime: "edge",
	schedule: "0 0 * * *", // Run at midnight every day (cron syntax)
};
