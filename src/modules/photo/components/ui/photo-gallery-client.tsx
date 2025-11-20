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

  const isSelected = (id: string) => selectedIds.includes(id);

  return (
    <div className="space-y-8">
      <DeletePhotoDialog
        open={!!photoToDelete}
        onOpenChange={(open) => !open && setPhotoToDelete(null)}
        onConfirm={handleDeletePhoto}
        isDeleting={isDeleting}
      />

      <PhotoComparison selectedPhotos={selectedPhotos} />

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-lg font-semibold tracking-tight">
            All progress photos
          </h3>
          <p className="text-muted-foreground text-xs">
            Click any photo to select or deselect it for comparison.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {photos.map((photo) => (
            <PhotoCard
              key={photo.id}
              photo={photo}
              selected={isSelected(photo.id)}
              onToggleSelect={handleToggleSelect}
              onDelete={setPhotoToDelete}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
