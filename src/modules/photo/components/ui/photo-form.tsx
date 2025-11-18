"use client";

import { zodResolver } from "@hookform/resolvers/zod";
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
import { DateFormField } from "@/components/date-form-field";
import { getTodayDateYYYYMMDD } from "@/lib/utils";
import { uploadPhoto } from "@/modules/photo/actions";
import { photoSchema, type PhotoFormValues } from "@/modules/photo/schemas";

import ImagesDragDrop from "./images-drag-drop";
import ImagesPreview from "./images-preview";

export function PhotoForm() {
  const form = useForm<PhotoFormValues>({
    resolver: zodResolver(photoSchema) as Resolver<PhotoFormValues>,
    defaultValues: {
      date: getTodayDateYYYYMMDD(),
      weight: "",
    },
  });

  const image = form.watch("image");

  const handleDelete = (_index: number) => {
    form.setValue("image", undefined as unknown as File, {
      shouldValidate: true,
    });
  };

  const onSubmit = async (values: PhotoFormValues) => {
    try {
      if (!values.image) {
        toast.error("Please select a photo");
        return;
      }

      const result = await uploadPhoto(values);

      if (!result.ok) {
        toast.error(result.error ?? "Failed to upload photo");
        return;
      }

      toast.success("Photo uploaded");
      form.reset(
        {
          date: values.date,
          weight: "",
          image: undefined as unknown as File,
        },
        {
          keepDefaultValues: true,
        },
      );
    } catch (error) {
      console.error(error);
      toast.error("Failed to upload photo");
    }
  };

  const isSubmitting = form.formState.isSubmitting;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <DateFormField control={form.control} name="date" label="Date" />

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

        <div className="space-y-2">
          <p className="text-sm font-medium">Photo</p>
          <ImagesDragDrop
            form={form}
            title="Upload Photo"
            description="Drag and drop your photo here, or click to browse"
            buttonLabel="Choose photo"
          />
        </div>

        <ImagesPreview
          imageFiles={image ? [image] : []}
          onDelete={handleDelete}
        />

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save photo"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
