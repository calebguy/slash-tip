import { tipWithUsersToJsonSafe } from "db";
import { Hono } from "hono";
import { getLeaderBoard } from "../chain";
import { db } from "../server";

const app = new Hono()
	// Legacy routes (no org filter - returns all data)
	.get("/leaderboard", async (c) => {
		const leaderboard = await getLeaderBoard();
		return c.json(
			leaderboard.map(
				({ balance, user: { allowance, nickname, id, account } }) => ({
					balance: balance.toString(),
					allowance: allowance.toString(),
					nickname,
					id,
					account,
				}),
			),
		);
	})
	.get("/activity", async (c) => {
		const tips = await db.getTips();
		return c.json(tips.map(tipWithUsersToJsonSafe));
	})
	// Org-scoped routes
	.get("/:org", async (c) => {
		const slug = c.req.param("org");
		const [org] = await db.getOrgBySlug(slug);

		if (!org) {
			return c.json({ error: "Organization not found" }, 404);
		}

		return c.json({
			slug: org.slug,
			name: org.name,
			logoUrl: org.logoUrl,
		});
	})
	.get("/:org/leaderboard", async (c) => {
		const slug = c.req.param("org");
		const [org] = await db.getOrgBySlug(slug);

		if (!org) {
			return c.json({ error: "Organization not found" }, 404);
		}

		// Get users for this org and filter leaderboard
		const orgUsers = await db.getUsersByOrg(org.id);
		const orgUserIds = new Set(orgUsers.map((u) => u.id));

		const leaderboard = await getLeaderBoard();
		const filteredLeaderboard = leaderboard.filter(({ user }) =>
			orgUserIds.has(user.id),
		);

		return c.json(
			filteredLeaderboard.map(
				({ balance, user: { allowance, nickname, id, account } }) => ({
					balance: balance.toString(),
					allowance: allowance.toString(),
					nickname,
					id,
					account,
				}),
			),
		);
	})
	.get("/:org/activity", async (c) => {
		const slug = c.req.param("org");
		const [org] = await db.getOrgBySlug(slug);

		if (!org) {
			return c.json({ error: "Organization not found" }, 404);
		}

		const tips = await db.getTipsByOrg(org.id);
		return c.json(tips.map(tipWithUsersToJsonSafe));
	});

export default app;
