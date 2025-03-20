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
