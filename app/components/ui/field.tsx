import React from "react";
import { cn } from "@/lib/utils";

/** Field path -> message, keyed exactly as the API reports them. */
export type Errors = Record<string, string>;

export const INVALID = "aria-[invalid=true]:border-red-500";

/** True for this field, or for anything nested under it ("variants.0"). */
export const hasError = (errors: Errors, name: string) =>
  !!errors[name] || Object.keys(errors).some((path) => path.startsWith(`${name}.`));

/**
 * The heading turns red with its field. `name` may be a group ("variant",
 * "variants.0"), which goes red when anything inside it failed.
 */
export function FieldLabel({
  errors,
  name,
  htmlFor,
  className,
  children,
}: {
  errors: Errors;
  name: string;
  htmlFor?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className={cn("block text-sm mb-1", hasError(errors, name) ? "text-red-600" : "text-muted-foreground", className)}
    >
      {children}
    </label>
  );
}

export function FieldError({ errors, name }: { errors: Errors; name: string }) {
  if (!errors[name]) return null;
  return (
    <p data-field-error={name} className="mt-1 text-sm text-red-600">
      {errors[name]}
    </p>
  );
}
