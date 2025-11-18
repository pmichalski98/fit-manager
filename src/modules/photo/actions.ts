"use server";

import { revalidatePath } from "next/cache";

import { ACCEPTED_IMAGE_TYPES, MAX_FILE_SIZE } from "@/lib/constants";
import { requireUserId } from "@/lib/user";
import { uploadImageToS3 } from "@/server/s3";

import { photoRepository } from "./repositories";
import { photoSchema } from "./schemas";

const photoDataSchema = photoSchema.omit({ image: true });

export async function uploadPhoto(formData: FormData) {
  const userId = await requireUserId();

  try {
    const date = formData.get("date");
    const weight = formData.get("weight");
    const image = formData.get("image");

    const parsed = photoDataSchema.safeParse({
      date,
      weight,
    });

    if (!parsed.success) {
      return {
        ok: false as const,
        data: null,
        error: parsed.error.message,
      };
    }

    if (!(image instanceof File)) {
      return {
        ok: false as const,
        data: null,
        error: "Image is required",
      };
    }

    if (!ACCEPTED_IMAGE_TYPES.includes(image.type)) {
      return {
        ok: false as const,
        data: null,
        error: "Unsupported image type",
      };
    }

    if (image.size > MAX_FILE_SIZE) {
      return {
        ok: false as const,
        data: null,
        error: "Image is too large",
      };
    }

    const extension = image.name.split(".").pop() ?? "jpg";
    const timestamp = Date.now();
    const key = `users/${userId}/photos/${parsed.data.date}-${timestamp}.${extension}`;

    const imageUrl = await uploadImageToS3({
      key,
      file: image,
      contentType: image.type,
    });

    const created = await photoRepository.createPhoto({
      userId,
      date: parsed.data.date,
      weight: parsed.data.weight ?? null,
      imageUrl,
    });

    revalidatePath("/photo");

    return {
      ok: true as const,
      data: created,
      error: null,
    };
  } catch (error) {
    console.error(error);
    return {
      ok: false as const,
      data: null,
      error: "Internal server error",
    };
  }
}
