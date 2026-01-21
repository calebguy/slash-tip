import { and, desc, eq } from "drizzle-orm";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import { drizzle } from "drizzle-orm/node-postgres";
import { alias } from "drizzle-orm/pg-core";
import {
	orgContracts,
	organizations,
	tips,
	tokenMetadata,
	users,
	welcomeMessagesSent,
} from "./src/schema";

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
				organizations,
				users,
				tips,
				orgContracts,
				tokenMetadata,
			},
		};
		//@ts-expect-error
		this.pg = isNeon ? drizzleNeon(params) : drizzle(params);
	}

	// Organization methods
	getOrgBySlug(slug: string) {
		return this.pg
			.select()
			.from(organizations)
			.where(eq(organizations.slug, slug))
			.limit(1);
	}

	getOrgBySlackTeamId(slackTeamId: string) {
		return this.pg
			.select()
			.from(organizations)
			.where(eq(organizations.slackTeamId, slackTeamId))
			.limit(1);
	}

	createOrg(org: InsertOrganization) {
		return this.pg.insert(organizations).values(org).returning();
	}

	updateOrg(id: string, org: Partial<InsertOrganization>) {
		return this.pg
			.update(organizations)
			.set(org)
			.where(eq(organizations.id, id))
			.returning();
	}

	// Tips methods
	_getTips() {
		return this.pg.select().from(tips).orderBy(desc(tips.createdAt)).limit(50);
	}

	getTips(limit = 50) {
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
			.limit(limit);
	}

	getTipsByOrg(orgId: string, limit = 50) {
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
			.where(eq(tips.orgId, orgId))
			.orderBy(desc(tips.blockNumber))
			.limit(limit);
	}

	// User methods
	getUsers() {
		return this.pg.select().from(users);
	}

	getUserById(id: string) {
		return this.pg.select().from(users).where(eq(users.id, id)).limit(1);
	}

	getUsersByOrg(orgId: string) {
		return this.pg.select().from(users).where(eq(users.orgId, orgId));
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

	removeUser(id: string) {
		return this.pg.delete(users).where(eq(users.id, id));
	}

	// Org contracts methods (for factory pattern)
	upsertOrgContracts(contract: InsertOrgContract) {
		return this.pg
			.insert(orgContracts)
			.values(contract)
			.onConflictDoUpdate({
				target: [orgContracts.orgId],
				set: contract,
			});
	}

	getOrgContractBySlashTip(slashTipAddress: string) {
		return this.pg
			.select()
			.from(orgContracts)
			.where(eq(orgContracts.slashTipAddress, slashTipAddress))
			.limit(1);
	}

	getOrgContractByUserRegistry(userRegistryAddress: string) {
		return this.pg
			.select()
			.from(orgContracts)
			.where(eq(orgContracts.userRegistryAddress, userRegistryAddress))
			.limit(1);
	}

	getOrgContractByOrgId(orgId: string) {
		return this.pg
			.select()
			.from(orgContracts)
			.where(eq(orgContracts.orgId, orgId))
			.limit(1);
	}

	updateOrgTipAction(slashTipAddress: string, tipActionAddress: string) {
		return this.pg
			.update(orgContracts)
			.set({ tipActionAddress })
			.where(eq(orgContracts.slashTipAddress, slashTipAddress))
			.returning();
	}

	getAllOrgContracts() {
		return this.pg.select().from(orgContracts);
	}

	getAllOrgs() {
		return this.pg.select().from(organizations);
	}

	// Token metadata methods
	getTokenMetadata(orgId: string, tokenId: number) {
		return this.pg
			.select()
			.from(tokenMetadata)
			.where(
				and(eq(tokenMetadata.orgId, orgId), eq(tokenMetadata.tokenId, tokenId)),
			)
			.limit(1);
	}

	upsertTokenMetadata(
		orgId: string,
		tokenId: number,
		metadata: Partial<InsertTokenMetadata>,
	) {
		return this.pg
			.insert(tokenMetadata)
			.values({
				orgId,
				tokenId,
				name: metadata.name ?? "",
				...metadata,
				updatedAt: new Date(),
			})
			.onConflictDoUpdate({
				target: [tokenMetadata.orgId, tokenMetadata.tokenId],
				set: {
					...metadata,
					updatedAt: new Date(),
				},
			})
			.returning();
	}

	// Welcome message tracking
	async hasReceivedWelcomeMessage(
		slackUserId: string,
		orgId: string,
	): Promise<boolean> {
		const result = await this.pg
			.select()
			.from(welcomeMessagesSent)
			.where(
				and(
					eq(welcomeMessagesSent.slackUserId, slackUserId),
					eq(welcomeMessagesSent.orgId, orgId),
				),
			)
			.limit(1);
		return result.length > 0;
	}

	markWelcomeMessageSent(slackUserId: string, orgId: string) {
		return this.pg
			.insert(welcomeMessagesSent)
			.values({ slackUserId, orgId })
			.onConflictDoNothing();
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
export type InsertOrganization = typeof organizations.$inferInsert;
export type Organization = typeof organizations.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertTip = typeof tips.$inferInsert;
export type Tip = typeof tips.$inferSelect;
export type InsertOrgContract = typeof orgContracts.$inferInsert;
export type OrgContract = typeof orgContracts.$inferSelect;
export type InsertTokenMetadata = typeof tokenMetadata.$inferInsert;
export type TokenMetadata = typeof tokenMetadata.$inferSelect;

export { Db };
