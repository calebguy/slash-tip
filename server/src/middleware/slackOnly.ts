import crypto from "crypto";
import { createMiddleware } from "hono/factory";
import { env } from "../env";

export const slackOnly = createMiddleware(async (c, next) => {
	const rawData = await c.req.text();
	const requestTime = c.req.header("X-Slack-Request-Timestamp");
	if (!requestTime) {
		return c.body("Missing X-Slack-Request-Timestamp", 400);
	}

	const fiveMinInSeconds = 60 * 5;
	if (
		Math.abs(Math.floor(new Date().getTime() / 1000) - Number(requestTime)) >
		fiveMinInSeconds
	) {
		return c.body("Request too old", 400);
	}
	const baseString = `v0:${requestTime}:${rawData}`;
	const signature = c.req.header("X-Slack-Signature");

	const expectedSignature = `v0=${crypto
		.createHmac("sha256", env.SLACK_SIGNING_SECRET)
		.update(baseString, "utf8")
		.digest("hex")}`;

	if (signature !== expectedSignature) {
		return c.body("Invalid signature", 400);
	}
	await next();
});
