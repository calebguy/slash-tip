import { tipWithUsersToJsonSafe } from "db";
import { Hono } from "hono";
import { db } from "../server";

const app = new Hono()
	// Legacy routes (no org filter - returns all data)
	.get("/leaderboard", async (c) => {
		// No global leaderboard, each org has its own users
		return c.json([]);
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

		// Get users and tips for this org
		const [orgUsers, orgTips] = await Promise.all([
			db.getUsersByOrg(org.id),
			db.getTipsByOrg(org.id, 1000),
		]);

		// Calculate balance for each user (sum of tips received)
		const balanceMap = new Map<string, bigint>();
		for (const tip of orgTips) {
			const current = balanceMap.get(tip.toUser?.id ?? "") ?? BigInt(0);
			balanceMap.set(tip.toUser?.id ?? "", current + tip.amount);
		}

		return c.json(
			orgUsers.map((user) => ({
				nickname: user.nickname,
				id: user.id,
				account: user.address,
				balance: (balanceMap.get(user.id) ?? BigInt(0)).toString(),
			})),
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
