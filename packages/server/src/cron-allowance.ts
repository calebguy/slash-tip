import type { Hex } from "viem";
import { addAllowanceForAllUsers, type OrgActionConfig } from "./chain";
import { db } from "./server";

async function main() {
	const now = new Date();
	console.log(`[${now.toISOString()}] Starting daily allowance cron job`);

	// Get all orgs
	const orgs = await db.getAllOrgs();

	for (const org of orgs) {
		const config = org.actionConfig as OrgActionConfig | null;

		// Skip orgs that aren't fully deployed
		if (!config?.slashTipAddress || config.deploymentStatus !== "deployed") {
			console.log(`[${org.slug}] Skipping - not deployed`);
			continue;
		}

		console.log(
			`[${org.slug}] Adding allowance of ${org.dailyAllowance} for all users`,
		);

		try {
			await addAllowanceForAllUsers(
				config.slashTipAddress as Hex,
				org.dailyAllowance,
			);
			console.log(`[${org.slug}] Successfully added allowance`);
		} catch (e) {
			console.error(`[${org.slug}] Failed to add allowance:`, e);
		}
	}

	console.log(`[${now.toISOString()}] Finished daily allowance cron job`);
}

main()
	.then(() => process.exit(0))
	.catch((e) => {
		console.error(e);
		process.exit(1);
	});
