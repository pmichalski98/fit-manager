CREATE TABLE "fit-manager_off_product" (
	"code" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"brands" text,
	"image_url" text,
	"kcal_per_100g" real,
	"protein_per_100g" real,
	"carbs_per_100g" real,
	"fat_per_100g" real,
	"fiber_per_100g" real
);
--> statement-breakpoint
CREATE INDEX "off_product_name_trgm_idx" ON "fit-manager_off_product" USING gin ("name" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "off_product_brands_trgm_idx" ON "fit-manager_off_product" USING gin ("brands" gin_trgm_ops);
