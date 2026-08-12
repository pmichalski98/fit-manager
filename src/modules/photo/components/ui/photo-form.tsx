"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useRef, useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { DecimalInput } from "@/components/ui/decimal-input";
import { DateFormField } from "@/components/date-form-field";
import { getTodayDateYYYYMMDD } from "@/lib/utils";
import { getDailyLogByDate } from "@/modules/body/actions";
import { uploadPhoto } from "@/modules/photo/actions";
import { photoSchema, type PhotoFormValues } from "@/modules/photo/schemas";

import ImagesDragDrop from "./images-drag-drop";
import ImagesPreview from "./images-preview";

export function PhotoForm({
  onSuccess,
  onCancel,
}: {
  onSuccess?: () => void;
  onCancel?: () => void;
}) {
  const form = useForm<PhotoFormValues>({
    resolver: zodResolver(photoSchema) as Resolver<PhotoFormValues>,
    defaultValues: {
      date: getTodayDateYYYYMMDD(),
      weight: "",
    },
  });

  const image = form.watch("image");
  const dateValue = form.watch("date");

  // Prefill weight from the daily log of the selected date; never clobber a
  // value the user typed themselves.
  const [isPrefilled, setIsPrefilled] = useState(false);
  const lastPrefillRef = useRef<string | null>(null);
  useEffect(() => {
    if (!dateValue) return;
    let cancelled = false;
    void getDailyLogByDate(dateValue).then((result) => {
      if (cancelled || !result.ok) return;
      const logWeight = result.data?.weight;
      const current = form.getValues("weight");
      const isUntouched = current === "" || current === lastPrefillRef.current;
      if (!isUntouched) return;
      if (logWeight != null) {
        const normalized = String(Number.parseFloat(logWeight));
        form.setValue("weight", normalized);
        lastPrefillRef.current = normalized;
        setIsPrefilled(true);
      } else if (current !== "" && current === lastPrefillRef.current) {
        form.setValue("weight", "");
        lastPrefillRef.current = null;
        setIsPrefilled(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [dateValue, form]);

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
      onSuccess?.();
    } catch (error) {
      console.error(error);
      toast.error("Failed to upload photo");
    }
  };

  const isSubmitting = form.formState.isSubmitting;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="flex flex-col gap-4 p-5">
          <ImagesDragDrop form={form} />

          <ImagesPreview
            imageFiles={image ? [image] : []}
            onDelete={handleDelete}
          />

          <div className="grid grid-cols-2 gap-3">
            <DateFormField
              control={form.control}
              name="date"
              label="Date"
              labelClassName="label-caps"
            />

            <FormField
              control={form.control}
              name="weight"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="label-caps">Weight (kg)</FormLabel>
                  <FormControl>
                    <DecimalInput
                      placeholder="84.2"
                      className="text-center font-mono"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {isPrefilled && (
            <p className="text-faint font-mono text-[11px]">
              Weight prefilled from that day&apos;s log — override if needed.
            </p>
          )}
        </div>

        <DialogFooter className="border-t px-5 py-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save photo"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
