import React from "react";

import { getPhotos } from "../../actions";
import PhotoGalleryClient from "../ui/photo-gallery-client";

export default async function PhotoGalleryView() {
  const { data: photos, error } = await getPhotos();

  if (error) {
    return (
      <div className="py-12">
        <p className="text-muted-foreground">
          There was a problem loading your photos.
        </p>
      </div>
    );
  }

  if (!photos || photos.length === 0) {
    return (
      <div className="py-12">
        <p className="text-muted-foreground">
          You don&apos;t have any photos yet.
        </p>
      </div>
    );
  }

  return (
    <div className="">
      <PhotoGalleryClient photos={photos} />
    </div>
  );
}
