// Example model schema from the Drizzle docs
// https://orm.drizzle.team/docs/sql-schema-declaration

import { index, pgEnum, pgTableCreator, uniqueIndex } from "drizzle-orm/pg-core";

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = pgTableCreator((name) => `fit-manager_${name}`);

export const trainingTypeEnum = pgEnum("training_type", ["strength", "cardio"]);

export const training = createTable("training", (d) => ({
  id: d.uuid("id").primaryKey().defaultRandom(),
  name: d.text("name").notNull(),
  type: trainingTypeEnum("type").notNull(),
  createdAt: d.timestamp("created_at").notNull().defaultNow(),
  updatedAt: d.timestamp("updated_at").notNull().defaultNow(),
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
  (t) => ({
    trainingPositionIdx: index("training_exercise_training_position_idx").on(
      t.trainingId,
      t.position,
    ),
  }),
);

// Training session lifecycle and results
export const trainingSession = createTable("training_session", (d) => ({
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
  startAt: d.timestamp("start_at").notNull().defaultNow(),
  endAt: d.timestamp("end_at"),
  notes: d.text("notes"),
  createdAt: d.timestamp("created_at").notNull().defaultNow(),
  updatedAt: d.timestamp("updated_at").notNull().defaultNow(),
}));

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
  (t) => ({
    sessionPositionIdx: index("training_session_exercise_session_position_idx").on(
      t.sessionId,
      t.position,
    ),
  }),
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
    rpe: d.numeric("rpe", { precision: 3, scale: 1 }),
    rir: d.numeric("rir", { precision: 3, scale: 1 }),
    restSec: d.integer("rest_sec"),
    createdAt: d.timestamp("created_at").notNull().defaultNow(),
    updatedAt: d.timestamp("updated_at").notNull().defaultNow(),
  }),
  (t) => ({
    sessionExerciseSetIdx: index("training_session_set_exercise_set_idx").on(
      t.sessionExerciseId,
      t.setIndex,
    ),
  }),
);

export const trainingSessionCardio = createTable(
  "training_session_cardio",
  (d) => ({
    id: d.uuid("id").primaryKey().defaultRandom(),
    sessionId: d
      .uuid("session_id")
      .notNull()
      .references(() => trainingSession.id, { onDelete: "cascade" }),
    durationSec: d.integer("duration_sec").notNull(),
    distanceM: d.integer("distance_m"),
    kcal: d.integer("kcal"),
    avgHr: d.integer("avg_hr"),
    avgSpeedKmh: d.numeric("avg_speed_kmh", { precision: 5, scale: 2 }),
    avgPowerW: d.integer("avg_power_w"),
    notes: d.text("notes"),
    createdAt: d.timestamp("created_at").notNull().defaultNow(),
    updatedAt: d.timestamp("updated_at").notNull().defaultNow(),
  }),
  (t) => ({
    sessionUniqueIdx: uniqueIndex("training_session_cardio_session_unique").on(
      t.sessionId,
    ),
  }),
);
