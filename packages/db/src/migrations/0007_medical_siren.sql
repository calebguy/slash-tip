CREATE TABLE "org_contracts" (
	"org_id" text PRIMARY KEY NOT NULL,
	"slash_tip_address" text NOT NULL,
	"user_registry_address" text NOT NULL,
	"tip_action_address" text NOT NULL,
	"tip_token_address" text,
	"deployed_at" timestamp NOT NULL
);
