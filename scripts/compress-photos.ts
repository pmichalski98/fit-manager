// One-off cleanup: recompress existing S3 progress photos in place.
// Downloads every image object, resizes to max 1600px, converts to WebP and
// overwrites the same key (URLs stored in the DB stay valid). Objects already
// stored as image/webp are skipped, so the script is safe to re-run.
//
// Usage:
//   bun scripts/compress-photos.ts --dry-run   # report only, no writes
//   bun scripts/compress-photos.ts             # compress and overwrite
import {
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import sharp from "sharp";

// Keep in sync with src/server/s3.ts
const MAX_DIMENSION = 1600;
const WEBP_QUALITY = 80;
const CACHE_CONTROL = "public, max-age=31536000, immutable";

const bucket = process.env.AWS_S3_BUCKET_NAME;
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

if (!bucket || !accessKeyId || !secretAccessKey) {
  console.error(
    "AWS_S3_BUCKET_NAME, AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY must be set",
  );
  process.exit(1);
}

const dryRun = process.argv.includes("--dry-run");

const client = new S3Client({
  region: process.env.AWS_REGION ?? "eu-central-1",
  credentials: { accessKeyId, secretAccessKey },
});

const keys: string[] = [];
let continuationToken: string | undefined;
do {
  const page = await client.send(
    new ListObjectsV2Command({
      Bucket: bucket,
      ContinuationToken: continuationToken,
    }),
  );
  keys.push(...(page.Contents ?? []).map((o) => o.Key!).filter(Boolean));
  continuationToken = page.IsTruncated ? page.NextContinuationToken : undefined;
} while (continuationToken);

console.log(
  `Found ${keys.length} objects in ${bucket}${dryRun ? " (dry run)" : ""}`,
);

const formatKB = (bytes: number) => `${(bytes / 1024).toFixed(0)} KB`;
let totalBefore = 0;
let totalAfter = 0;
let converted = 0;
let skipped = 0;

for (const key of keys) {
  const obj = await client.send(
    new GetObjectCommand({ Bucket: bucket, Key: key }),
  );
  const contentType = obj.ContentType ?? "";

  if (!contentType.startsWith("image/") || contentType === "image/webp") {
    console.log(`  ✓ ${key} skipped (${contentType || "no content type"})`);
    skipped++;
    continue;
  }

  const original = Buffer.from(await obj.Body!.transformToByteArray());
  const compressed = await sharp(original)
    .rotate()
    .resize(MAX_DIMENSION, MAX_DIMENSION, {
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: WEBP_QUALITY })
    .toBuffer();

  totalBefore += original.length;
  totalAfter += compressed.length;
  converted++;

  if (!dryRun) {
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: compressed,
        ContentType: "image/webp",
        CacheControl: CACHE_CONTROL,
      }),
    );
  }

  console.log(
    `  → ${key}: ${formatKB(original.length)} → ${formatKB(compressed.length)} (${contentType})`,
  );
}

console.log(
  `\n${dryRun ? "Would convert" : "Converted"} ${converted} images (${skipped} skipped): ` +
    `${formatKB(totalBefore)} → ${formatKB(totalAfter)}`,
);
