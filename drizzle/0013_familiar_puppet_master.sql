CREATE TABLE "fit-manager_fitatu_meal_item" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"date" date NOT NULL,
	"meal_key" text NOT NULL,
	"meal_name" text,
	"name" text NOT NULL,
	"brand" text,
	"measure_name" text,
	"measure_quantity" numeric(8, 2),
	"weight_g" numeric(8, 1),
	"kcal" numeric(8, 1),
	"protein" numeric(7, 2),
	"carbs" numeric(7, 2),
	"fat" numeric(7, 2),
	"fiber" numeric(7, 2),
	"eaten" boolean DEFAULT true NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fit-manager_nutrition_insight" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"week_start" date NOT NULL,
	"summary" text NOT NULL,
	"observations" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"swaps" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"model" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "fit-manager_fitatu_meal_item" ADD CONSTRAINT "fit-manager_fitatu_meal_item_user_id_fit-manager_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."fit-manager_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fit-manager_nutrition_insight" ADD CONSTRAINT "fit-manager_nutrition_insight_user_id_fit-manager_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."fit-manager_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "fitatu_meal_item_user_date_idx" ON "fit-manager_fitatu_meal_item" USING btree ("user_id","date");--> statement-breakpoint
CREATE UNIQUE INDEX "nutrition_insight_user_week_unique" ON "fit-manager_nutrition_insight" USING btree ("user_id","week_start");