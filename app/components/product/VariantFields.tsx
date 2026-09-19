import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Errors, FieldError, FieldLabel, INVALID } from "@/components/ui/field";

export type ProductImage = { imageUrl: string; publicId?: string };
export type Lang = "english" | "arabic";

/**
 * Price, actual price and stock stay strings while editing so an empty field
 * stays empty (and is reported) instead of silently becoming 0.
 */
export type VariantFieldValues = {
  nameEnglish: string;
  nameArabic: string;
  color: string;
  price: string;
  mrp: string;
  stock: string;
};

export const emptyVariantFields = (): VariantFieldValues => ({
  nameEnglish: "",
  nameArabic: "",
  color: "#000000",
  price: "",
  mrp: "",
  stock: "",
});

export const MAX_VARIANT_IMAGES = 10;

/**
 * Preview URLs for files not yet uploaded, revoked when the list changes or the
 * picker unmounts — without that, every re-pick leaks a blob into the tab.
 */
function useObjectUrls(files: File[]): string[] {
  const [urls, setUrls] = useState<string[]>([]);
  useEffect(() => {
    const next = files.map((file) => URL.createObjectURL(file));
    setUrls(next);
    return () => next.forEach(URL.revokeObjectURL);
  }, [files]);
  return urls;
}

/**
 * The images of one variant in one language: those already saved, plus the ones
 * chosen but not yet uploaded. Both kinds preview as thumbnails and both can be
 * removed one at a time, so an admin can build up the different views of a
 * variant (front, back, side...) across several picks.
 */
export function ImagePicker({
  id,
  label,
  existing,
  files,
  onAdd,
  onRemoveExisting,
  onRemoveFile,
  invalid,
  disabled,
}: {
  id: string;
  label: React.ReactNode;
  existing: ProductImage[];
  files: File[];
  onAdd: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveExisting: (idx: number) => void;
  onRemoveFile: (idx: number) => void;
  invalid?: boolean;
  disabled?: boolean;
}) {
  const previews = useObjectUrls(files);
  const total = existing.length + files.length;

  const thumb = (src: string, key: string, alt: string, onRemove: () => void, pending: boolean) => (
    <li key={key} className="relative h-20 w-20 overflow-hidden rounded border">
      <img src={src} alt={alt} className="h-full w-full object-cover" />
      <button
        type="button"
        onClick={onRemove}
        disabled={disabled}
        aria-label={`Remove ${alt}`}
        title={`Remove ${alt}`}
        className="absolute right-0 top-0 flex h-5 w-5 items-center justify-center rounded-bl bg-red-600 text-xs leading-none text-white hover:bg-red-700 disabled:opacity-50"
      >
        x
      </button>
      {pending && (
        <span className="absolute inset-x-0 bottom-0 bg-black/60 text-center text-[10px] text-white">new</span>
      )}
    </li>
  );

  return (
    <div>
      {label}
      {total > 0 && (
        <ul className="mb-3 flex flex-wrap gap-2">
          {existing.map((img, idx) =>
            thumb(img.imageUrl, `saved-${idx}`, `image ${idx + 1}`, () => onRemoveExisting(idx), false)
          )}
          {previews.map((src, idx) =>
            thumb(src, `new-${idx}`, `new image ${idx + 1}`, () => onRemoveFile(idx), true)
          )}
        </ul>
      )}
      <Input
        id={id}
        type="file"
        multiple
        accept="image/*,.heic,.heif,.avif,.webp"
        onChange={onAdd}
        disabled={disabled || total >= MAX_VARIANT_IMAGES}
        aria-invalid={invalid}
        className={INVALID}
      />
      <p className="mt-1 text-xs text-muted-foreground">
        {total}/{MAX_VARIANT_IMAGES} images{total >= MAX_VARIANT_IMAGES ? " - remove one to add another" : ""}
      </p>
    </div>
  );
}

/**
 * The price, stock and images of one sellable item. A product sold as a single
 * item has exactly one of these (prefix "variant", no name of its own — it
 * inherits the product's); a product sold in several variants has one per
 * variant (prefix "variants.0", each named so the storefront can label it).
 *
 * Purely presentational, so both cases share this and the error paths it
 * renders line up with what the API reports.
 */
/** Blank names inherit the product's, so they are only worth filling in to
 *  label a choice on the storefront. */
