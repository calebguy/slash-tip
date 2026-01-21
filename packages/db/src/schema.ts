import {
	bigint,
	integer,
	jsonb,
	pgTable,
	primaryKey,
	serial,
	text,
	timestamp,
	unique,
	uuid,
} from "drizzle-orm/pg-core";

export const organizations = pgTable("organizations", {
	id: uuid("id").primaryKey().defaultRandom(),
	slug: text("slug").notNull().unique(),
	name: text("name").notNull(),
	logoUrl: text("logo_url"),
	slackTeamId: text("slack_team_id").unique(),
	slackBotToken: text("slack_bot_token").notNull(),
	adminUserId: text("admin_user_id"),
	paidAt: timestamp("paid_at"),
	dailyAllowance: integer("daily_allowance").notNull().default(3),
	// Action configuration (null = not yet configured)
	actionType: text("action_type"),
	actionConfig: jsonb("action_config"),
	createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const users = pgTable("users", {
	id: text("id").primaryKey(),
	orgId: uuid("org_id")
		.references(() => organizations.id)
		.notNull(),
	nickname: text("nickname").notNull(),
	address: text("address").notNull(),
});

// Contract deployments from factory - maps contract addresses to orgs
export const orgContracts = pgTable("org_contracts", {
	orgId: text("org_id").primaryKey(), // orgId from OrgDeployed event (same as organizations.id UUID)
	slashTipAddress: text("slash_tip_address").notNull(),
	userRegistryAddress: text("user_registry_address").notNull(),
	tipActionAddress: text("tip_action_address").notNull(),
	tipTokenAddress: text("tip_token_address"),
	deployedAt: timestamp("deployed_at").notNull(),
});

export const tips = pgTable("tips", {
	id: serial("id").primaryKey(),
	orgId: uuid("org_id")
		.references(() => organizations.id)
		.notNull(),
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

export const tokenMetadata = pgTable(
	"token_metadata",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		orgId: uuid("org_id")
			.references(() => organizations.id)
			.notNull(),
		tokenId: integer("token_id").notNull().default(0),
		name: text("name").notNull(),
		description: text("description"),
		image: text("image"),
		decimals: integer("decimals").default(0),
		properties: jsonb("properties"),
		createdAt: timestamp("created_at").notNull().defaultNow(),
		updatedAt: timestamp("updated_at").notNull().defaultNow(),
	},
	(table) => [unique().on(table.orgId, table.tokenId)],
);

// Track which users have received the welcome message in the Messages tab
export const welcomeMessagesSent = pgTable(
	"welcome_messages_sent",
	{
		slackUserId: text("slack_user_id").notNull(),
		orgId: uuid("org_id")
			.references(() => organizations.id)
			.notNull(),
		sentAt: timestamp("sent_at").notNull().defaultNow(),
	},
	(table) => [primaryKey({ columns: [table.slackUserId, table.orgId] })],
);
