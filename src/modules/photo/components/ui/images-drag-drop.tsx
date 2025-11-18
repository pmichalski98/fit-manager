"use client";

import { Upload } from "lucide-react";
import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import type { UseFormReturn } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { ACCEPTED_IMAGE_TYPES, MAX_FILE_SIZE } from "@/lib/constants";

import type { PhotoFormValues } from "@/modules/photo/schemas";

type ImagesDragDropProps = {
  form: UseFormReturn<PhotoFormValues>;
  /**
   * UI text overrides.
   */
  title?: string;
  description?: string;
  buttonLabel?: string;
};

function ImagesDragDrop({
  form,
  title = "Upload Images",
  description = "Drag and drop your images here, or click to browse",
  buttonLabel = "Choose Files",
}: ImagesDragDropProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const filesToUse = acceptedFiles.slice(0, 1);

      if (filesToUse.length === 0) return;

      const invalidType = filesToUse.find(
        (file) => !ACCEPTED_IMAGE_TYPES.includes(file.type),
      );
      if (invalidType) {
        toast.error("Unsupported file type");
        return;
      }

      const tooLarge = filesToUse.find((file) => file.size > MAX_FILE_SIZE);
      if (tooLarge) {
        toast.error("File is too large");
        return;
      }

      // Update react-hook-form value
      const value = filesToUse[0]!;

      form.setValue("image", value, {
        shouldValidate: true,
      });
    },
    [form],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_IMAGE_TYPES.reduce(
      (acc, type) => {
        acc[type] = [];
        return acc;
      },
      {} as Record<string, string[]>,
    ),
    multiple: false,
    maxFiles: 1,
    maxSize: MAX_FILE_SIZE,
    onDropRejected: () => {
      toast.error("File was rejected", { position: "top-center" });
    },
  });

  return (
    <FormField
      control={form.control}
      name="image"
      render={() => (
        <FormItem>
          <FormControl>
            <div
              {...getRootProps()}
              className={`cursor-pointer rounded-md border-2 border-dashed p-4 text-center ${
                isDragActive ? "border-primary bg-primary/5" : "border-border"
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="text-muted-foreground mx-auto mb-4 h-12 w-12" />

              <h3 className="text-foreground mb-2 text-lg font-medium">
                {title}
              </h3>
              <p className="text-muted-foreground mb-4">{description}</p>
              <Button
                type="button"
                variant="outline"
                className="gap-2 bg-transparent"
              >
                <Upload className="h-4 w-4" />
                {buttonLabel}
              </Button>
              <p className="text-muted-foreground mt-2 text-xs">
                Supported formats:{" "}
                {ACCEPTED_IMAGE_TYPES.map((type) =>
                  type.split("/")[1]?.toUpperCase(),
                ).join(", ")}{" "}
                ( Max {(MAX_FILE_SIZE / 1000000).toFixed(0)} MB )
              </p>
            </div>
          </FormControl>

          <FormMessage />
        </FormItem>
      )}
    />
  );
}

export default ImagesDragDrop;
