CREATE TYPE "public"."session_status" AS ENUM('in_progress', 'completed');--> statement-breakpoint
ALTER TABLE "fit-manager_training_session" ADD COLUMN "status" "session_status" DEFAULT 'completed' NOT NULL;--> statement-breakpoint
ALTER TABLE "fit-manager_training_session_set" ADD COLUMN "is_done" boolean DEFAULT false NOT NULL;