"use client";

import {useState, useEffect} from "react";
import {Button} from "@/components/ui/button";
import {Card} from "@/components/ui/card";
import {Input} from "@/components/ui/input";
import {Product as GoogleSheetProduct} from "@/lib/googleSheets";

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

	// Function to fetch products from API
	const fetchProducts = async (sheetName?: string) => {
		try {
			setLoading(true);
			const url = sheetName ? `/api/products?sheet=${encodeURIComponent(sheetName)}` : "/api/products";

			const response = await fetch(url);

			if (!response.ok) {
				throw new Error(`Error: ${response.status}`);
			}

			const data = await response.json();
			setProducts(data.products);
			setSheetNames(data.sheetNames || []);
			setCurrentSheet(data.currentSheet || "");
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
		fetchProducts();
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
			<h1 className='text-2xl font-bold mb-4'>Products</h1>

			{/* Category Tabs */}
			<div className='flex overflow-x-auto mb-6 pb-2'>
				{sheetNames.map((sheet) => (
					<button
						key={sheet}
						onClick={() => fetchProducts(sheet)}
						className={`px-4 py-2 mr-2 whitespace-nowrap rounded-md ${
							currentSheet === sheet ? "bg-blue-600 text-white" : "bg-gray-200 hover:bg-gray-300"
						}`}
					>
						{sheet}
					</button>
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
