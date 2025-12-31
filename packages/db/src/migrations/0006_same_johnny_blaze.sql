ALTER TABLE "organizations" ALTER COLUMN "slack_bot_token" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "organizations" ALTER COLUMN "action_type" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "organizations" ALTER COLUMN "action_type" DROP NOT NULL;