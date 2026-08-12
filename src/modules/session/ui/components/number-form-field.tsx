"use client";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { DecimalInput } from "@/components/ui/decimal-input";
import { Input } from "@/components/ui/input";
import type { Control, FieldPath, FieldValues } from "react-hook-form";

type NumberFormFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  control: Control<TFieldValues>;
  name: TName;
  label: string;
  decimal?: boolean;
};

export function NumberFormField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  control,
  name,
  label,
  decimal,
}: NumberFormFieldProps<TFieldValues, TName>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            {decimal ? (
              <DecimalInput
                placeholder="—"
                className="text-center font-mono"
                {...field}
                value={field.value ?? ""}
              />
            ) : (
              <Input
                type="number"
                inputMode="numeric"
                placeholder="—"
                className="text-center font-mono"
                {...field}
                value={field.value ?? ""}
              />
            )}
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
