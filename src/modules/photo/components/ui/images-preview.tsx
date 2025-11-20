import { X } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

type ImagesPreviewProps = {
  imageFiles: File[];
  onDelete: (index: number) => void;
};

function ImagesPreview({ imageFiles, onDelete }: ImagesPreviewProps) {
  const [objectUrls, setObjectUrls] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  useEffect(() => {
    const urls = imageFiles.map((file) => {
      const createdUrl = URL.createObjectURL(file);
      return createdUrl;
    });
    setObjectUrls(urls);

    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [imageFiles]);

  const handleDelete = (index: number) => {
    const url = objectUrls[index];
    if (url) {
      URL.revokeObjectURL(url);
    }
    onDelete(index);
  };

  const selectedUrl =
    selectedIndex !== null ? (objectUrls[selectedIndex] ?? null) : null;

  return (
    <>
      {imageFiles && imageFiles.length > 0 && (
        <div>
          <CardTitle className="text-lg">
            {imageFiles.length === 1 ? "Selected photo" : "Selected images"}
          </CardTitle>
          <div
            className={
              imageFiles.length === 1
                ? "mt-2 w-40"
                : "mt-2 grid grid-cols-2 gap-4 md:grid-cols-3"
            }
          >
            {imageFiles.map((file, index) => {
              const objectUrl = objectUrls[index];
              if (!objectUrl) return null;

              const handleClick = () => {
                setSelectedIndex(index);
              };

              return (
                <div
                  key={index}
                  className="group relative aspect-square cursor-pointer"
                  onClick={handleClick}
                >
                  <Image
                    src={objectUrl}
                    alt={`Preview ${index + 1}`}
                    fill
                    className="rounded-md object-cover"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleDelete(index);
                    }}
                    className="absolute top-0 right-0 size-6 rounded-full p-1 opacity-0 transition-all group-hover:opacity-100"
                  >
                    <X className="text-foreground h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {selectedUrl && (
        <Dialog
          open
          onOpenChange={(open) => {
            if (!open) {
              setSelectedIndex(null);
            }
          }}
        >
          <DialogTitle className="sr-only">Selected photo</DialogTitle>
          <DialogContent className="max-w-3xl border-none bg-transparent p-0 shadow-none">
            <div className="relative h-[70vh] w-full">
              <Image
                src={selectedUrl}
                alt={
                  selectedIndex !== null
                    ? `Selected preview ${selectedIndex + 1}`
                    : "Selected preview"
                }
                fill
                className="rounded-md object-contain"
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

export default ImagesPreview;
