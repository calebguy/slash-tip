CREATE TABLE "welcome_messages_sent" (
	"slack_user_id" text NOT NULL,
	"org_id" uuid NOT NULL,
	"sent_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "welcome_messages_sent_slack_user_id_org_id_pk" PRIMARY KEY("slack_user_id","org_id")
);
--> statement-breakpoint
ALTER TABLE "welcome_messages_sent" ADD CONSTRAINT "welcome_messages_sent_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;
