"use client";

import {useState, useEffect} from "react";
import {Button} from "@/components/ui/button";
import {Card} from "@/components/ui/card";
import {Input} from "@/components/ui/input";
import {Product as GoogleSheetProduct} from "@/lib/googleSheets";

// Function to normalize product data from Supabase to match GoogleSheetProduct interface
function normalizeProduct(product: any): GoogleSheetProduct {
	return {
		id: product.id,
		name: product.name,
		url: product.url || "",
		imageUrl1: product.imageurl1 || product.imageUrl1 || "", // Handle both column name formats
		imageUrl2: product.imageurl2 || product.imageUrl2 || "", // Handle both column name formats
		originalPrice: product.originalprice || product.originalPrice || 0, // Handle both column name formats
		price: product.price || 0,
		stockStatus: product.stockstatus || product.stockStatus || "Unknown", // Handle both column name formats
		description: product.description || "",
	};
}

// Local interface for cart items
interface CartItem extends GoogleSheetProduct {
	quantity: number;
}

// Format price in Iranian Rial
function formatIranianRial(price: number): string {
	// Format with thousand separators
	return price.toLocaleString();
}

export default function ProductsPage() {
	const [products, setProducts] = useState<GoogleSheetProduct[]>([]);
	const [cart, setCart] = useState<CartItem[]>([]);
	const [loading, setLoading] = useState<boolean>(true);
	const [error, setError] = useState<string | null>(null);
	const [sheetNames, setSheetNames] = useState<string[]>([]);
	const [currentSheet, setCurrentSheet] = useState<string>("");

	// State to track data source (Supabase or Google Sheets)
	const [dataSource, setDataSource] = useState<string>("loading");

	// State to track if data is from cache and when it expires
	const [isFromCache, setIsFromCache] = useState<boolean>(false);
	const [cacheExpiresIn, setCacheExpiresIn] = useState<number | null>(null);

	// Interface for cached products with timestamp
	interface CachedProducts {
		products: GoogleSheetProduct[];
		timestamp: number;
	}

	// Cache expiration time in milliseconds (5 minutes)
	const CACHE_EXPIRATION_TIME = 5 * 60 * 1000;

	// Cache for storing products by category with timestamp
	const [productsCache, setProductsCache] = useState<Record<string, CachedProducts>>({});

	// Function to clear cache for a specific category
	const clearCacheForCategory = (category: string) => {
		setProductsCache((prevCache) => {
			const newCache = {...prevCache};
			delete newCache[category];
			return newCache;
		});
		// Refetch products for this category
		fetchProducts(category);
	};

	// Function to clear all caches
	const clearAllCaches = () => {
		setProductsCache({});
		// Refetch current category
		fetchProducts(currentSheet);
	};

	// Function to check if cache is expired
	const isCacheExpired = (timestamp: number): boolean => {
		const now = Date.now();
		return now - timestamp > CACHE_EXPIRATION_TIME;
	};

	// Function to fetch products from API
	const fetchProducts = async (sheetName?: string) => {
		try {
			// Determine which category to fetch
			const categoryToFetch = sheetName || (sheetNames.length > 0 ? sheetNames[0] : "");

			// Check if we have this category in cache and it's not expired
			if (categoryToFetch && productsCache[categoryToFetch]) {
				const cachedData = productsCache[categoryToFetch];

				// Check if cache is expired
				if (!isCacheExpired(cachedData.timestamp)) {
					console.log(`Using cached products for category: ${categoryToFetch}`);
					setProducts(cachedData.products);
					setCurrentSheet(categoryToFetch);
					setError(null);
					setLoading(false);
					setIsFromCache(true);

					// Calculate and set cache expiration time
					const expiresIn = Math.round((cachedData.timestamp + CACHE_EXPIRATION_TIME - Date.now()) / 1000);
					setCacheExpiresIn(expiresIn > 0 ? expiresIn : 0);

					// Set up a timer to update the expiration countdown
					const timerId = setInterval(() => {
						setCacheExpiresIn((prev) => {
							if (prev === null || prev <= 1) {
								clearInterval(timerId);
								return 0;
							}
							return prev - 1;
						});
					}, 1000);

					// Store the timer ID for cleanup
					const currentTimerId = timerId;

					// Clean up the timer when component unmounts or when category changes
					return () => {
						clearInterval(currentTimerId);
					};

					return;
				} else {
					console.log(`Cache expired for category: ${categoryToFetch}, fetching fresh data`);
				}
			}

			// If not in cache, proceed with API call
			setLoading(true);
			const url = sheetName
				? `/api/products-supabase?category=${encodeURIComponent(sheetName)}`
				: "/api/products-supabase";

			const response = await fetch(url);

			if (!response.ok) {
				throw new Error(`Error: ${response.status}`);
			}

			const data = await response.json();

			// Normalize products from Supabase to match GoogleSheetProduct interface
			const normalizedProducts = data.products.map(normalizeProduct);

			// Store in cache with timestamp
			if (data.currentSheet) {
				setProductsCache((prevCache) => ({
					...prevCache,
					[data.currentSheet]: {
						products: normalizedProducts,
						timestamp: Date.now(),
					},
				}));
			}

			setProducts(normalizedProducts);
			setSheetNames(data.sheetNames || []);
			setCurrentSheet(data.currentSheet || "");
			setDataSource(data.source || "supabase");
			setIsFromCache(false);
			setCacheExpiresIn(null);
			setError(null);
		} catch (err) {
			console.error("Failed to fetch products:", err);
			setError("Failed to load products. Please try again later.");
			// Fallback to mock data if API fails
			setProducts([
				{
					id: "1",
					name: "Laptop",
					url: "#",
					imageUrl1: "",
					imageUrl2: "",
					originalPrice: 1299.99,
					price: 999.99,
					stockStatus: "In Stock",
					description: "High performance laptop",
				},
				{
					id: "2",
					name: "Smartphone",
					url: "#",
					imageUrl1: "",
					imageUrl2: "",
					originalPrice: 799.99,
					price: 699.99,
					stockStatus: "In Stock",
					description: "Latest smartphone",
				},
				{
					id: "3",
					name: "Headphones",
					url: "#",
					imageUrl1: "",
					imageUrl2: "",
					originalPrice: 249.99,
					price: 199.99,
					stockStatus: "Low Stock",
					description: "Wireless headphones",
				},
			]);
		} finally {
			setLoading(false);
		}
	};

	// Fetch products on component mount
	useEffect(() => {
		const fetchResult = fetchProducts();

		// Clean up any timers when component unmounts
		return () => {
			if (fetchResult && typeof fetchResult.then === "function") {
				fetchResult.catch(console.error);
			}
		};
	}, []);

	const addToCart = (product: GoogleSheetProduct, quantity: number) => {
		setCart((prevCart) => {
			const existingItem = prevCart.find((item) => item.id === product.id);
			if (existingItem) {
				return prevCart.map((item) =>
					item.id === product.id ? {...item, quantity: item.quantity + quantity} : item
				);
			}
			return [...prevCart, {...product, quantity}];
		});
	};

	const submitOrder = () => {
		if (cart.length === 0) {
			alert("Your cart is empty!");
			return;
		}

		// Here you would typically make an API call to submit the order
		console.log("Order submitted:", cart);
		alert("Order submitted successfully!");
		setCart([]);
	};

	if (loading) {
		return (
			<div className='container mx-auto p-4 text-center'>
				<p className='text-xl'>Loading products...</p>
			</div>
		);
	}

	if (error) {
		return (
			<div className='container mx-auto p-4'>
				<div className='bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative' role='alert'>
					<strong className='font-bold'>Error!</strong>
					<span className='block sm:inline'> {error}</span>
				</div>
			</div>
		);
	}

	return (
		<div className='container mx-auto p-4'>
			<div className='flex justify-between items-center mb-4'>
				<h1 className='text-2xl font-bold'>Products</h1>
				<div className='flex items-center gap-2'>
					<div className='text-sm px-3 py-1 rounded-full bg-gray-100'>
						Data source:{" "}
						{dataSource === "supabase" ? (
							<span className='text-green-600 font-medium'>Supabase</span>
						) : dataSource === "google_sheets" ? (
							<span className='text-blue-600 font-medium'>Google Sheets (Fallback)</span>
						) : (
							<span className='text-gray-600'>Loading...</span>
						)}
					</div>
					{isFromCache && (
						<div className='text-sm px-3 py-1 rounded-full bg-yellow-100 text-yellow-800 font-medium'>
							Cached {cacheExpiresIn !== null && `(expires in ${cacheExpiresIn}s)`}
						</div>
					)}
					{Object.keys(productsCache).length > 0 && (
						<button
							onClick={clearAllCaches}
							className='text-sm px-3 py-1 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-700'
							title='Clear all cached data'
						>
							Clear All Cache
						</button>
					)}
				</div>
			</div>

			{/* Category Tabs */}
			<div className='flex overflow-x-auto mb-6 pb-2'>
				{sheetNames.map((sheet) => (
					<div key={sheet} className='flex items-center mr-2'>
						<button
							onClick={() => fetchProducts(sheet)}
							className={`px-4 py-2 whitespace-nowrap rounded-l-md ${
								currentSheet === sheet ? "bg-blue-600 text-white" : "bg-gray-200 hover:bg-gray-300"
							}`}
						>
							{sheet}
						</button>
						{productsCache[sheet] && (
							<button
								onClick={(e) => {
									e.stopPropagation();
									clearCacheForCategory(sheet);
								}}
								className='px-2 py-2 bg-gray-200 hover:bg-gray-300 rounded-r-md'
								title='Refresh data'
							>
								↻
							</button>
						)}
					</div>
				))}
			</div>

			<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
				{products.map((product) => (
					<Card key={product.id} className='p-4'>
						{product.imageUrl1 && (
							<div className='mb-4'>
								<img src={product.imageUrl1} alt={product.name} className='w-full h-48 object-cover rounded' />
							</div>
						)}
						<h2 className='text-xl font-semibold'>{product.name}</h2>
						<p className='text-gray-600'>{product.description}</p>
						<div className='mt-2'>
							{product.originalPrice > product.price ? (
								<div className='flex items-center gap-2'>
									<span className='text-gray-500 line-through'>
										﷼ {formatIranianRial(product.originalPrice)}
									</span>
									<span className='text-lg font-bold text-red-600'>﷼ {formatIranianRial(product.price)}</span>
								</div>
							) : (
								<p className='text-lg font-bold'>﷼ {formatIranianRial(product.price)}</p>
							)}
						</div>
						<p
							className={`text-sm mt-1 ${
								product.stockStatus === "In Stock" ? "text-green-600" : "text-orange-500"
							}`}
						>
							{product.stockStatus}
						</p>
						<div className='mt-4 flex gap-2'>
							<Input type='number' min='1' defaultValue='1' className='w-20' id={`quantity-${product.id}`} />
							<Button
								onClick={() => {
									const quantity = parseInt(
										(document.getElementById(`quantity-${product.id}`) as HTMLInputElement).value
									);
									addToCart(product, quantity);
								}}
							>
								Add to Cart
							</Button>
						</div>
					</Card>
				))}
			</div>

			<div className='mt-8'>
				<h2 className='text-xl font-bold mb-4'>Shopping Cart</h2>
				{cart.length === 0 ? (
					<p>Your cart is empty</p>
				) : (
					<>
						<ul className='space-y-2'>
							{cart.map((item) => (
								<li key={item.id} className='border-b pb-2'>
									{item.name} - Quantity: {item.quantity} - Total:{" "}
									{formatIranianRial(item.price * item.quantity)}
								</li>
							))}
						</ul>
						<div className='mt-4'>
							<p className='text-xl font-bold'>
								Total: {formatIranianRial(cart.reduce((total, item) => total + item.price * item.quantity, 0))}{" "}
								﷼
							</p>
							<Button onClick={submitOrder} className='mt-4'>
								Submit Order
							</Button>
						</div>
					</>
				)}
			</div>
		</div>
	);
}
