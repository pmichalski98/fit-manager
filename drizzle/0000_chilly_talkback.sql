CREATE TYPE "public"."training_type" AS ENUM('strength', 'cardio');--> statement-breakpoint
CREATE TABLE "fit-manager_account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fit-manager_body_measurement" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"date" date NOT NULL,
	"neck" numeric(5, 1),
	"chest" numeric(5, 1),
	"waist" numeric(5, 1),
	"bellybutton" numeric(5, 1),
	"hips" numeric(5, 1),
	"biceps" numeric(5, 1),
	"thigh" numeric(5, 1),
	"notes" text DEFAULT '' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fit-manager_daily_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"date" date NOT NULL,
	"weight" numeric(5, 1),
	"kcal" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fit-manager_photo" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"date" date NOT NULL,
	"weight" numeric(5, 1),
	"image_url" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fit-manager_session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "fit-manager_session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "fit-manager_training" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"type" "training_type" NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"last_session_at" timestamp,
	"user_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fit-manager_training_exercise" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"training_id" uuid NOT NULL,
	"name" text NOT NULL,
	"position" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fit-manager_training_session" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"training_id" uuid NOT NULL,
	"type" "training_type" NOT NULL,
	"start_at" timestamp DEFAULT now() NOT NULL,
	"end_at" timestamp,
	"duration_min" integer,
	"total_load_kg" integer,
	"notes" text,
	"date" date DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fit-manager_training_session_cardio" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"duration_min" integer NOT NULL,
	"distance_km" numeric(5, 2),
	"kcal" integer,
	"avg_hr" integer,
	"cadence" integer,
	"avg_speed_kmh" numeric(5, 2),
	"avg_power_w" integer,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fit-manager_training_session_exercise" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"template_exercise_id" uuid,
	"name" text NOT NULL,
	"position" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fit-manager_training_session_set" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_exercise_id" uuid NOT NULL,
	"set_index" integer NOT NULL,
	"reps" integer NOT NULL,
	"weight" numeric(6, 2),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fit-manager_user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean NOT NULL,
	"image" text,
	"caloric_goal" integer,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "fit-manager_user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "fit-manager_verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "fit-manager_account" ADD CONSTRAINT "fit-manager_account_user_id_fit-manager_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."fit-manager_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fit-manager_body_measurement" ADD CONSTRAINT "fit-manager_body_measurement_user_id_fit-manager_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."fit-manager_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fit-manager_daily_log" ADD CONSTRAINT "fit-manager_daily_log_user_id_fit-manager_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."fit-manager_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fit-manager_photo" ADD CONSTRAINT "fit-manager_photo_user_id_fit-manager_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."fit-manager_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fit-manager_session" ADD CONSTRAINT "fit-manager_session_user_id_fit-manager_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."fit-manager_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fit-manager_training" ADD CONSTRAINT "fit-manager_training_user_id_fit-manager_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."fit-manager_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fit-manager_training_exercise" ADD CONSTRAINT "fit-manager_training_exercise_training_id_fit-manager_training_id_fk" FOREIGN KEY ("training_id") REFERENCES "public"."fit-manager_training"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fit-manager_training_session" ADD CONSTRAINT "fit-manager_training_session_user_id_fit-manager_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."fit-manager_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fit-manager_training_session" ADD CONSTRAINT "fit-manager_training_session_training_id_fit-manager_training_id_fk" FOREIGN KEY ("training_id") REFERENCES "public"."fit-manager_training"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fit-manager_training_session_cardio" ADD CONSTRAINT "fit-manager_training_session_cardio_session_id_fit-manager_training_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."fit-manager_training_session"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fit-manager_training_session_exercise" ADD CONSTRAINT "fit-manager_training_session_exercise_session_id_fit-manager_training_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."fit-manager_training_session"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fit-manager_training_session_exercise" ADD CONSTRAINT "fit-manager_training_session_exercise_template_exercise_id_fit-manager_training_exercise_id_fk" FOREIGN KEY ("template_exercise_id") REFERENCES "public"."fit-manager_training_exercise"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fit-manager_training_session_set" ADD CONSTRAINT "fit-manager_training_session_set_session_exercise_id_fit-manager_training_session_exercise_id_fk" FOREIGN KEY ("session_exercise_id") REFERENCES "public"."fit-manager_training_session_exercise"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "body_measurement_user_date_idx" ON "fit-manager_body_measurement" USING btree ("user_id","date");--> statement-breakpoint
CREATE INDEX "daily_log_user_date_idx" ON "fit-manager_daily_log" USING btree ("user_id","date");--> statement-breakpoint
CREATE UNIQUE INDEX "daily_log_user_date_unique" ON "fit-manager_daily_log" USING btree ("user_id","date");--> statement-breakpoint
CREATE INDEX "training_exercise_training_position_idx" ON "fit-manager_training_exercise" USING btree ("training_id","position");--> statement-breakpoint
CREATE UNIQUE INDEX "training_session_cardio_session_unique" ON "fit-manager_training_session_cardio" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "training_session_exercise_session_position_idx" ON "fit-manager_training_session_exercise" USING btree ("session_id","position");--> statement-breakpoint
CREATE INDEX "training_session_set_exercise_set_idx" ON "fit-manager_training_session_set" USING btree ("session_exercise_id","set_index");