import {NextResponse} from "next/server";

export async function POST(request: Request) {
	try {
		const {cart, total, phoneNumber, email} = await request.json();

		// Format the message
		const message = formatOrderMessage(cart, total, phoneNumber, email);

		// Send to Telegram
		const result = await sendTelegramMessage(message);

		return NextResponse.json({success: true, result});
	} catch (error) {
		console.error("Error sending Telegram message:", error);
		return NextResponse.json({success: false, error: "Failed to send message"}, {status: 500});
	}
}

function formatOrderMessage(cart: any[], total: number, phoneNumber: string, email: string) {
	const timestamp = new Date().toLocaleString();

	let message = `🛒 *NEW ORDER* (${timestamp})\n\n`;
	message += `*Customer Information:*\n`;
	message += `📧 Email: ${email}\n`;
	message += `📱 Phone: ${phoneNumber}\n\n`;
	message += `*Order Summary:* ${cart.length} items\n\n`;

	cart.forEach((item, index) => {
		message += `${index + 1}. *${item.name}*\n`;
		message += `   Quantity: ${item.quantity}\n`;
		message += `   Price: ﷼ ${item.price.toLocaleString()}\n`;
		message += `   Subtotal: ﷼ ${(item.price * item.quantity).toLocaleString()}\n\n`;
	});

	message += `*TOTAL: ﷼ ${total.toLocaleString()}*`;

	return message;
}

async function sendTelegramMessage(message: string) {
	const token = process.env.TELEGRAM_BOT_TOKEN;
	const chatId = process.env.TELEGRAM_CHAT_ID;

	if (!token || !chatId) {
		throw new Error("Telegram bot token or chat ID not configured");
	}

	const url = `https://api.telegram.org/bot${token}/sendMessage`;

	const response = await fetch(url, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			chat_id: chatId,
			text: message,
			parse_mode: "Markdown",
		}),
	});

	return await response.json();
}
