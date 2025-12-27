import OpenAI from "openai/index.mjs";

const openai = new OpenAI();

export async function ai(systemContent: string, userContent: string) {
	const completion = await openai.chat.completions.create({
		messages: [
			{
				role: "system",
				content: systemContent,
			},
			{ role: "user", content: userContent },
		],
		model: "gpt-4o",
	});

	return completion.choices[0].message.content;
}

export function selfLovePoem() {
	return ai(
		"You are a thoughtful poet",
		"write me a haiku about tipping yourself",
	);
}

export function stealingPoem() {
	return ai(
		"You are a thoughtful poet",
		"write me a haiku about how stealing is bad",
	);
}

export function generateTipPoem(
	_fromUserId: string,
	_toUserId: string,
	message: string,
) {
	const context = message
		? `The tip was given with this message: "${message}"`
		: "No specific message was provided";

	return ai(
		"You are a thoughtful poet who writes short, heartfelt poems about appreciation and gratitude in the workplace.",
		`Write a short 2-4 line poem celebrating someone being recognized by a colleague. ${context}. Keep it professional but warm.`,
	);
}
