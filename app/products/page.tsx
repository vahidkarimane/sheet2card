"use client";

import {useState, useEffect} from "react";
import {Tabs, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle} from "@/components/ui/sheet";
import {Button} from "@/components/ui/button";
import {Card} from "@/components/ui/card";
import {Input} from "@/components/ui/input";
import {useUser} from "@clerk/nextjs";
import {Product as GoogleSheetProduct} from "@/lib/googleSheets";

// Util ----------------------------------------------------------------------------------
function normalizeProduct(product: any): GoogleSheetProduct {
	return {
		id: product.id,
		name: product.name,
		url: product.url || "",
		imageUrl1: product.imageurl1 || product.imageUrl1 || "",
		imageUrl2: product.imageurl2 || product.imageUrl2 || "",
		originalPrice: product.originalprice || product.originalPrice || 0,
		price: product.price || 0,
		stockStatus: product.stockstatus || product.stockStatus || "Unknown",
		description: product.description || "",
	};
}

interface CartItem extends GoogleSheetProduct {
	quantity: number;
}

const formatIranianRial = (price: number) => price.toLocaleString();

//----------------------------------------------------------------------------------------
export default function ProductsPage() {
	// Auth -------------------------------------------------------------------------------
	const {isSignedIn, user} = useUser();

	// State ------------------------------------------------------------------------------
	const [products, setProducts] = useState<GoogleSheetProduct[]>([]);
	const [cart, setCart] = useState<CartItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [sheetNames, setSheetNames] = useState<string[]>([]);
	const [currentSheet, setCurrentSheet] = useState<string>("");
	const [phoneNumber, setPhoneNumber] = useState("");
	const [phoneNumberError, setPhoneNumberError] = useState<string | null>(null);
	const [dataSource, setDataSource] = useState("loading");

	// Cache ------------------------------------------------------------------------------
	interface CachedProducts {
		products: GoogleSheetProduct[];
		timestamp: number;
	}
	const CACHE_EXPIRATION_TIME = 5 * 60 * 1000;
	const [productsCache, setProductsCache] = useState<Record<string, CachedProducts>>({});

	const validatePhoneNumber = (number: string) => /^09\d{9}$/.test(number);
	const isCacheExpired = (ts: number) => Date.now() - ts > CACHE_EXPIRATION_TIME;

	// Fetch ------------------------------------------------------------------------------
	const fetchProducts = async (sheet?: string) => {
		try {
			const category = sheet || sheetNames[0] || "";
			if (category && productsCache[category] && !isCacheExpired(productsCache[category].timestamp)) {
				setProducts(productsCache[category].products);
				setCurrentSheet(category);
				setLoading(false);
				return;
			}
			setLoading(true);
			const url = sheet ? `/api/products-supabase?category=${encodeURIComponent(sheet)}` : "/api/products-supabase";
			const res = await fetch(url);
			if (!res.ok) throw new Error("Network");
			const data = await res.json();
			const normalized = data.products.map(normalizeProduct);
			setProducts(normalized);
			setSheetNames(data.sheetNames || []);
			setCurrentSheet(data.currentSheet || "");
			setDataSource(data.source || "supabase");
			setProductsCache((prev) => ({
				...prev,
				[data.currentSheet]: {products: normalized, timestamp: Date.now()},
			}));
			setError(null);
		} catch (e) {
			console.error(e);
			setError("Failed to load products");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchProducts();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// Cart -------------------------------------------------------------------------------
	const addToCart = (product: GoogleSheetProduct, qty: number) => {
		if (!qty || qty < 1) return;
		setCart((prev) => {
			const exists = prev.find((i) => i.id === product.id);
			return exists
				? prev.map((i) => (i.id === product.id ? {...i, quantity: i.quantity + qty} : i))
				: [...prev, {...product, quantity: qty}];
		});
	};

	const submitOrder = async () => {
		if (!validatePhoneNumber(phoneNumber)) return setPhoneNumberError("Enter a valid Persian mobile (09XXXXXXXXX)");
		if (cart.length === 0) return alert("Cart empty");
		try {
			const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);
			const res = await fetch("/api/telegram", {
				method: "POST",
				headers: {"Content-Type": "application/json"},
				body: JSON.stringify({
					cart,
					total,
					phoneNumber,
					email: isSignedIn ? user.emailAddresses[0].emailAddress : "anonymous",
				}),
			});
			const r = await res.json();
			if (r.success) {
				alert("Order submitted 👍🏻");
				setCart([]);
				setPhoneNumber("");
			} else {
				alert("Order sent but notification failed");
			}
		} catch (e) {
			alert("Order failed, try again");
		}
	};

	// UI ---------------------------------------------------------------------------------
	if (loading) return <p className='text-center py-20'>Loading…</p>;
	if (error) return <p className='text-center py-20 text-red-500'>{error}</p>;

	return (
		<div className='mx-auto w-full max-w-screen-xl px-4 pb-32'>
			{/* Sticky header */}
			<div className='sticky top-0 z-30 flex items-center justify-between bg-white/80 backdrop-blur py-2'>
				<h1 className='text-lg font-bold md:text-2xl'>Products</h1>
				<Sheet>
					<SheetTrigger asChild>
						<Button variant='outline' size='sm' className='relative'>
							سبد خرید
							{cart.length > 0 && (
								<span className='absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-xs text-white'>
									{cart.reduce((s, i) => s + i.quantity, 0)}
								</span>
							)}
						</Button>
					</SheetTrigger>
					<SheetContent side='bottom' className='max-h-[80vh] overflow-y-auto p-4'>
						<SheetHeader>
							<SheetTitle>Your Cart</SheetTitle>
						</SheetHeader>
						{cart.length === 0 ? (
							<p className='py-6 text-center text-sm text-gray-500'>Your cart is empty</p>
						) : (
							<>
								<ul className='space-y-2 py-4'>
									{cart.map((item) => (
										<li key={item.id} className='flex justify-between text-sm'>
											<span>
												{item.name} × {item.quantity}
											</span>
											<span>{formatIranianRial(item.price * item.quantity)} ﷼</span>
										</li>
									))}
								</ul>
								<p className='mb-4 text-right font-semibold'>
									Total: {formatIranianRial(cart.reduce((t, i) => t + i.price * i.quantity, 0))} ﷼
								</p>
								<div className='flex items-center gap-2'>
									<Input
										placeholder='09XXXXXXXXX'
										value={phoneNumber}
										onChange={(e) => {
											setPhoneNumber(e.target.value);
											setPhoneNumberError(null);
										}}
									/>
									<Button onClick={submitOrder}>Submit</Button>
								</div>
								{phoneNumberError && <p className='mt-1 text-sm text-red-500'>{phoneNumberError}</p>}
							</>
						)}
					</SheetContent>
				</Sheet>
			</div>

			{/* Category tabs */}
			{sheetNames.length > 0 && (
				<Tabs value={currentSheet} onValueChange={(v) => fetchProducts(v)} className='w-full'>
					<TabsList className='no-scrollbar mt-2 flex w-full overflow-x-auto'>
						{/* no-scrollbar is a custom util */}
						{sheetNames.map((s) => (
							<TabsTrigger
								key={s}
								value={s}
								className='flex-none whitespace-nowrap px-4 py-2 text-sm md:text-base'
							>
								{s}
							</TabsTrigger>
						))}
					</TabsList>
				</Tabs>
			)}

			{/* Product grid */}
			<div className='mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
				{products.map((p) => (
					<Card key={p.id} className='flex flex-col'>
						{p.imageUrl1 && (
							<img src={p.imageUrl1} alt={p.name} className='aspect-square w-full rounded-t-lg object-cover' />
						)}
						<div className='flex flex-1 flex-col p-4'>
							<h2 className='text-base font-semibold md:text-lg'>{p.name}</h2>
							<p className='mt-1 line-clamp-2 text-sm text-gray-500'>{p.description}</p>
							<div className='mt-2 flex items-center gap-2'>
								{p.originalPrice > p.price && (
									<span className='text-sm text-gray-400 line-through'>
										﷼ {formatIranianRial(p.originalPrice)}
									</span>
								)}
								<span className='text-lg font-bold'>﷼ {formatIranianRial(p.price)}</span>
							</div>
							<p
								className={`mt-1 text-xs ${
									p.stockStatus === "In Stock" ? "text-green-600" : "text-orange-500"
								}`}
							>
								{p.stockStatus}
							</p>
							{/* Add to cart */}
							<div className='mt-auto flex items-end gap-2 pt-4'>
								<Input type='number' min={1} defaultValue={1} className='h-9 w-20' id={`qty-${p.id}`} />
								<Button
									size='sm'
									onClick={() => {
										const qty = parseInt((document.getElementById(`qty-${p.id}`) as HTMLInputElement).value);
										addToCart(p, qty);
									}}
								>
									Add
								</Button>
							</div>
						</div>
					</Card>
				))}
			</div>
		</div>
	);
}

// Tailwind utility for hiding scrollbar (globals.css)
/*
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
*/
