import { z } from "zod";

const schema = z.object({
	BASE_URL: z.string(),
	CRON_SECRET: z.string(),
});

const env = schema.parse(process.env);

export async function syncAllowance() {
	console.log("Calling allowance sync...");
	const response = await fetch(`${env.BASE_URL}/slash/cron/allowance`, {
		method: "POST",
		headers: {
			"x-cron-secret": env.CRON_SECRET,
		},
	});
	if (!response.ok) {
		throw new Error(`Failed to call allowance: ${response.statusText}`);
	}
	const data = await response.json();
	console.log("Allowance response:", data);
	return data;
}
