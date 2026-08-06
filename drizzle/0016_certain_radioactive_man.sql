CREATE TABLE "fit-manager_garmin_account" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"oauth1_token" jsonb,
	"oauth2_token" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "fit-manager_training_session" ADD COLUMN "garmin_activity_id" text;--> statement-breakpoint
ALTER TABLE "fit-manager_garmin_account" ADD CONSTRAINT "fit-manager_garmin_account_user_id_fit-manager_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."fit-manager_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "garmin_account_user_unique" ON "fit-manager_garmin_account" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "training_session_garmin_activity_unique" ON "fit-manager_training_session" USING btree ("garmin_activity_id");