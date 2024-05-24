import { createMiddleware } from "hono/factory";
import { getUserAddress } from "./chain";
import type { SlackSlashCommandPayload } from "./types";

export const mustBeRegistered = createMiddleware(async (c, next) => {
	const { user_id } = await c.req.parseBody<SlackSlashCommandPayload>();
	if (!(await getUserAddress(user_id))) {
		return c.json({
			response_type: "ephemeral",
			text: "Register first with '/register <your-eth-address>'",
		});
	}
	await next();
});
