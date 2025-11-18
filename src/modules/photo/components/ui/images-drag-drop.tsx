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

type ImagesDragDropProps = {
  form: UseFormReturn<
    {
      date: string;
      userImages: File[];
      weight: string;
    },
    unknown,
    {
      date: string;
      userImages: File[];
      weight: string;
    }
  >;
};
function ImagesDragDrop({ form }: ImagesDragDropProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      form.setValue(
        "userImages",
        [...form.getValues("userImages"), ...acceptedFiles],
        {
          shouldValidate: true,
        },
      );
    },
    [form],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".webp", ".gif"],
    },
    maxFiles: 20,
    onDropRejected: (errors) => {
      toast.error(errors[0]?.errors[0]?.message, {
        position: "top-center",
      });
    },
  });

  return (
    <>
      <FormField
        control={form.control}
        name="userImages"
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <div
                {...getRootProps()}
                className={`cursor-pointer rounded-md border-2 border-dashed p-4 text-center ${
                  isDragActive ? "border-primary" : "border-border"
                }`}
              >
                <input {...getInputProps()} />
                <Upload className="text-muted-foreground mx-auto mb-4 h-12 w-12" />

                <h3 className="text-foreground mb-2 text-lg font-medium">
                  Upload Training Images
                </h3>
                <p className="text-muted-foreground mb-4">
                  Drag and drop your images here, or click to browse
                </p>
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2 bg-transparent"
                >
                  <Upload className="h-4 w-4" />
                  Choose Files
                </Button>
                <p className="text-muted-foreground mt-2 text-xs">
                  Supported formats:{" "}
                  {ACCEPTED_IMAGE_TYPES.map((type) =>
                    type.split("/")[1]?.toUpperCase(),
                  ).join(", ")}{" "}
                  ( Max {MAX_FILE_SIZE / 1000000}MB each)
                </p>
              </div>
            </FormControl>

            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
}
export default ImagesDragDrop;
