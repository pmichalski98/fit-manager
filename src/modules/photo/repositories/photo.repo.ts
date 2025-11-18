import { db } from "@/server/db";
import { photo } from "@/server/db/schema";
import { desc, eq } from "drizzle-orm";

export type CreatePhotoValues = {
  userId: string;
  date: string;
  weight?: string | null;
  imageUrl: string;
};

class PhotoRepository {
  async createPhoto(values: CreatePhotoValues) {
    const [inserted] = await db
      .insert(photo)
      .values({
        userId: values.userId,
        date: values.date,
        // Store null when empty string or undefined
        weight:
          values.weight === "" || values.weight === undefined
            ? null
            : values.weight,
        imageUrl: values.imageUrl,
      })
      .returning();

    return inserted ?? null;
  }

  async getPhotos(userId: string) {
    const photos = await db
      .select()
      .from(photo)
      .where(eq(photo.userId, userId))
      .orderBy(desc(photo.date));
    return photos ?? [];
  }
}

export const photoRepository = new PhotoRepository();
