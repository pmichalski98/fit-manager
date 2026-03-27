CREATE EXTENSION IF NOT EXISTS pg_trgm;--> statement-breakpoint
CREATE TYPE "public"."food_source" AS ENUM('openfoodfacts', 'ai_estimate', 'manual');--> statement-breakpoint
CREATE TYPE "public"."meal_type" AS ENUM('breakfast', 'lunch', 'dinner', 'snack');--> statement-breakpoint
CREATE TABLE "fit-manager_food_product" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"brand" text,
	"category_id" uuid,
	"source" "food_source" NOT NULL,
	"source_id" text,
	"image_url" text,
	"is_verified" boolean DEFAULT false NOT NULL,
	"kcal_per_100g" numeric(7, 2) NOT NULL,
	"protein_per_100g" numeric(7, 2) NOT NULL,
	"carbs_per_100g" numeric(7, 2) NOT NULL,
	"fat_per_100g" numeric(7, 2) NOT NULL,
	"fiber_per_100g" numeric(7, 2),
	"default_serving_g" integer DEFAULT 100 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fit-manager_meal_entry" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"date" date NOT NULL,
	"meal_type" "meal_type" NOT NULL,
	"food_product_id" uuid NOT NULL,
	"amount_g" numeric(7, 1) NOT NULL,
	"notes" text,
	"kcal" numeric(7, 1),
	"protein" numeric(7, 2),
	"carbs" numeric(7, 2),
	"fat" numeric(7, 2),
	"fiber" numeric(7, 2),
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fit-manager_meal_template" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"meal_type" "meal_type",
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fit-manager_meal_template_item" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"template_id" uuid NOT NULL,
	"food_product_id" uuid NOT NULL,
	"amount_g" numeric(7, 1) NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fit-manager_shopping_category" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"position" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "fit-manager_user" ADD COLUMN "protein_goal" integer;--> statement-breakpoint
ALTER TABLE "fit-manager_user" ADD COLUMN "carbs_goal" integer;--> statement-breakpoint
ALTER TABLE "fit-manager_user" ADD COLUMN "fat_goal" integer;--> statement-breakpoint
ALTER TABLE "fit-manager_user" ADD COLUMN "fiber_goal" integer;--> statement-breakpoint
ALTER TABLE "fit-manager_food_product" ADD CONSTRAINT "fit-manager_food_product_user_id_fit-manager_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."fit-manager_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fit-manager_food_product" ADD CONSTRAINT "fit-manager_food_product_category_id_fit-manager_shopping_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."fit-manager_shopping_category"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fit-manager_meal_entry" ADD CONSTRAINT "fit-manager_meal_entry_user_id_fit-manager_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."fit-manager_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fit-manager_meal_entry" ADD CONSTRAINT "fit-manager_meal_entry_food_product_id_fit-manager_food_product_id_fk" FOREIGN KEY ("food_product_id") REFERENCES "public"."fit-manager_food_product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fit-manager_meal_template" ADD CONSTRAINT "fit-manager_meal_template_user_id_fit-manager_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."fit-manager_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fit-manager_meal_template_item" ADD CONSTRAINT "fit-manager_meal_template_item_template_id_fit-manager_meal_template_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."fit-manager_meal_template"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fit-manager_meal_template_item" ADD CONSTRAINT "fit-manager_meal_template_item_food_product_id_fit-manager_food_product_id_fk" FOREIGN KEY ("food_product_id") REFERENCES "public"."fit-manager_food_product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fit-manager_shopping_category" ADD CONSTRAINT "fit-manager_shopping_category_user_id_fit-manager_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."fit-manager_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "food_product_user_name_idx" ON "fit-manager_food_product" USING btree ("user_id","name");--> statement-breakpoint
CREATE UNIQUE INDEX "food_product_user_source_id_unique" ON "fit-manager_food_product" USING btree ("user_id","source","source_id");--> statement-breakpoint
CREATE INDEX "meal_entry_user_date_idx" ON "fit-manager_meal_entry" USING btree ("user_id","date");--> statement-breakpoint
CREATE INDEX "meal_entry_user_date_meal_idx" ON "fit-manager_meal_entry" USING btree ("user_id","date","meal_type");--> statement-breakpoint
CREATE INDEX "meal_template_user_idx" ON "fit-manager_meal_template" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "shopping_category_user_position_idx" ON "fit-manager_shopping_category" USING btree ("user_id","position");--> statement-breakpoint
CREATE INDEX "food_product_name_trgm_idx" ON "fit-manager_food_product" USING gin ("name" gin_trgm_ops);