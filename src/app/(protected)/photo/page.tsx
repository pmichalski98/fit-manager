import { Suspense } from "react";

import { AddPhotoDialog } from "@/modules/photo/components/ui/add-photo-dialog";
import { PhotoGallerySkeleton } from "@/modules/photo/components/ui/photo-gallery-skeleton";
import PhotoGalleryView from "@/modules/photo/components/views/photo-gallery-view";

export default async function PhotoPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Photos</h1>
          <p className="text-muted-foreground">
            Upload progress photos with date and weight.
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
