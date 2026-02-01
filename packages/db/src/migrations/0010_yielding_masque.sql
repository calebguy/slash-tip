ALTER TABLE "organizations" ALTER COLUMN "daily_allowance" SET DATA TYPE numeric(36, 18);--> statement-breakpoint
ALTER TABLE "organizations" ALTER COLUMN "daily_allowance" SET DEFAULT '3';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "allowance" numeric(36, 18) DEFAULT '0' NOT NULL;