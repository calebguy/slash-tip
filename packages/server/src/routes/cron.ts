import { Hono } from "hono";
import type { OrgActionConfig } from "../chain";
import { env } from "../env";
import { db } from "../server";

const app = new Hono();

app.post("/allowance", async (c) => {
	const cronSecret = c.req.header("x-cron-secret");
	if (cronSecret !== env.CRON_SECRET) {
		return c.json({ error: "Unauthorized" }, 401);
	}

	const now = new Date();
	console.log(`[${now.toISOString()}] Starting daily allowance cron job`);

	const orgs = await db.getAllOrgs();
	const results: Array<{
		slug: string;
		status: "success" | "skipped" | "error";
		usersUpdated?: number;
		error?: string;
	}> = [];

	for (const org of orgs) {
		const config = org.actionConfig as OrgActionConfig | null;

		if (!config?.userRegistryAddress || config.deploymentStatus !== "deployed") {
			console.log(`[${org.slug}] Skipping - not deployed`);
			results.push({ slug: org.slug, status: "skipped" });
			continue;
		}

		console.log(
			`[${org.slug}] Adding allowance of ${org.dailyAllowance} for all users`,
		);

		try {
			// Update allowance in database (off-chain)
			const updated = await db.addAllowanceForAllUsers(org.id, org.dailyAllowance);
			console.log(`[${org.slug}] Successfully added allowance for ${updated.length} users`);
			results.push({ slug: org.slug, status: "success", usersUpdated: updated.length });
		} catch (e) {
			const errorMessage = e instanceof Error ? e.message : String(e);
			console.error(`[${org.slug}] Failed to add allowance:`, e);
			results.push({ slug: org.slug, status: "error", error: errorMessage });
		}
	}

	const successful = results.filter((r) => r.status === "success").length;
	const skipped = results.filter((r) => r.status === "skipped").length;
	const failed = results.filter((r) => r.status === "error").length;

	console.log(`[${now.toISOString()}] Finished daily allowance cron job`);

	return c.json({
		message: `Processed ${orgs.length} orgs: ${successful} successful, ${skipped} skipped, ${failed} failed`,
		results,
	});
});

export default app;
