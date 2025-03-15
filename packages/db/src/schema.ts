import {
	integer,
	numeric,
	pgTable,
	serial,
	text,
	timestamp,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
	id: serial("id").primaryKey(),
	nickname: text("nickname").notNull(),
});

export const tips = pgTable("tips", {
	id: serial("id").primaryKey(),
	amount: numeric("amount").notNull(),
	fromUserId: integer("from_user_id").references(() => users.id),
	toUserId: integer("to_user_id").references(() => users.id),
	message: text("message"),
	txHash: text("tx_hash").notNull(),
	createdAt: timestamp("created_at").notNull().defaultNow(),
});
