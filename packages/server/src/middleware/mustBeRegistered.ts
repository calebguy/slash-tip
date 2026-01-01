import type { Organization } from "db";
import { createMiddleware } from "hono/factory";
import type { Hex } from "viem";
import { getUserExists, type OrgActionConfig } from "../chain";
import type { SlackSlashCommandPayload } from "../types";

export const mustBeRegistered = createMiddleware<{
	Variables: { org: Organization };
}>(async (c, next) => {
	const org = c.get("org");
	const config = org.actionConfig as OrgActionConfig | null;

	if (!config?.userRegistryAddress || config.deploymentStatus !== "deployed") {
		return c.json({
			response_type: "ephemeral",
			text: "This workspace is not yet configured. Please ask an admin to complete setup in the App Home.",
		});
	}

	const { user_id } = await c.req.parseBody<SlackSlashCommandPayload>();
	if (!(await getUserExists(config.userRegistryAddress as Hex, user_id))) {
		return c.json({
			response_type: "ephemeral",
			text: "You aren't registered for ✺/tip yet, use '/register <your-eth-address>' to sign up",
		});
	}
	await next();
});
