"use server";

import { revalidatePath } from "next/cache";

import { ACCEPTED_IMAGE_TYPES, MAX_FILE_SIZE } from "@/lib/constants";
import { requireUserId } from "@/lib/user";
import { deleteImageFromS3, uploadImageToS3 } from "@/server/s3";

import { photoRepository } from "./repositories";
import { photoSchema, type PhotoFormValues } from "./schemas";

export async function uploadPhoto(values: PhotoFormValues) {
  const userId = await requireUserId();

  try {
    const parsed = photoSchema.safeParse(values);

    if (!parsed.success) {
      return {
        ok: false as const,
        data: null,
        error: parsed.error.message,
      };
    }

    const { date, weight, image } = parsed.data;

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

    const imageUrl = await uploadImageToS3(image);

    const created = await photoRepository.createPhoto({
      userId,
      date,
      weight: weight ?? null,
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

export async function getPhotos() {
  const userId = await requireUserId();
  try {
    const photos = await photoRepository.getPhotos(userId);
    return { ok: true, data: photos };
  } catch (error) {
    console.error(error);
    return { ok: false, data: null, error: "Internal server error" };
  }
}

export async function deletePhoto(id: string) {
  const userId = await requireUserId();

  try {
    const deleted = await photoRepository.deletePhoto(id, userId);

    if (!deleted) {
      return {
        ok: false as const,
        error: "Photo not found or unauthorized",
      };
    }

    try {
      await deleteImageFromS3(deleted.imageUrl);
    } catch (error) {
      console.error("Failed to delete image from S3", error);
    }

    revalidatePath("/photo");
    return { ok: true as const, data: deleted, error: null };
  } catch (error) {
    console.error(error);
    return {
      ok: false as const,
      error: "Internal server error",
    };
  }
}
