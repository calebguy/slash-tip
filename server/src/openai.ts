import OpenAI from "openai";

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

export async function peom() {
	return ai(
		"You are a thoughtful poet",
		"write me a haiku about tipping yourself",
	);
}
