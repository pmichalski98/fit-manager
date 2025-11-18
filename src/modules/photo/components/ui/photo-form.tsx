"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRef, useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { getTodayDateYYYYMMDD } from "@/lib/utils";
import { uploadPhoto } from "@/modules/photo/actions";
import { photoSchema, type PhotoFormValues } from "@/modules/photo/schemas";

import ImagesPreview from "./images-preview";

export function PhotoForm() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const form = useForm<PhotoFormValues>({
    resolver: zodResolver(photoSchema) as Resolver<PhotoFormValues>,
    defaultValues: {
      date: getTodayDateYYYYMMDD(),
      weight: "",
      // image will be set when a file is chosen
    },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0]!;
    setSelectedFiles([file]);
    form.setValue("image", file, { shouldValidate: true });
  };

  const handleDelete = () => {
    setSelectedFiles([]);
    form.setValue("image", undefined as unknown as File, {
      shouldValidate: true,
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const onSubmit = async (values: PhotoFormValues) => {
    try {
      if (!values.image) {
        toast.error("Please select a photo");
        return;
      }

      const formData = new FormData();
      formData.append("date", values.date);
      if (values.weight) {
        formData.append("weight", values.weight);
      }
      formData.append("image", values.image);

      const result = await uploadPhoto(formData);

      if (!result.ok) {
        toast.error(result.error ?? "Failed to upload photo");
        return;
      }

      toast.success("Photo uploaded");
      setSelectedFiles([]);
      form.reset({
        date: values.date,
        weight: "",
      });
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to upload photo");
    }
  };

  const isSubmitting = form.formState.isSubmitting;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Date</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="weight"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Weight (kg)</FormLabel>
              <FormControl>
                <Input type="number" inputMode="decimal" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="image"
          render={() => (
            <FormItem>
              <FormLabel>Photo</FormLabel>
              <FormControl>
                <div className="space-y-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="gap-2"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Choose photo
                  </Button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <ImagesPreview imageFiles={selectedFiles} onDelete={handleDelete} />

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save photo"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
