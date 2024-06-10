import { createMiddleware } from "hono/factory";

export const slack = createMiddleware(async (c, next) => {
	const body = await c.req.text();
	const requestTime = c.req.header("X-Slack-Request-Timestamp");
	// if (!(await getUserExists(user_id))) {
	// 	return c.json({
	// 		response_type: "ephemeral",
	// 		text: "You aren't registered for ✺/tip yet, use '/register <your-eth-address>' to sign up",
	// 	});
	// }
	await next();
});
