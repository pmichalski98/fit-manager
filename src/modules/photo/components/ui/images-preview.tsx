import { X } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { CardTitle } from "@/components/ui/card";

type ImagesPreviewProps = {
  imageFiles: File[];
  onDelete: (index: number) => void;
};

function ImagesPreview({ imageFiles, onDelete }: ImagesPreviewProps) {
  const [objectUrls, setObjectUrls] = useState<string[]>([]);

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
  return (
    <>
      {imageFiles && imageFiles.length > 0 && (
        <div className="">
          <CardTitle className="text-lg">Selected images</CardTitle>
          <div className="mt-2 grid grid-cols-2 gap-4 md:grid-cols-3">
            {imageFiles.map((file, index) => {
              const objectUrl = objectUrls[index];
              if (!objectUrl) return null;

              return (
                <div key={index} className="group relative aspect-square">
                  <Image
                    src={objectUrl}
                    alt={`Preview ${index + 1}`}
                    fill
                    className="rounded-md object-cover"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => handleDelete(index)}
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
    </>
  );
}

export default ImagesPreview;
