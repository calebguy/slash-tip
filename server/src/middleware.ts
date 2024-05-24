import { createMiddleware } from "hono/factory";
import { getUserExists } from "./chain";
import type { SlackSlashCommandPayload } from "./types";

export const mustBeRegistered = createMiddleware(async (c, next) => {
	const { user_id } = await c.req.parseBody<SlackSlashCommandPayload>();
	if (!(await getUserExists(user_id))) {
		return c.json({
			response_type: "ephemeral",
			text: "You aren't registered for ✺/tip yet, use '/register <your-eth-address>' to sign up",
		});
	}
	await next();
});
