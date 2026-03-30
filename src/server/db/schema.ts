// Example model schema from the Drizzle docs
// https://orm.drizzle.team/docs/sql-schema-declaration

import { relations } from "drizzle-orm";
import {
  index,
  pgEnum,
  pgTableCreator,
  uniqueIndex,
} from "drizzle-orm/pg-core";

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = pgTableCreator((name) => `fit-manager_${name}`);

export const user = createTable("user", (d) => ({
  id: d.text("id").primaryKey(),
  name: d.text("name").notNull(),
  email: d.text("email").notNull().unique(),
  emailVerified: d
    .boolean("email_verified")
    .$defaultFn(() => false)
    .notNull(),
  image: d.text("image"),
  caloricGoal: d.integer("caloric_goal"),
  proteinGoal: d.integer("protein_goal"),
  carbsGoal: d.integer("carbs_goal"),
  fatGoal: d.integer("fat_goal"),
  fiberGoal: d.integer("fiber_goal"),
  createdAt: d
    .timestamp("created_at")
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
  updatedAt: d
    .timestamp("updated_at")
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
}));

export const session = createTable("session", (d) => ({
  id: d.text("id").primaryKey(),
  expiresAt: d.timestamp("expires_at").notNull(),
  token: d.text("token").notNull().unique(),
  createdAt: d.timestamp("created_at").notNull(),
  updatedAt: d.timestamp("updated_at").notNull(),
  ipAddress: d.text("ip_address"),
  userAgent: d.text("user_agent"),
  userId: d
    .text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
}));

export const account = createTable("account", (d) => ({
  id: d.text("id").primaryKey(),
  accountId: d.text("account_id").notNull(),
  providerId: d.text("provider_id").notNull(),
  userId: d
    .text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: d.text("access_token"),
  refreshToken: d.text("refresh_token"),
  idToken: d.text("id_token"),
  accessTokenExpiresAt: d.timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: d.timestamp("refresh_token_expires_at"),
  scope: d.text("scope"),
  password: d.text("password"),
  createdAt: d.timestamp("created_at").notNull(),
  updatedAt: d.timestamp("updated_at").notNull(),
}));

export const verification = createTable("verification", (d) => ({
  id: d.text("id").primaryKey(),
  identifier: d.text("identifier").notNull(),
  value: d.text("value").notNull(),
  expiresAt: d.timestamp("expires_at").notNull(),
  createdAt: d
    .timestamp("created_at")
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: d
    .timestamp("updated_at")
    .$defaultFn(() => new Date())
    .notNull(),
}));

// Daily log: one per user per day for weight and calories
export const dailyLog = createTable(
  "daily_log",
  (d) => ({
    id: d.uuid("id").primaryKey().defaultRandom(),
    userId: d
      .text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    date: d.date("date").notNull(),
    weight: d.numeric("weight", { precision: 5, scale: 1 }),
    kcal: d.integer("kcal"),
    createdAt: d.timestamp("created_at").notNull().defaultNow(),
    updatedAt: d.timestamp("updated_at").notNull().defaultNow(),
  }),
  (t) => [
    index("daily_log_user_date_idx").on(t.userId, t.date),
    uniqueIndex("daily_log_user_date_unique").on(t.userId, t.date),
  ],
);

export type DailyLog = typeof dailyLog.$inferSelect;
// Body measurements: snapshots with optional fields
export const bodyMeasurement = createTable(
  "body_measurement",
  (d) => ({
    id: d.uuid("id").primaryKey().defaultRandom(),
    userId: d
      .text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    date: d.date("date").notNull(),
    neck: d.numeric("neck", { precision: 5, scale: 1 }),
    chest: d.numeric("chest", { precision: 5, scale: 1 }),
    waist: d.numeric("waist", { precision: 5, scale: 1 }),
    bellybutton: d.numeric("bellybutton", { precision: 5, scale: 1 }),
    hips: d.numeric("hips", { precision: 5, scale: 1 }),
    biceps: d.numeric("biceps", { precision: 5, scale: 1 }),
    thigh: d.numeric("thigh", { precision: 5, scale: 1 }),
    notes: d.text("notes").notNull().default(""),
    createdAt: d.timestamp("created_at").notNull().defaultNow(),
    updatedAt: d.timestamp("updated_at").notNull().defaultNow(),
  }),
  (t) => [index("body_measurement_user_date_idx").on(t.userId, t.date)],
);

