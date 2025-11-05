// Example model schema from the Drizzle docs
// https://orm.drizzle.team/docs/sql-schema-declaration

import { index, pgTableCreator, uniqueIndex } from "drizzle-orm/pg-core";

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = pgTableCreator((name) => `fit-manager_${name}`);

export const training = createTable("training", (d) => ({
  id: d.uuid("id").primaryKey().defaultRandom(),
  name: d.text("name").notNull(),
  exercises: d.text("exercises").array().notNull(),
  createdAt: d.timestamp("created_at").notNull().defaultNow(),
  updatedAt: d.timestamp("updated_at").notNull(),
  userId: d
    .text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
}));

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
  (t) => ({
    userDateIdx: index("daily_log_user_date_idx").on(t.userId, t.date),
    userDateUnique: uniqueIndex("daily_log_user_date_unique").on(
      t.userId,
      t.date,
    ),
  }),
);

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
    notes: d.text("notes"),
    createdAt: d.timestamp("created_at").notNull().defaultNow(),
    updatedAt: d.timestamp("updated_at").notNull().defaultNow(),
  }),
  (t) => ({
    userDateIdx: index("body_measurement_user_date_idx").on(t.userId, t.date),
  }),
);
