DROP TABLE "fit-manager_food_product" CASCADE;--> statement-breakpoint
DROP TABLE "fit-manager_meal_entry" CASCADE;--> statement-breakpoint
DROP TABLE "fit-manager_meal_template" CASCADE;--> statement-breakpoint
DROP TABLE "fit-manager_meal_template_item" CASCADE;--> statement-breakpoint
DROP TABLE "fit-manager_shopping_category" CASCADE;--> statement-breakpoint
ALTER TABLE "fit-manager_daily_log" ADD COLUMN "protein_g" integer;--> statement-breakpoint
ALTER TABLE "fit-manager_daily_log" ADD COLUMN "carbs_g" integer;--> statement-breakpoint
ALTER TABLE "fit-manager_daily_log" ADD COLUMN "fat_g" integer;--> statement-breakpoint
ALTER TABLE "fit-manager_daily_log" ADD COLUMN "fiber_g" integer;--> statement-breakpoint
ALTER TABLE "fit-manager_user" DROP COLUMN "protein_goal";--> statement-breakpoint
ALTER TABLE "fit-manager_user" DROP COLUMN "carbs_goal";--> statement-breakpoint
ALTER TABLE "fit-manager_user" DROP COLUMN "fat_goal";--> statement-breakpoint
ALTER TABLE "fit-manager_user" DROP COLUMN "fiber_goal";--> statement-breakpoint
ALTER TABLE "fit-manager_user" DROP COLUMN "enabled_meal_types";--> statement-breakpoint
DROP TYPE "public"."food_source";--> statement-breakpoint
DROP TYPE "public"."meal_type";