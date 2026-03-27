/**
 * OpenFoodFacts CSV import script.
 *
 * Downloads the full OFF CSV dump and upserts products into the off_product table.
 * Streams the gzipped file to keep memory usage low (~100MB peak).
 *
 * Usage:
 *   bun scripts/off-import.ts
 *
 * Requires DATABASE_URL env var.
 */

import { createGunzip } from "zlib";
import { Readable } from "stream";
import postgres from "postgres";

const CSV_URL =
  "https://static.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz";
const BATCH_SIZE = 1000;

// Column names we need from the CSV header
const NEEDED_COLUMNS = [
  "code",
  "product_name",
  "brands",
  "image_small_url",
  "energy-kcal_100g",
  "proteins_100g",
  "carbohydrates_100g",
  "fat_100g",
  "fiber_100g",
] as const;

type ColumnIndices = Record<(typeof NEEDED_COLUMNS)[number], number>;

interface ProductRow {
  code: string;
  name: string;
  brands: string | null;
  image_url: string | null;
  kcal_per_100g: number | null;
  protein_per_100g: number | null;
  carbs_per_100g: number | null;
  fat_per_100g: number | null;
  fiber_per_100g: number | null;
}

function parseFloat(val: string): number | null {
  if (!val || val === "") return null;
  const n = Number(val);
  return Number.isFinite(n) ? n : null;
}

function parseLine(line: string, indices: ColumnIndices): ProductRow | null {
  const cols = line.split("\t");

  const code = cols[indices["code"]]?.trim();
  const name = cols[indices["product_name"]]?.trim();
  if (!code || !name) return null;

  const kcal = parseFloat(cols[indices["energy-kcal_100g"]] ?? "");
  const protein = parseFloat(cols[indices["proteins_100g"]] ?? "");

  // Skip products with no meaningful nutrition data
  if ((kcal === null || kcal === 0) && protein === null) return null;

  return {
    code,
    name,
    brands: cols[indices["brands"]]?.trim() || null,
    image_url: cols[indices["image_small_url"]]?.trim() || null,
    kcal_per_100g: kcal,
    protein_per_100g: protein,
    carbs_per_100g: parseFloat(cols[indices["carbohydrates_100g"]] ?? ""),
    fat_per_100g: parseFloat(cols[indices["fat_100g"]] ?? ""),
    fiber_per_100g: parseFloat(cols[indices["fiber_100g"]] ?? ""),
  };
}

function parseHeader(headerLine: string): ColumnIndices {
  const headers = headerLine.split("\t");
  const indices = {} as Record<string, number>;

  for (const col of NEEDED_COLUMNS) {
    const idx = headers.indexOf(col);
    if (idx === -1) {
      throw new Error(`Required column "${col}" not found in CSV header`);
    }
    indices[col] = idx;
  }

  return indices as ColumnIndices;
}

async function upsertBatch(sql: postgres.Sql, batch: ProductRow[]) {
  if (batch.length === 0) return;

  await sql`
    INSERT INTO "fit-manager_off_product" ${sql(
      batch,
      "code",
      "name",
      "brands",
      "image_url",
      "kcal_per_100g",
      "protein_per_100g",
      "carbs_per_100g",
      "fat_per_100g",
      "fiber_per_100g",
    )}
    ON CONFLICT ("code") DO UPDATE SET
      "name" = EXCLUDED."name",
      "brands" = EXCLUDED."brands",
      "image_url" = EXCLUDED."image_url",
      "kcal_per_100g" = EXCLUDED."kcal_per_100g",
      "protein_per_100g" = EXCLUDED."protein_per_100g",
      "carbs_per_100g" = EXCLUDED."carbs_per_100g",
      "fat_per_100g" = EXCLUDED."fat_per_100g",
      "fiber_per_100g" = EXCLUDED."fiber_per_100g"
  `;
}

async function* streamLines(
  response: Response,
): AsyncGenerator<string, void, unknown> {
  const gunzip = createGunzip();
  const nodeStream = Readable.fromWeb(response.body! as never);
  const decompressed = nodeStream.pipe(gunzip);

  let buffer = "";
  for await (const chunk of decompressed) {
    buffer += chunk.toString("utf-8");
    const lines = buffer.split("\n");
    // Keep the last incomplete line in the buffer
    buffer = lines.pop()!;
    for (const line of lines) {
      if (line.trim()) yield line;
    }
  }
  // Emit the last line if any
  if (buffer.trim()) yield buffer;
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("DATABASE_URL environment variable is required");
    process.exit(1);
  }

  const sql = postgres(databaseUrl);

  try {
    console.log("Downloading OpenFoodFacts CSV dump...");
    console.log(`URL: ${CSV_URL}`);

    const response = await fetch(CSV_URL, {
      headers: {
        "User-Agent": "FitManager/1.0 (personal fitness app, weekly sync)",
      },
    });

    if (!response.ok || !response.body) {
      throw new Error(`Download failed: HTTP ${response.status}`);
    }

    const contentLength = response.headers.get("content-length");
    if (contentLength) {
      console.log(
        `Download size: ${(Number(contentLength) / 1024 / 1024).toFixed(0)} MB compressed`,
      );
    }

    let isFirstLine = true;
    let indices: ColumnIndices | null = null;
    let batch: ProductRow[] = [];
    let totalInserted = 0;
    let totalSkipped = 0;
    const startTime = Date.now();

    for await (const line of streamLines(response)) {
      if (isFirstLine) {
        indices = parseHeader(line);
        isFirstLine = false;
        console.log("CSV header parsed, starting import...");
        continue;
      }

      const product = parseLine(line, indices!);
      if (!product) {
        totalSkipped++;
        continue;
      }

      batch.push(product);

      if (batch.length >= BATCH_SIZE) {
        await upsertBatch(sql, batch);
        totalInserted += batch.length;
        batch = [];

        if (totalInserted % 50_000 === 0) {
          const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
          console.log(
            `  ${totalInserted.toLocaleString()} products imported (${elapsed}s elapsed, ${totalSkipped.toLocaleString()} skipped)`,
          );
        }
      }
    }

    // Flush remaining batch
    if (batch.length > 0) {
      await upsertBatch(sql, batch);
      totalInserted += batch.length;
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
    console.log(`\nImport complete!`);
    console.log(`  Total imported: ${totalInserted.toLocaleString()}`);
    console.log(`  Total skipped: ${totalSkipped.toLocaleString()}`);
    console.log(`  Duration: ${elapsed}s`);

    // Verify count
    const result = await sql`
      SELECT count(*)::int AS count FROM "fit-manager_off_product"
    `;
    console.log(`  Table row count: ${(result[0]?.count as number ?? 0).toLocaleString()}`);
  } finally {
    await sql.end();
  }
}

main().catch((err) => {
  console.error("Import failed:", err);
  process.exit(1);
});