export type BodyMeasurement = typeof bodyMeasurement.$inferSelect;

export const photo = createTable("photo", (d) => ({
  id: d.uuid("id").primaryKey().defaultRandom(),
  userId: d
    .text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  date: d.date("date").notNull(),
  weight: d.numeric("weight", { precision: 5, scale: 1 }),
  imageUrl: d.text("image_url").notNull(),
  createdAt: d.timestamp("created_at").notNull().defaultNow(),
  updatedAt: d.timestamp("updated_at").notNull().defaultNow(),
}));
export const trainingTypeEnum = pgEnum("training_type", ["strength", "cardio"]);
export const sessionStatusEnum = pgEnum("session_status", [
  "in_progress",
  "completed",
]);

export const training = createTable(
  "training",
  (d) => ({
    id: d.uuid("id").primaryKey().defaultRandom(),
    name: d.text("name").notNull(),
    type: trainingTypeEnum("type").notNull(),
    isActive: d.boolean("is_active").notNull().default(true),
    createdAt: d.timestamp("created_at").notNull().defaultNow(),
    updatedAt: d.timestamp("updated_at").notNull().defaultNow(),
    lastSessionAt: d.timestamp("last_session_at"),
    userId: d
      .text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  }),
  (t) => [
    uniqueIndex("training_user_name_type_unique").on(t.userId, t.name, t.type),
  ],
);

export const trainingExercise = createTable(
  "training_exercise",
  (d) => ({
    id: d.uuid("id").primaryKey().defaultRandom(),
    trainingId: d
      .uuid("training_id")
      .notNull()
      .references(() => training.id, { onDelete: "cascade" }),
    name: d.text("name").notNull(),
    position: d.integer("position").notNull(),
    createdAt: d.timestamp("created_at").notNull().defaultNow(),
    updatedAt: d.timestamp("updated_at").notNull().defaultNow(),
  }),
  (t) => [
    index("training_exercise_training_position_idx").on(
      t.trainingId,
      t.position,
    ),
  ],
);

// ─── Strava Integration ─────────────────────────────────────────────────────

export const stravaAccount = createTable(
  "strava_account",
  (d) => ({
    id: d.uuid("id").primaryKey().defaultRandom(),
    userId: d
      .text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    stravaAthleteId: d.text("strava_athlete_id").notNull(),
    accessToken: d.text("access_token").notNull(),
    refreshToken: d.text("refresh_token").notNull(),
    expiresAt: d.timestamp("expires_at").notNull(),
    scope: d.text("scope"),
    webhookSubscriptionId: d.text("webhook_subscription_id"),
    createdAt: d.timestamp("created_at").notNull().defaultNow(),
    updatedAt: d.timestamp("updated_at").notNull().defaultNow(),
  }),
  (t) => [
    uniqueIndex("strava_account_user_unique").on(t.userId),
    uniqueIndex("strava_account_athlete_unique").on(t.stravaAthleteId),
  ],
);

export type StravaAccount = typeof stravaAccount.$inferSelect;

// Training session lifecycle and results
export const trainingSession = createTable(
  "training_session",
  (d) => ({
    id: d.uuid("id").primaryKey().defaultRandom(),
    userId: d
      .text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    trainingId: d
      .uuid("training_id")
      .notNull()
      .references(() => training.id, { onDelete: "cascade" }),
    type: trainingTypeEnum("type").notNull(),
    status: sessionStatusEnum("status").notNull().default("completed"),
    startAt: d.timestamp("start_at").notNull().defaultNow(),
    endAt: d.timestamp("end_at"),
    // Derived/summary fields
    durationMin: d.integer("duration_min"),
    totalLoadKg: d.integer("total_load_kg"),
    notes: d.text("notes"),
    stravaActivityId: d.text("strava_activity_id"),
    date: d.date("date").notNull().defaultNow(),
    createdAt: d.timestamp("created_at").notNull().defaultNow(),
    updatedAt: d.timestamp("updated_at").notNull().defaultNow(),
  }),
  (t) => [
    uniqueIndex("training_session_strava_activity_unique").on(
      t.stravaActivityId,
    ),
  ],
);

export type TrainingSession = typeof trainingSession.$inferSelect;

