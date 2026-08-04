import { Suspense } from "react";

import { AddPhotoDialog } from "@/modules/photo/components/ui/add-photo-dialog";
import { PhotoGallerySkeleton } from "@/modules/photo/components/ui/photo-gallery-skeleton";
import PhotoGalleryView from "@/modules/photo/components/views/photo-gallery-view";

export default async function PhotoPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight">Photo</h1>
          <p className="text-muted-foreground mt-1 text-[11px] font-medium tracking-[0.08em] uppercase">
            Progress photos · compare your physique over time
          </p>
        </div>

        <AddPhotoDialog />
      </div>

      <Suspense fallback={<PhotoGallerySkeleton />}>
        <PhotoGalleryView />
      </Suspense>
    </div>
  );
}