export function VariantFields({
  prefix,
  values,
  onChange,
  existing,
  files,
  onFiles,
  onRemoveExisting,
  onRemoveFile,
  errors,
  disabled,
  withNames = false,
  idPrefix,
}: {
  prefix: string;
  values: VariantFieldValues;
  onChange: (field: keyof VariantFieldValues, value: string) => void;
  existing: Record<Lang, ProductImage[]>;
  files: Record<Lang, File[]>;
  onFiles: (lang: Lang, event: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveExisting: (lang: Lang, idx: number) => void;
  onRemoveFile: (lang: Lang, idx: number) => void;
  errors: Errors;
  disabled?: boolean;
  withNames?: boolean;
  idPrefix: string;
}) {
  const path = (field: string) => `${prefix}.${field}`;

  return (
    <>
      {withNames && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <FieldLabel errors={errors} name={path("nameEnglish")} htmlFor={`${idPrefix}-nameEnglish`}>
              Variant Name (English) <span className="font-normal">- optional</span>
            </FieldLabel>
            <Input
              id={`${idPrefix}-nameEnglish`}
              value={values.nameEnglish}
              maxLength={200}
              onChange={(e) => onChange("nameEnglish", e.target.value)}
              aria-invalid={!!errors[path("nameEnglish")]}
              className={INVALID}
            />
            <FieldError errors={errors} name={path("nameEnglish")} />
          </div>
          <div>
            <FieldLabel errors={errors} name={path("nameArabic")} htmlFor={`${idPrefix}-nameArabic`}>
              Variant Name (Arabic) <span className="font-normal">- optional</span>
            </FieldLabel>
            <Input
              id={`${idPrefix}-nameArabic`}
              value={values.nameArabic}
              maxLength={200}
              onChange={(e) => onChange("nameArabic", e.target.value)}
              dir="rtl"
              lang="ar"
              aria-invalid={!!errors[path("nameArabic")]}
              className={`text-right ${INVALID}`}
            />
            <FieldError errors={errors} name={path("nameArabic")} />
          </div>
        </div>
      )}

      <div>
        <FieldLabel errors={errors} name={path("color")} htmlFor={`${idPrefix}-color`}>Color</FieldLabel>
        <div className="flex items-center gap-3">
          <input
            id={`${idPrefix}-color`}
            type="color"
            value={values.color}
            onChange={(e) => onChange("color", e.target.value)}
            aria-invalid={!!errors[path("color")]}
            className="h-10 w-20 rounded cursor-pointer border border-muted aria-[invalid=true]:border-red-500"
          />
          <span className="text-sm font-mono text-muted-foreground">{values.color}</span>
        </div>
        <FieldError errors={errors} name={path("color")} />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <FieldLabel errors={errors} name={path("price")} htmlFor={`${idPrefix}-price`}>Selling Price</FieldLabel>
          <Input
            id={`${idPrefix}-price`}
            type="number"
            inputMode="decimal"
            min="0"
            step="0.001"
            value={values.price}
            onChange={(e) => onChange("price", e.target.value)}
            aria-invalid={!!errors[path("price")]}
            className={INVALID}
          />
          <FieldError errors={errors} name={path("price")} />
        </div>
        <div>
          <FieldLabel errors={errors} name={path("mrp")} htmlFor={`${idPrefix}-mrp`}>Actual Price</FieldLabel>
          <Input
            id={`${idPrefix}-mrp`}
            type="number"
            inputMode="decimal"
            min="0"
            step="0.001"
            value={values.mrp}
            onChange={(e) => onChange("mrp", e.target.value)}
            aria-invalid={!!errors[path("mrp")]}
            className={INVALID}
          />
          <FieldError errors={errors} name={path("mrp")} />
        </div>
        <div>
          <FieldLabel errors={errors} name={path("stock")} htmlFor={`${idPrefix}-stock`}>Stock</FieldLabel>
          <Input
            id={`${idPrefix}-stock`}
            type="number"
            inputMode="numeric"
            min="0"
            step="1"
            value={values.stock}
            onChange={(e) => onChange("stock", e.target.value)}
            aria-invalid={!!errors[path("stock")]}
            className={INVALID}
          />
          <FieldError errors={errors} name={path("stock")} />
        </div>
      </div>

      {(["english", "arabic"] as const).map((lang) => {
        const field = path(lang === "english" ? "imageUrlEnglish" : "imageUrlArabic");
        return (
          <div key={lang}>
            <ImagePicker
              id={`${idPrefix}-images-${lang}`}
              label={
                <FieldLabel errors={errors} name={field} htmlFor={`${idPrefix}-images-${lang}`} className="mb-2">
                  Images ({lang === "english" ? "English" : "Arabic"})
                </FieldLabel>
              }
              existing={existing[lang]}
              files={files[lang]}
              onAdd={(e) => onFiles(lang, e)}
              onRemoveExisting={(idx) => onRemoveExisting(lang, idx)}
              onRemoveFile={(idx) => onRemoveFile(lang, idx)}
              invalid={!!errors[field]}
              disabled={disabled}
            />
            <FieldError errors={errors} name={field} />
          </div>
        );
      })}
    </>
  );
}
