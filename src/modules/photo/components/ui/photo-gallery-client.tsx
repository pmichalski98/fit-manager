"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { deletePhoto } from "@/modules/photo/actions";
import { DeletePhotoDialog } from "@/modules/photo/components/ui/delete-photo-dialog";
import { PhotoCard } from "@/modules/photo/components/ui/photo-card";
import { PhotoComparison } from "@/modules/photo/components/ui/photo-comparison";
import type { Photo } from "@/modules/photo/types";

type PhotoGalleryClientProps = {
  photos: Photo[];
};

export default function PhotoGalleryClient({
  photos,
}: PhotoGalleryClientProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>(() =>
    photos.slice(0, 2).map((photo) => photo.id),
  );
  const [photoToDelete, setPhotoToDelete] = useState<string | null>(null);
  const [isDeleting, startTransition] = useTransition();

  const selectedPhotos = useMemo(
    () =>
      selectedIds
        .map((id) => photos.find((photo) => photo.id === id) ?? null)
        .filter((photo): photo is Photo => photo !== null),
    [photos, selectedIds],
  );

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev): string[] => {
      if (prev.includes(id)) {
        return prev.filter((selectedId) => selectedId !== id);
      }

      if (prev.length < 2) {
        return [...prev, id];
      }

      const second = prev[1]!;
      return [second, id];
    });
  };

  const handleDeletePhoto = () => {
    if (!photoToDelete) return;

    startTransition(async () => {
      const result = await deletePhoto(photoToDelete);

      if (result?.ok) {
        toast.success("Photo deleted successfully");
        setPhotoToDelete(null);
        // Remove from selection if it was selected
        setSelectedIds((prev) => prev.filter((id) => id !== photoToDelete));
      } else {
        toast.error(result?.error ?? "Failed to delete photo");
      }
    });
  };

  const selectionTag = (id: string): "A" | "B" | null =>
    selectedIds[0] === id ? "A" : selectedIds[1] === id ? "B" : null;

  return (
    <>
      <DeletePhotoDialog
        open={!!photoToDelete}
        onOpenChange={(open) => !open && setPhotoToDelete(null)}
        onConfirm={handleDeletePhoto}
        isDeleting={isDeleting}
      />

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,560px)_1fr]">
        <PhotoComparison selectedPhotos={selectedPhotos} />

        <div className="bg-card flex flex-col gap-3.5 rounded-[10px] border p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <h3 className="text-[11px] font-semibold tracking-[0.1em] uppercase">
              All photos{" "}
              <span className="text-faint font-mono tracking-normal">
                {photos.length}
              </span>
            </h3>
            <p className="text-faint text-[11px]">
              Click a photo to select it for comparison.
            </p>
          </div>

          <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-2.5">
            {photos.map((photo) => (
              <PhotoCard
                key={photo.id}
                photo={photo}
                selectionTag={selectionTag(photo.id)}
                onToggleSelect={handleToggleSelect}
                onDelete={setPhotoToDelete}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
