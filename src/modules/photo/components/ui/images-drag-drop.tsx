"use client";

import { Upload } from "lucide-react";
import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import type { UseFormReturn } from "react-hook-form";
import { toast } from "sonner";

import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { ACCEPTED_IMAGE_TYPES, MAX_FILE_SIZE } from "@/lib/constants";
import { cn } from "@/lib/utils";

import type { PhotoFormValues } from "@/modules/photo/schemas";

type ImagesDragDropProps = {
  form: UseFormReturn<PhotoFormValues>;
};

function ImagesDragDrop({ form }: ImagesDragDropProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const handleDrop = async () => {
        const filesToUse = acceptedFiles.slice(0, 1);

        if (filesToUse.length === 0) return;

        let file = filesToUse[0]!;
        const isHeic =
          file.type === "image/heic" ||
          file.type === "image/heif" ||
          file.name.toLowerCase().endsWith(".heic") ||
          file.name.toLowerCase().endsWith(".heif");

        if (isHeic) {
          const toastId = toast.loading("Converting image...");
          try {
            const heic2any = (await import("heic2any")).default;
            const convertedBlob = await heic2any({
              blob: file,
              toType: "image/jpeg",
              quality: 0.8,
            });
            const blob = Array.isArray(convertedBlob)
              ? convertedBlob[0]
              : convertedBlob;

            if (!blob) {
              throw new Error("Conversion resulted in empty blob");
            }

            file = new File(
              [blob],
              file.name.replace(/\.(heic|heif)$/i, ".jpg"),
              {
                type: "image/jpeg",
              },
            );
            toast.dismiss(toastId);
          } catch (e) {
            console.error(e);
            toast.dismiss(toastId);
            toast.error("Failed to convert image");
            return;
          }
        }

        if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
          toast.error("Unsupported file type");
          return;
        }

        if (file.size > MAX_FILE_SIZE) {
          toast.error("File is too large");
          return;
        }

        // Update react-hook-form value
        form.setValue("image", file, {
          shouldValidate: true,
        });
      };

      void handleDrop();
    },
    [form],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      ...ACCEPTED_IMAGE_TYPES.reduce(
        (acc, type) => {
          acc[type] = [];
          return acc;
        },
        {} as Record<string, string[]>,
      ),
      "image/heic": [],
      "image/heif": [],
    },
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
              className={cn(
                "bg-input-bg flex min-h-[160px] w-full cursor-pointer flex-col items-center justify-center gap-2.5 rounded-lg border border-dashed p-4 text-center transition-colors",
                isDragActive
                  ? "border-primary text-primary"
                  : "border-input text-faint hover:border-primary hover:text-primary",
              )}
            >
              <input {...getInputProps()} />
              <Upload className="size-[26px]" strokeWidth={1.5} />
              <span className="text-[11px] font-semibold tracking-[0.06em] uppercase">
                Drag a photo here or click
              </span>
              <span className="text-faint font-mono text-[10px]">
                JPG · PNG · WEBP · HEIC · max{" "}
                {(MAX_FILE_SIZE / 1000000).toFixed(0)} MB
              </span>
            </div>
          </FormControl>

          <FormMessage />
        </FormItem>
      )}
    />
  );
}

export default ImagesDragDrop;
