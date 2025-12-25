import {
	bigint,
	integer,
	pgTable,
	serial,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core";

export const organizations = pgTable("organizations", {
	id: uuid("id").primaryKey().defaultRandom(),
	slug: text("slug").notNull().unique(),
	name: text("name").notNull(),
	slackTeamId: text("slack_team_id").unique(),
	slackBotToken: text("slack_bot_token"),
	paidAt: timestamp("paid_at"),
	dailyAllowance: integer("daily_allowance").notNull().default(3),
	createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const users = pgTable("users", {
	id: text("id").primaryKey(),
	orgId: uuid("org_id").references(() => organizations.id),
	nickname: text("nickname").notNull(),
	address: text("address").notNull(),
});

export const tips = pgTable("tips", {
	id: serial("id").primaryKey(),
	orgId: uuid("org_id").references(() => organizations.id),
	txHash: text("tx_hash").notNull().unique(),
	fromUserId: text("from_user_id").notNull(),
	toUserId: text("to_user_id").notNull(),
	tokenId: bigint("token_id", { mode: "bigint" }).notNull(),
	amount: bigint("amount", { mode: "bigint" }).notNull(),
	message: text("message"),
	blockNumber: bigint("block_number", { mode: "bigint" }).notNull(),
	blockCreatedAt: timestamp("block_created_at").notNull(),
	createdAt: timestamp("created_at").notNull().defaultNow(),
});
