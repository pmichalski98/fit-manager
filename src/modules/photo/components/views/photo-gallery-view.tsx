import React from "react";

import { getPhotos } from "../../actions";
import PhotoGalleryClient from "../ui/photo-gallery-client";

export default async function PhotoGalleryView() {
  const { data: photos, error } = await getPhotos();

  if (error) {
    return (
      <div className="rounded-[10px] border border-dashed p-12 text-center">
        <p className="text-muted-foreground text-sm">
          There was a problem loading your photos.
        </p>
      </div>
    );
  }

  if (!photos || photos.length === 0) {
    return (
      <div className="rounded-[10px] border border-dashed p-12 text-center">
        <p className="text-muted-foreground text-sm">
          You don&apos;t have any photos yet. Add your first progress photo to
          start comparing.
        </p>
      </div>
    );
  }

  return <PhotoGalleryClient photos={photos} />;
}
