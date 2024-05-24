export const env = {
	SYNDICATE_API_KEY: process.env.SYNDICATE_API_KEY as string,
	RELAYER_PRIVATE_KEY: process.env.RELAYER_PRIVATE_KEY as `0x:${string}`,
	BASE_RPC_URL: process.env.BASE_RPC_URL as string,
	OPENAI_API_KEY: process.env.OPENAI_API_KEY as string,
};

for (const key in env) {
	if (!env[key as keyof typeof env]) {
		throw new Error(`Environment variable ${key} is missing`);
	}
}