export const trainingSessionExercise = createTable(
  "training_session_exercise",
  (d) => ({
    id: d.uuid("id").primaryKey().defaultRandom(),
    sessionId: d
      .uuid("session_id")
      .notNull()
      .references(() => trainingSession.id, { onDelete: "cascade" }),
    templateExerciseId: d
      .uuid("template_exercise_id")
      .references(() => trainingExercise.id, { onDelete: "set null" }),
    name: d.text("name").notNull(),
    position: d.integer("position").notNull(),
    createdAt: d.timestamp("created_at").notNull().defaultNow(),
    updatedAt: d.timestamp("updated_at").notNull().defaultNow(),
  }),
  (t) => [
    index("training_session_exercise_session_position_idx").on(
      t.sessionId,
      t.position,
    ),
  ],
);

export const trainingSessionSet = createTable(
  "training_session_set",
  (d) => ({
    id: d.uuid("id").primaryKey().defaultRandom(),
    sessionExerciseId: d
      .uuid("session_exercise_id")
      .notNull()
      .references(() => trainingSessionExercise.id, { onDelete: "cascade" }),
    setIndex: d.integer("set_index").notNull(),
    reps: d.integer("reps").notNull(),
    weight: d.numeric("weight", { precision: 6, scale: 2 }),
    isDone: d.boolean("is_done").notNull().default(false),
    createdAt: d.timestamp("created_at").notNull().defaultNow(),
    updatedAt: d.timestamp("updated_at").notNull().defaultNow(),
  }),
  (t) => [
    index("training_session_set_exercise_set_idx").on(
      t.sessionExerciseId,
      t.setIndex,
    ),
  ],
);

export const trainingSessionCardio = createTable(
  "training_session_cardio",
  (d) => ({
    id: d.uuid("id").primaryKey().defaultRandom(),
    sessionId: d
      .uuid("session_id")
      .notNull()
      .references(() => trainingSession.id, { onDelete: "cascade" }),
    durationMin: d.integer("duration_min").notNull(),
    distanceKm: d.numeric("distance_km", { precision: 5, scale: 2 }),
    kcal: d.integer("kcal"),
    avgHr: d.integer("avg_hr"),
    cadence: d.integer("cadence"),
    avgSpeedKmh: d.numeric("avg_speed_kmh", { precision: 5, scale: 2 }),
    maxSpeedKmh: d.numeric("max_speed_kmh", { precision: 5, scale: 2 }),
    avgPowerW: d.integer("avg_power_w"),
    notes: d.text("notes"),
    createdAt: d.timestamp("created_at").notNull().defaultNow(),
    updatedAt: d.timestamp("updated_at").notNull().defaultNow(),
  }),
  (t) => [
    uniqueIndex("training_session_cardio_session_unique").on(t.sessionId),
  ],
);

export type TrainingSessionCardio = typeof trainingSessionCardio.$inferSelect;

// ─── Food Tracking ───────────────────────────────────────────────────────────

export const shoppingCategory = createTable(
  "shopping_category",
  (d) => ({
    id: d.uuid("id").primaryKey().defaultRandom(),
    userId: d
      .text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: d.text("name").notNull(),
    position: d.integer("position").notNull(),
    createdAt: d.timestamp("created_at").notNull().defaultNow(),
    updatedAt: d.timestamp("updated_at").notNull().defaultNow(),
  }),
  (t) => [index("shopping_category_user_position_idx").on(t.userId, t.position)],
);

export type ShoppingCategory = typeof shoppingCategory.$inferSelect;

export const foodSourceEnum = pgEnum("food_source", [
  "openfoodfacts",
  "ai_estimate",
  "manual",
]);

export const foodProduct = createTable(
  "food_product",
  (d) => ({
    id: d.uuid("id").primaryKey().defaultRandom(),
    userId: d
      .text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: d.text("name").notNull(),
    brand: d.text("brand"),
    categoryId: d
      .uuid("category_id")
      .references(() => shoppingCategory.id, { onDelete: "set null" }),
    source: foodSourceEnum("source").notNull(),
    sourceId: d.text("source_id"),
    imageUrl: d.text("image_url"),
    isVerified: d.boolean("is_verified").notNull().default(false),
    kcalPer100g: d.numeric("kcal_per_100g", { precision: 7, scale: 2 }).notNull(),
    proteinPer100g: d.numeric("protein_per_100g", { precision: 7, scale: 2 }).notNull(),
    carbsPer100g: d.numeric("carbs_per_100g", { precision: 7, scale: 2 }).notNull(),
    fatPer100g: d.numeric("fat_per_100g", { precision: 7, scale: 2 }).notNull(),
    fiberPer100g: d.numeric("fiber_per_100g", { precision: 7, scale: 2 }),
    defaultServingG: d.integer("default_serving_g").notNull().default(100),
    portionLabel: d.text("portion_label"),
    createdAt: d.timestamp("created_at").notNull().defaultNow(),
    updatedAt: d.timestamp("updated_at").notNull().defaultNow(),
  }),
  (t) => [
    index("food_product_user_name_idx").on(t.userId, t.name),
    uniqueIndex("food_product_user_source_id_unique").on(
      t.userId,
      t.source,
      t.sourceId,
    ),
  ],
);

