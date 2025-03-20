import { bigint, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
	id: text("id").primaryKey(),
	nickname: text("nickname").notNull(),
	address: text("address").notNull(),
});

export const tips = pgTable("tips", {
	id: serial("id").primaryKey(),
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
