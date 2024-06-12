import crypto from "crypto";
import { createMiddleware } from "hono/factory";
import { env } from "../env";

export const slackOnly = createMiddleware(async (c, next) => {
	console.log("hitting slack middleware");
	const rawData = await c.req.text();
	const requestTime = c.req.header("X-Slack-Request-Timestamp");
	if (!requestTime) {
		console.error("no requestTime found");
		return c.body("Missing X-Slack-Request-Timestamp", 400);
	}

	const fiveMinInSeconds = 60 * 5;
	if (
		Math.abs(Math.floor(new Date().getTime() / 1000) - Number(requestTime)) >
		fiveMinInSeconds
	) {
		console.error("Request too old");
		return c.body("Request too old", 400);
	}
	const baseString = `v0:${requestTime}:${rawData}`;
	const signature = c.req.header("X-Slack-Signature");

	const expectedSignature = `v0=${crypto
		.createHmac("sha256", env.SLACK_SIGNING_SECRET)
		.update(baseString, "utf8")
		.digest("hex")}`;

	if (signature !== expectedSignature) {
		console.error("signature invalid");
		return c.body("Invalid signature", 400);
	}
	console.log("all checks successful");
	await next();
});
