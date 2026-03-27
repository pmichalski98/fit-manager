import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

import { env } from "@/env";

const REGION = process.env.AWS_REGION ?? "eu-central-1";

const s3Client = new S3Client({
  region: REGION,
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  },
});

function buildS3Url(key: string): string {
  return `https://${env.AWS_S3_BUCKET_NAME}.s3.${REGION}.amazonaws.com/${key}`;
}

export async function uploadBufferToS3(
  buffer: Buffer,
  key: string,
  contentType: string,
) {
  try {
    await s3Client.send(
      new PutObjectCommand({
        Bucket: env.AWS_S3_BUCKET_NAME,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      }),
    );

    return buildS3Url(key);
  } catch (error) {
    console.error(error);
    throw new Error("Failed to upload buffer to S3");
  }
}

export async function uploadImageToS3(file: File) {
  const key = crypto.randomUUID();
  const buffer = Buffer.from(await file.arrayBuffer());
  return uploadBufferToS3(buffer, key, file.type);
}

export async function deleteImageFromS3(imageUrl: string) {
  try {
    const url = new URL(imageUrl);
    const key = url.pathname.slice(1); // removes leading "/"

    if (!key) {
      throw new Error("Invalid image URL");
    }

    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: env.AWS_S3_BUCKET_NAME,
        Key: key,
      }),
    );
  } catch (error) {
    console.error(error);
    throw new Error("Failed to delete image from S3");
  }
}
