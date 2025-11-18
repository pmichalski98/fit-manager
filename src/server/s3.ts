import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

import { env } from "@/env";

const REGION = process.env.AWS_REGION ?? "eu-central-1";

const s3Client = new S3Client({
  region: REGION,
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  },
});

export async function uploadImageToS3(file: File) {
  const imageId = crypto.randomUUID();
  const arrayBuffer = await file.arrayBuffer();
  const body = Buffer.from(arrayBuffer);

  try {
    await s3Client.send(
      new PutObjectCommand({
        Bucket: env.AWS_S3_BUCKET_NAME,
        Key: imageId,
        Body: body,
        ContentType: file.type,
      }),
    );

    return `https://${env.AWS_S3_BUCKET_NAME}.s3.${REGION}.amazonaws.com/${imageId}`;
  } catch (error) {
    console.error(error);
    throw new Error("Failed to upload image to S3");
  }
}
