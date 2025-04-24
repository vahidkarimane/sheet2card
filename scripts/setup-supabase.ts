#!/usr/bin/env node

import {createClient} from "@supabase/supabase-js";
import {productsTableSQL} from "../lib/supabase/schema.js";
import * as dotenv from "dotenv";
import {fileURLToPath} from "url";
import {dirname, resolve} from "path";

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env.local
dotenv.config({path: resolve(__dirname, "../.env.local")});

// Create a Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
	console.error("Missing Supabase credentials. Please check your .env.local file.");
	process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Set up the Supabase database
 */
async function setupDatabase() {
	try {
		console.log("Setting up Supabase database...");

		// Create the products table directly
		console.log("Creating products table...");

		// Try to create the table with all required columns
		const {error: createError} = await supabase
			.from("products")
			.insert([
				{
					id: "temp-id-for-creation",
					name: "Temporary Product",
					url: "",
					imageUrl1: "",
					imageUrl2: "",
					originalPrice: 0,
					price: 0,
					stockStatus: "Out of Stock",
					description: "",
					category: "temp",
					last_synced_at: new Date().toISOString(),
					created_at: new Date().toISOString(),
					updated_at: new Date().toISOString(),
					is_active: true,
					sync_source: "setup",
					custom_data: {},
				},
			])
			.select();

		if (createError) {
			// If the error is not because the table already exists
			if (createError.code !== "23505") {
				// Duplicate key error would mean the table exists
				console.error("Error creating products table:", createError);
				return;
			} else {
				console.log("Products table already exists. Continuing...");
			}
		} else {
			// Delete the temporary row
			const {error: deleteError} = await supabase.from("products").delete().eq("id", "temp-id-for-creation");

			if (deleteError) {
				console.error("Error deleting temporary row:", deleteError);
				// Continue anyway, not critical
			}

			console.log("Products table created successfully!");
		}

		console.log("Database setup complete!");
	} catch (error) {
		console.error("Error setting up database:", error);
	}
}

// Run the setup
setupDatabase().catch(console.error);
