CREATE TABLE "fit-manager_strava_account" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"strava_athlete_id" text NOT NULL,
	"access_token" text NOT NULL,
	"refresh_token" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"scope" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "fit-manager_training_session" ADD COLUMN "strava_activity_id" text;--> statement-breakpoint
ALTER TABLE "fit-manager_strava_account" ADD CONSTRAINT "fit-manager_strava_account_user_id_fit-manager_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."fit-manager_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "strava_account_user_unique" ON "fit-manager_strava_account" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "strava_account_athlete_unique" ON "fit-manager_strava_account" USING btree ("strava_athlete_id");--> statement-breakpoint
CREATE UNIQUE INDEX "training_session_strava_activity_unique" ON "fit-manager_training_session" USING btree ("strava_activity_id");