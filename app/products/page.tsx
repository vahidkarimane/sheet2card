"use client";

import {useState, useEffect} from "react";
import {useUser} from "@clerk/nextjs";
import {Product as GoogleSheetProduct} from "@/lib/googleSheets";
import {Button} from "@/components/ui/button";
import {Card} from "@/components/ui/card";
import {Input} from "@/components/ui/input";
import {Tabs, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle} from "@/components/ui/sheet";

// ────────────────────────────────────────────────────────────────────────────────
// 🔧 Helpers & Types
// ────────────────────────────────────────────────────────────────────────────────

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

// ⏰ 5‑minute cache
const CACHE_MS = 5 * 60 * 1_000;

// ────────────────────────────────────────────────────────────────────────────────
// 📦 Component
// ────────────────────────────────────────────────────────────────────────────────
export default function ProductsPage() {
	const {isSignedIn, user} = useUser();

	const [products, setProducts] = useState<GoogleSheetProduct[]>([]);
	const [sheetNames, setSheetNames] = useState<string[]>([]);
	const [currentSheet, setCurrentSheet] = useState<string>("");

	const [cart, setCart] = useState<CartItem[]>([]);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const [phoneNumber, setPhoneNumber] = useState("");
	const [phoneNumberError, setPhoneNumberError] = useState<string | null>(null);

	const validatePhone = (num: string) => /^09\d{9}$/.test(num);

	interface Cached {
		products: GoogleSheetProduct[];
		ts: number;
	}
	const [cache, setCache] = useState<Record<string, Cached>>({});

	const fromCache = (sheet: string) => {
		const c = cache[sheet];
		if (!c) return null;
		return Date.now() - c.ts < CACHE_MS ? c.products : null;
	};

	// ───────────────────── fetch products
	const fetchProducts = async (sheet?: string) => {
		const cat = sheet || sheetNames[0] || "";
		// try cache first
		const cached = fromCache(cat);
		if (cached) {
			setProducts(cached);
			setCurrentSheet(cat);
			return;
		}

		const url = sheet ? `/api/products-supabase?category=${encodeURIComponent(sheet)}` : "/api/products-supabase";
		const res = await fetch(url);
		if (!res.ok) throw new Error("network");
		const data = await res.json();
		const normalised = data.products.map(normalizeProduct);

		setProducts(normalised);
		setSheetNames(data.sheetNames ?? []);
		setCurrentSheet(data.currentSheet ?? "");
		setCache((prev) => ({...prev, [data.currentSheet]: {products: normalised, ts: Date.now()}}));
	};

	// initial load
	useEffect(() => {
		fetchProducts().catch(console.error);
	}, []);

	// ───────────────────── cart helpers
	const addToCart = (product: GoogleSheetProduct, qty: number) => {
		if (!qty) return;
		setCart((old) => {
			const found = old.find((i) => i.id === product.id);
			if (found) return old.map((i) => (i.id === product.id ? {...i, quantity: i.quantity + qty} : i));
			return [...old, {...product, quantity: qty}];
		});
	};

	const cartTotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);

	// ───────────────────── submit order
	const submitOrder = async () => {
		if (cart.length === 0) return;

		if (!validatePhone(phoneNumber)) {
			setPhoneNumberError("Enter Persian mobile like 09XXXXXXXXX");
			return;
		}

		setIsSubmitting(true);
		try {
			const res = await fetch("/api/telegram", {
				method: "POST",
				headers: {"Content-Type": "application/json"},
				body: JSON.stringify({
					cart,
					total: cartTotal,
					phoneNumber,
					email: isSignedIn ? user.emailAddresses[0].emailAddress : "Not signed in",
				}),
			});
			const {success} = await res.json();
			if (success) {
				alert("Order submitted successfully!");
				setCart([]);
				setPhoneNumber("");
			} else {
				alert("Order submitted but notification failed.");
			}
		} catch (e) {
			console.error(e);
			alert("Error submitting order");
		} finally {
			setIsSubmitting(false);
		}
	};

	// ───────────────────── UI
	return (
		<div className='container mx-auto p-4'>
			{/* Top bar */}
			<div className='flex justify-between items-center mb-4'>
				<h1 className='text-2xl font-bold'>Products</h1>
				{/* Cart sheet trigger */}
				<Sheet>
					<SheetTrigger asChild>
						<Button className='transition-transform duration-200 hover:scale-105 active:scale-95 relative'>
							سبد خرید
							{cart.length > 0 && (
								<span className='ml-2 rounded-full bg-red-600 text-white w-6 h-6 flex items-center justify-center text-xs'>
									{cart.length}
								</span>
							)}
						</Button>
					</SheetTrigger>
					<SheetContent side='bottom' className='sm:w-96 p-5'>
						<SheetHeader>
							<SheetTitle>Shopping Cart</SheetTitle>
						</SheetHeader>
						{cart.length === 0 ? (
							<p className='mt-4 text-center'>Cart is empty</p>
						) : (
							<div className='mt-4 space-y-2'>
								{cart.map((i) => (
									<div key={i.id} className='flex justify-between text-sm'>
										<span>
											{i.name} × {i.quantity}
										</span>
										<span>{formatIranianRial(i.price * i.quantity)} ﷼</span>
									</div>
								))}
								<div className='font-semibold flex justify-between border-t pt-2 mt-2'>
									<span>Total</span>
									<span>{formatIranianRial(cartTotal)} ﷼</span>
								</div>

								{/* Phone & submit */}
								<div className='mt-4 flex flex-col gap-2'>
									شماره تماس
									<Input
										placeholder='09XXXXXXXXX'
										value={phoneNumber}
										onChange={(e) => {
											setPhoneNumber(e.target.value);
											setPhoneNumberError(null);
										}}
									/>
									{phoneNumberError && <p className='text-red-500 text-xs'>{phoneNumberError}</p>}
									<Button
										onClick={submitOrder}
										disabled={cart.length === 0 || isSubmitting}
										className={`transition-transform duration-200 hover:scale-105 active:scale-95 ${
											cart.length === 0 || isSubmitting ? "opacity-50 cursor-not-allowed" : ""
										}`}
									>
										{isSubmitting ? "Submitting…" : " ثبت سفارش"}
									</Button>
								</div>
							</div>
						)}
					</SheetContent>
				</Sheet>
			</div>

			{/* Category tabs */}
			<Tabs defaultValue={currentSheet} value={currentSheet} onValueChange={fetchProducts}>
				<TabsList className='overflow-x-auto whitespace-nowrap'>
					{sheetNames.map((s) => (
						<TabsTrigger key={s} value={s} className='px-4 py-2'>
							{s}
						</TabsTrigger>
					))}
				</TabsList>
			</Tabs>

			{/* Products grid */}
			<div className='mt-6 grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-4'>
				{products.map((p) => (
					<Card key={p.id} className='p-4 flex flex-col'>
						{p.imageUrl1 && (
							<img src={p.imageUrl1} alt={p.name} className='w-full aspect-square object-cover rounded mb-4' />
						)}
						<h2 className='font-semibold text-lg'>{p.name}</h2>
						<p className='text-sm text-muted-foreground line-clamp-2 mb-2'>{p.description}</p>
						<div className='mt-auto'>
							{p.originalPrice > p.price ? (
								<div className='flex items-center gap-2 text-sm'>
									<span className='line-through text-muted-foreground'>
										﷼ {formatIranianRial(p.originalPrice)}
									</span>
									<span className='font-bold text-red-600'>﷼ {formatIranianRial(p.price)}</span>
								</div>
							) : (
								<p className='font-bold text-sm'>﷼ {formatIranianRial(p.price)}</p>
							)}
							<p
								className={`text-xs mt-1 ${
									p.stockStatus === "In Stock" ? "text-green-600" : "text-orange-500"
								}`}
							>
								{p.stockStatus}
							</p>
							<div className='mt-3 flex items-center gap-2'>
								<Input type='number' min={1} defaultValue={1} id={`qty-${p.id}`} className='w-16 h-9' />
								<Button
									onClick={() => {
										const qty = parseInt((document.getElementById(`qty-${p.id}`) as HTMLInputElement).value);
										addToCart(p, qty);
									}}
									className='transition-transform duration-200 hover:scale-105 active:scale-95'
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
