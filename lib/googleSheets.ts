import {google} from "googleapis";
import path from "path";

// Define the interface for our application's Product structure
export interface Product {
	id: string;
	name: string;
	url: string;
	imageUrl1: string;
	imageUrl2: string;
	originalPrice: number;
	price: number;
	stockStatus: string;
	description?: string;
}

// Configuration for Google Sheets API
const SHEET_ID = process.env.GOOGLE_SHEET_ID || "1iIbGhOmpyNSLK1WRZPK6dql0P5hg6gILWC8aJyVGcZE";
const DEFAULT_SHEET = "fillerProducts";

// Create auth client using the service account credentials
const auth = new google.auth.GoogleAuth({
	keyFile: path.join(process.cwd(), "google.json"),
	scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
});

/**
 * Convert a row from Google Sheets to our Product interface
 */
function convertRowToProduct(row: string[]): Product {
	// Based on the screenshot, the columns are:
	// A: ProductID, B: ProductName, C: ProductURL, D: ImageURL1, E: ImageURL2,
	// F: OriginalPrice, G: CurrentPrice, H: StockStatus
	return {
		id: row[0] || "", // ProductID
		name: row[1] || "", // ProductName
		url: row[2] || "", // ProductURL
		imageUrl1: row[3] || "", // ImageURL1
		imageUrl2: row[4] || "", // ImageURL2
		originalPrice: parseInt(row[5]) || 0, // OriginalPrice
		price: parseInt(row[6]) || 0, // CurrentPrice
		stockStatus: row[7] || "", // StockStatus
		description: row[1] ? `${row[1]}` : "", // Using product name as description
	};
}

/**
 * Fetch all sheet names from the Google Sheet
 */
export async function fetchSheetNames(): Promise<string[]> {
	try {
		// Create sheets client with auth
		const sheets = google.sheets({
			version: "v4",
			auth: auth,
		});

		// Fetch spreadsheet metadata
		const response = await sheets.spreadsheets.get({
			spreadsheetId: SHEET_ID,
		});

		// Extract sheet names
		const sheetNames =
			response.data.sheets?.map((sheet) => sheet.properties?.title || "").filter((name) => name !== "") || [];

		return sheetNames;
	} catch (error) {
		console.error("Error fetching sheet names:", error);
		// Return mock data as fallback
		return ["fillerProducts", "mesoProducts", "mesoGelProducts", "nakhProducts"];
	}
}

/**
 * Fetch products from a specific sheet
 */
export async function fetchProductsFromSheet(sheetName: string = DEFAULT_SHEET): Promise<Product[]> {
	try {
		// Create sheets client with auth
		const sheets = google.sheets({
			version: "v4",
			auth: auth,
		});

		// Fetch data from the specified sheet
		const range = `${sheetName}!A2:H`;
		const response = await sheets.spreadsheets.values.get({
			spreadsheetId: SHEET_ID,
			range: range,
		});

		const rows = response.data.values;

		if (!rows || rows.length === 0) {
			console.log(`No data found in the sheet: ${sheetName}`);
			return [];
		}

		// Convert rows to Product objects
		return rows.map(convertRowToProduct);
	} catch (error) {
		console.error("Error fetching data from Google Sheet:", error);
		// Return mock data as fallback
		return [
			{
				id: "P001",
				name: "Fallback Laptop",
				url: "#",
				imageUrl1: "",
				imageUrl2: "",
				originalPrice: 1299.99,
				price: 999.99,
				stockStatus: "In Stock",
				description: "High performance laptop",
			},
			{
				id: "P002",
				name: "Fallback Smartphone",
				url: "#",
				imageUrl1: "",
				imageUrl2: "",
				originalPrice: 799.99,
				price: 699.99,
				stockStatus: "In Stock",
				description: "Latest smartphone",
			},
		];
	}
}
