import {NextResponse} from "next/server";
import {fetchProductsFromSheet, fetchSheetNames} from "@/lib/googleSheets";

export async function GET(request: Request) {
	try {
		// Get sheet name from query parameter
		const url = new URL(request.url);
		const sheetName = url.searchParams.get("sheet");

		// Fetch sheet names for the tabs
		const sheetNames = await fetchSheetNames();

		// Fetch products from the specified sheet or default
		const products = await fetchProductsFromSheet(sheetName || undefined);

		return NextResponse.json({
			products,
			sheetNames,
			currentSheet: sheetName || sheetNames[0],
		});
	} catch (error) {
		console.error("Error in products API route:", error);
		return NextResponse.json({error: "Failed to fetch products"}, {status: 500});
	}
}
