import { desc } from "drizzle-orm";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import { drizzle } from "drizzle-orm/node-postgres";
import { tips, users } from "./src/schema";

class Db {
	private pg;

	constructor(
		private readonly connectionUrl: string,
		isNeon: boolean,
	) {
		const params = {
			casing: "snake_case",
			connection: this.connectionUrl,
			schema: {
				users,
				tips,
			},
		};
		//@ts-expect-error
		this.pg = isNeon ? drizzleNeon(params) : drizzle(params);
	}

	getTips() {
		return this.pg.select().from(tips).orderBy(desc(tips.createdAt)).limit(50);
	}

	getUsers() {
		return this.pg.select().from(users);
	}

	upsertTip(tip: InsertTip) {
		return this.pg
			.insert(tips)
			.values(tip)
			.onConflictDoUpdate({
				target: [tips.txHash],
				set: tip,
			});
	}
}

export function tipToJsonSafe(tip: Tip) {
	return {
		...tip,
		tokenId: tip.tokenId.toString(),
		amount: tip.amount.toString(),
	};
}

export type InsertTip = typeof tips.$inferInsert;
export type Tip = typeof tips.$inferSelect;

export { Db };
