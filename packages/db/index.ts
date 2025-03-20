import { desc, eq } from "drizzle-orm";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import { drizzle } from "drizzle-orm/node-postgres";
import { alias } from "drizzle-orm/pg-core";
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

	_getTips() {
		return this.pg.select().from(tips).orderBy(desc(tips.createdAt)).limit(50);
	}

	getTips() {
		const fromUsers = alias(users, "fromUsers");
		const toUsers = alias(users, "toUsers");
		return this.pg
			.select({
				id: tips.id,
				txHash: tips.txHash,
				fromUser: {
					id: fromUsers.id,
					nickname: fromUsers.nickname,
					address: fromUsers.address,
				},
				toUser: {
					id: toUsers.id,
					nickname: toUsers.nickname,
					address: toUsers.address,
				},
				tokenId: tips.tokenId,
				amount: tips.amount,
				message: tips.message,
				blockNumber: tips.blockNumber,
				blockCreatedAt: tips.blockCreatedAt,
				createdAt: tips.createdAt,
			})
			.from(tips)
			.leftJoin(fromUsers, eq(tips.fromUserId, fromUsers.id))
			.leftJoin(toUsers, eq(tips.toUserId, toUsers.id))
			.orderBy(desc(tips.blockNumber))
			.limit(50);
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

	upsertUser(user: InsertUser) {
		return this.pg
			.insert(users)
			.values(user)
			.onConflictDoUpdate({
				target: [users.id],
				set: user,
			});
	}
}

export function tipToJsonSafe(tip: Tip) {
	return {
		...tip,
		tokenId: tip.tokenId.toString(),
		amount: tip.amount.toString(),
		blockNumber: tip.blockNumber.toString(),
	};
}

export function tipWithUsersToJsonSafe(tip: TipWithUsers) {
	return {
		...tip,
		tokenId: tip.tokenId.toString(),
		amount: tip.amount.toString(),
		blockNumber: tip.blockNumber.toString(),
	};
}

type TipWithUsers = Awaited<ReturnType<Db["getTips"]>>[number];
export type InsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertTip = typeof tips.$inferInsert;
export type Tip = typeof tips.$inferSelect;

export { Db };
