import fs from "fs";
import path from "path";
import crypto from "crypto";
import postgres from "postgres";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const sql = postgres(connectionString, { max: 1 });

// Read the journal to get ordered migrations
const journalPath = path.join("drizzle", "meta", "_journal.json");
const journal = JSON.parse(fs.readFileSync(journalPath, "utf-8")) as {
  entries: { idx: number; tag: string; when: number; breakpoints: boolean }[];
};

// Ensure migrations tracking table exists
await sql`CREATE SCHEMA IF NOT EXISTS drizzle`;
await sql`
  CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (
    id SERIAL PRIMARY KEY,
    hash TEXT NOT NULL,
    created_at BIGINT
  )
`;

// Get already-applied migration hashes
const applied = await sql<{ hash: string }[]>`
  SELECT hash FROM drizzle.__drizzle_migrations
`;
const appliedHashes = new Set(applied.map((r) => r.hash));

for (const entry of journal.entries) {
  const filePath = path.join("drizzle", `${entry.tag}.sql`);
  const content = fs.readFileSync(filePath, "utf-8");
  const hash = crypto.createHash("sha256").update(content).digest("hex");

  if (appliedHashes.has(hash)) {
    console.log(`  ✓ ${entry.tag} (already applied)`);
    continue;
  }

  // Split by breakpoints and execute each statement
  const statements = content
    .split("--> statement-breakpoint")
    .map((s) => s.trim())
    .filter(Boolean);

  console.log(`  → Applying ${entry.tag} (${statements.length} statements)...`);

  for (const statement of statements) {
    try {
      await sql.unsafe(statement);
    } catch (err: any) {
      // Skip "already exists" errors for idempotency (re-running after partial apply)
      const alreadyExists = ["42710", "42P07", "42P06", "42701"].includes(err.code);
      if (alreadyExists) {
        console.log(`    ⚠ Skipped (already exists): ${err.message}`);
      } else {
        throw err;
      }
    }
  }

  // Record migration as applied
  await sql`
    INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
    VALUES (${hash}, ${Date.now()})
  `;
  console.log(`  ✓ ${entry.tag} applied`);
}

console.log("All migrations up to date.");
await sql.end();
