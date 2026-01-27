export const env = {
	SYNDICATE_API_KEY: process.env.SYNDICATE_API_KEY as string,
	RELAYER_PRIVATE_KEY: process.env.RELAYER_PRIVATE_KEY as `0x:${string}`,
	BASE_RPC_URL: process.env.BASE_RPC_URL as string,
	OPENAI_API_KEY: process.env.OPENAI_API_KEY as string,
	SLACK_SIGNING_SECRET: process.env.SLACK_SIGNING_SECRET as string,
	SLACK_CLIENT_ID: process.env.SLACK_CLIENT_ID as string,
	SLACK_CLIENT_SECRET: process.env.SLACK_CLIENT_SECRET as string,
	DATABASE_URL: process.env.DATABASE_URL as string,
	CRON_SECRET: process.env.CRON_SECRET as string,
	PORT: process.env.PORT || "4000",
	// S3 configuration for token metadata images
	AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID as string,
	AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY as string,
	AWS_S3_BUCKET: process.env.AWS_S3_BUCKET as string,
	AWS_REGION: process.env.AWS_REGION || "us-east-1",
	// Public URL for metadata endpoint
	PUBLIC_URL: process.env.PUBLIC_URL as string,
};

for (const key in env) {
	if (!env[key as keyof typeof env]) {
		throw new Error(`Environment variable ${key} is missing`);
	}
}
