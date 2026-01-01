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

		// Get users for this org from database
		const orgUsers = await db.getUsersByOrg(org.id);

		return c.json(
			orgUsers.map((user) => ({
				nickname: user.nickname,
				id: user.id,
				account: user.address,
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
