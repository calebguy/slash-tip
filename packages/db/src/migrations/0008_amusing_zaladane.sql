CREATE TABLE "token_metadata" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"token_id" integer DEFAULT 0 NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"image" text,
	"decimals" integer DEFAULT 0,
	"properties" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "token_metadata_org_id_token_id_unique" UNIQUE("org_id","token_id")
);
--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "admin_user_id" text;--> statement-breakpoint
ALTER TABLE "token_metadata" ADD CONSTRAINT "token_metadata_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;