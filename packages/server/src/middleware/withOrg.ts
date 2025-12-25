import type { Organization } from "db";
import { createMiddleware } from "hono/factory";
import { db } from "../server";
import type { SlackSlashCommandPayload } from "../types";

type Env = {
	Variables: {
		org: Organization;
	};
};

export const withOrg = createMiddleware<Env>(async (c, next) => {
	const body = await c.req.parseBody<SlackSlashCommandPayload>();
	console.log("with org middleware, body:", body);
	const teamId = body.team_id;

	if (!teamId) {
		return c.json(
			{
				response_type: "ephemeral",
				text: "Could not identify your workspace",
			},
			400,
		);
	}

	const [org] = await db.getOrgBySlackTeamId(teamId);

	if (!org) {
		return c.json(
			{
				response_type: "ephemeral",
				text: "Your workspace is not registered. Please contact support.",
			},
			404,
		);
	}

	c.set("org", org);
	await next();
});