export type FoodProduct = typeof foodProduct.$inferSelect;

export const mealTypeEnum = pgEnum("meal_type", [
  "breakfast",
  "lunch",
  "dinner",
  "snack",
]);

export const mealEntry = createTable(
  "meal_entry",
  (d) => ({
    id: d.uuid("id").primaryKey().defaultRandom(),
    userId: d
      .text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    date: d.date("date").notNull(),
    mealType: mealTypeEnum("meal_type").notNull(),
    foodProductId: d
      .uuid("food_product_id")
      .notNull()
      .references(() => foodProduct.id, { onDelete: "cascade" }),
    amountG: d.numeric("amount_g", { precision: 7, scale: 1 }).notNull(),
    notes: d.text("notes"),
    kcal: d.numeric("kcal", { precision: 7, scale: 1 }),
    protein: d.numeric("protein", { precision: 7, scale: 2 }),
    carbs: d.numeric("carbs", { precision: 7, scale: 2 }),
    fat: d.numeric("fat", { precision: 7, scale: 2 }),
    fiber: d.numeric("fiber", { precision: 7, scale: 2 }),
    position: d.integer("position").notNull().default(0),
    createdAt: d.timestamp("created_at").notNull().defaultNow(),
    updatedAt: d.timestamp("updated_at").notNull().defaultNow(),
  }),
  (t) => [
    index("meal_entry_user_date_idx").on(t.userId, t.date),
    index("meal_entry_user_date_meal_idx").on(t.userId, t.date, t.mealType),
  ],
);

export type MealEntry = typeof mealEntry.$inferSelect;

export const mealTemplate = createTable(
  "meal_template",
  (d) => ({
    id: d.uuid("id").primaryKey().defaultRandom(),
    userId: d
      .text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: d.text("name").notNull(),
    mealType: mealTypeEnum("meal_type"),
    createdAt: d.timestamp("created_at").notNull().defaultNow(),
    updatedAt: d.timestamp("updated_at").notNull().defaultNow(),
  }),
  (t) => [index("meal_template_user_idx").on(t.userId)],
);

export type MealTemplate = typeof mealTemplate.$inferSelect;

export const mealTemplateItem = createTable(
  "meal_template_item",
  (d) => ({
    id: d.uuid("id").primaryKey().defaultRandom(),
    templateId: d
      .uuid("template_id")
      .notNull()
      .references(() => mealTemplate.id, { onDelete: "cascade" }),
    foodProductId: d
      .uuid("food_product_id")
      .notNull()
      .references(() => foodProduct.id, { onDelete: "cascade" }),
    amountG: d.numeric("amount_g", { precision: 7, scale: 1 }).notNull(),
    position: d.integer("position").notNull().default(0),
    createdAt: d.timestamp("created_at").notNull().defaultNow(),
    updatedAt: d.timestamp("updated_at").notNull().defaultNow(),
  }),
);

export type MealTemplateItem = typeof mealTemplateItem.$inferSelect;

// ─── Relations ───────────────────────────────────────────────────────────────

export const mealEntryRelations = relations(mealEntry, ({ one }) => ({
  product: one(foodProduct, {
    fields: [mealEntry.foodProductId],
    references: [foodProduct.id],
  }),
}));

export const foodProductRelations = relations(foodProduct, ({ one }) => ({
  category: one(shoppingCategory, {
    fields: [foodProduct.categoryId],
    references: [shoppingCategory.id],
  }),
}));

export const mealTemplateRelations = relations(mealTemplate, ({ many }) => ({
  items: many(mealTemplateItem),
}));

export const mealTemplateItemRelations = relations(mealTemplateItem, ({ one }) => ({
  template: one(mealTemplate, {
    fields: [mealTemplateItem.templateId],
    references: [mealTemplate.id],
  }),
  product: one(foodProduct, {
    fields: [mealTemplateItem.foodProductId],
    references: [foodProduct.id],
  }),
}));
