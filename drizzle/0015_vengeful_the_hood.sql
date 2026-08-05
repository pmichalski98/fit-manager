ALTER TABLE "fit-manager_daily_log" ADD COLUMN "steps" integer;--> statement-breakpoint
ALTER TABLE "fit-manager_user" ADD COLUMN "steps_goal" integer;--> statement-breakpoint
ALTER TABLE "fit-manager_user" ADD COLUMN "weekly_training_goal" integer;--> statement-breakpoint
ALTER TABLE "fit-manager_user" ADD COLUMN "goal_training_enabled" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "fit-manager_user" ADD COLUMN "goal_steps_enabled" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "fit-manager_user" ADD COLUMN "goal_weight_enabled" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "fit-manager_user" ADD COLUMN "goal_kcal_enabled" boolean DEFAULT true NOT NULL;