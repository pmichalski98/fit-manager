import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

import { env } from "@/env";

const REGION = process.env.AWS_REGION ?? "us-east-1";

const s3Client = new S3Client({
  region: REGION,
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  },
});

type UploadImageParams = {
  key: string;
  file: File;
  contentType: string;
};

export async function uploadImageToS3(params: UploadImageParams) {
  const { key, file, contentType } = params;

  const arrayBuffer = await file.arrayBuffer();
  const body = Buffer.from(arrayBuffer);

  await s3Client.send(
    new PutObjectCommand({
      Bucket: env.AWS_S3_BUCKET_NAME,
      Key: key,
      Body: body,
      ContentType: contentType,
      ACL: "public-read",
    }),
  );

  const cdnBaseUrl = process.env.CDN_BASE_URL;

  if (cdnBaseUrl && cdnBaseUrl.length > 0) {
    const normalizedBase = cdnBaseUrl.endsWith("/")
      ? cdnBaseUrl.slice(0, -1)
      : cdnBaseUrl;

    return `${normalizedBase}/${key}`;
  }

  return `https://${env.AWS_S3_BUCKET_NAME}.s3.amazonaws.com/${key}`;
}
