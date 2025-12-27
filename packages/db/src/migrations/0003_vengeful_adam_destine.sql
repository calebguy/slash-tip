ALTER TABLE "organizations" ADD COLUMN "action_type" text DEFAULT 'mint_erc1155' NOT NULL;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "action_config" jsonb;