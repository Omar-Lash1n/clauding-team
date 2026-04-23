"use client";

import * as React from "react";
import {
  useFormContext,
  type FieldValues,
  type FieldPath,
  type RegisterOptions,
} from "react-hook-form";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils/cn";

interface FormFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> {
  name: TName;
  label?: string;
  required?: boolean;
  rules?: RegisterOptions<TFieldValues, TName>;
  className?: string;
  children: React.ReactNode;
  hint?: string;
}

export function FormField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  name,
  label,
  required,
  className,
  children,
  hint,
}: FormFieldProps<TFieldValues, TName>) {
  const {
    formState: { errors },
  } = useFormContext<TFieldValues>();

  const error = errors[name];
  const errorMessage =
    error && typeof error.message === "string" ? error.message : undefined;

  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <Label htmlFor={name}>
          {label}
          {required && <span className="ms-0.5 text-[#C94C4C]">*</span>}
        </Label>
      )}
      {children}
      {hint && !errorMessage && (
        <p className="text-xs text-[#1C2D5B]/50">{hint}</p>
      )}
      {errorMessage && (
        <p className="text-xs text-[#C94C4C]">{errorMessage}</p>
      )}
    </div>
  );
}
