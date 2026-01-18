import type { Organization } from "db";
import { createMiddleware } from "hono/factory";
import type { SlackSlashCommandPayload } from "../types";

export const mustBeAdmin = createMiddleware<{
	Variables: { org: Organization };
}>(async (c, next) => {
	const org = c.get("org");
	const { user_id } = await c.req.parseBody<SlackSlashCommandPayload>();

	if (!org.adminUserId) {
		return c.json({
			response_type: "ephemeral",
			text: "This workspace does not have an admin configured. Please complete setup in the App Home first.",
		});
	}

	if (org.adminUserId !== user_id) {
		return c.json({
			response_type: "ephemeral",
			text: "Only the workspace admin can perform this action.",
		});
	}

	await next();
});
