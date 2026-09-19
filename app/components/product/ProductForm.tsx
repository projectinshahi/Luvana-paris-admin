"use client";

import React, { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import toast from "react-hot-toast";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Errors, FieldError, FieldLabel, INVALID, hasError } from "@/components/ui/field";
import {
  Lang,
  MAX_VARIANT_IMAGES,
  ProductImage,
  VariantFields,
  VariantFieldValues,
  emptyVariantFields,
} from "@/components/product/VariantFields";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { api, ApiError, OVERSIZE_MESSAGE, oversizeFiles } from "@/utils/api";
import { cn } from "@/lib/utils";
import { deleteImages, uploadAll } from "@/utils/productImages";

type DescriptionItem = { description: string };

type DescriptionSection = {
  titleEnglish: string;
  titleArabic?: string;
  descriptionEnglish: DescriptionItem[];
  descriptionArabic?: DescriptionItem[];
};

type ProductFields = {
  category: string;
  brand: string;
  nameEnglish: string;
  nameArabic: string;
  shortDescriptionEnglish: string;
  shortDescriptionArabic: string;
  isFeatured: boolean;
  isNew: boolean;
  status: "active" | "inactive";
  description: DescriptionSection[];
};

/** One editable variant: its fields plus the images chosen for it. */
type VariantDraft = VariantFieldValues & {
  _id?: string;
  existing: Record<Lang, ProductImage[]>;
  files: Record<Lang, File[]>;
};

/** A saved variant as the form edits it: its fields, and its images as "already there". */
const variantDraft = (v: any): VariantDraft => ({
  _id: v._id,
  nameEnglish: v.nameEnglish || "",
  nameArabic: v.nameArabic || "",
  color: v.color || "#000000",
  price: v.price == null ? "" : String(v.price),
  mrp: v.mrp == null ? "" : String(v.mrp),
  stock: v.stock == null ? "" : String(v.stock),
  existing: { english: toImages(v.imageUrlEnglish), arabic: toImages(v.imageUrlArabic) },
  files: { english: [], arabic: [] },
});

const emptyVariantDraft = (): VariantDraft => ({
  ...emptyVariantFields(),
  existing: { english: [], arabic: [] },
  files: { english: [], arabic: [] },
});

const blankSection = (): DescriptionSection => ({
  titleEnglish: "",
  titleArabic: "",
  descriptionEnglish: [{ description: "" }],
  descriptionArabic: [{ description: "" }],
});

const emptyProduct: ProductFields = {
  category: "",
  brand: "",
  nameEnglish: "",
  nameArabic: "",
  shortDescriptionEnglish: "",
  shortDescriptionArabic: "",
  isFeatured: false,
  isNew: false,
  status: "active",
  description: [],
};

// Mirrors the API's rules (luvana-paris-backend/controller/admin/productController.js)
// and uses the same field paths, so an error from either side shows under the same field.
const numberField = (required: string) =>
  z.preprocess((v) => (v === "" ? undefined : Number(v)), z.number({ error: required }));

// Adding a section is optional, but a section that was added has to say
// something. Arabic stays optional, as it is on the API.
const descriptionSectionSchema = z.object({
  titleEnglish: z.string().trim().min(1, "Enter the section title").max(200, "Section title must be 200 characters or fewer"),
  titleArabic: z.string().trim().max(200, "Section title must be 200 characters or fewer").optional(),
  descriptionEnglish: z.array(z.object({
    description: z.string().trim().min(1, "Enter the description or remove this line").max(1000, "Description must be 1000 characters or fewer"),
  })).min(1, "Add at least one description line").max(50, "Use 50 description lines or fewer"),
  descriptionArabic: z.array(z.object({
    description: z.string().trim().max(1000, "Description must be 1000 characters or fewer"),
  })).max(50, "Use 50 description lines or fewer").optional(),
});

const productFields = {
  category: z.string().min(1, "Select a category"),
  brand: z.string().min(1, "Select a brand"),
  nameEnglish: z.string().trim().min(1, "Enter the product name").max(200, "Product name must be 200 characters or fewer"),
  nameArabic: z.string().trim().min(1, "Enter the Arabic product name").max(200, "Arabic product name must be 200 characters or fewer"),
  shortDescriptionEnglish: z.string().trim().max(500, "Short description must be 500 characters or fewer"),
  shortDescriptionArabic: z.string().trim().max(500, "Short description must be 500 characters or fewer"),
  description: z.array(descriptionSectionSchema).max(20, "Use 20 description sections or fewer"),
};

const variantFields = {
  color: z.string().regex(/^#[0-9a-f]{6}$/i, "Pick a colour"),
  price: numberField("Enter the selling price").pipe(z.number().positive("Selling price must be more than 0")),
  mrp: numberField("Enter the actual price").pipe(z.number().positive("Actual price must be more than 0")),
  stock: numberField("Enter the stock quantity").pipe(
    z.number().int("Stock must be a whole number").min(0, "Stock cannot be negative")
  ),
  imageUrlEnglish: z.array(z.unknown()).min(1, "Add at least one English product image").max(10, "Use 10 images or fewer"),
  imageUrlArabic: z.array(z.unknown()).max(10, "Use 10 images or fewer"),
};

// A product sold in several variants: the same fields, plus a name per variant.
const createVariantsSchema = z.array(
  z.object({
    ...variantFields,
    nameEnglish: z.string().trim().max(200, "Variant name must be 200 characters or fewer").optional(),
    nameArabic: z.string().trim().max(200, "Variant name must be 200 characters or fewer").optional(),
    imageUrlArabic: variantFields.imageUrlArabic.min(1, "Add at least one Arabic product image"),
  })
).min(1, "Add at least one variant").max(20, "Use 20 variants or fewer");

// Editing sends the whole variant list back under the looser rules, because
// variants saved earlier may not satisfy the create rules: some hold a CSS
// colour name ("Red") rather than a hex value, which the storefront renders
// correctly, and some have no Arabic images. Mirrors editVariantsSchema on the API.
const editVariantsSchema = z.array(
  z.object({
    ...variantFields,
    nameEnglish: z.string().trim().max(200, "Variant name must be 200 characters or fewer").optional(),
    nameArabic: z.string().trim().max(200, "Variant name must be 200 characters or fewer").optional(),
    color: z.string().trim().min(1, "Pick a colour").optional(),
    imageUrlArabic: variantFields.imageUrlArabic.optional(),
  })
).min(1, "Add at least one variant").max(20, "Use 20 variants or fewer");

// Editing keeps the looser rules: products saved before the create form asked
// for a colour, short descriptions, sections and Arabic images must stay
// editable without back-filling all of them first.
const editSchema = z.object({
  ...productFields,
  variant: z.object({
    ...variantFields,
    color: variantFields.color.optional(),
    imageUrlArabic: variantFields.imageUrlArabic.optional(),
  }).optional(),
  variants: editVariantsSchema.optional(),
});

// Creating asks for every field on the form, so none may be left blank.
const createSchema = z.object({
  ...productFields,
  shortDescriptionEnglish: z.string().trim().min(1, "Enter the short description").max(500, "Short description must be 500 characters or fewer"),
  shortDescriptionArabic: z.string().trim().min(1, "Enter the Arabic short description").max(500, "Short description must be 500 characters or fewer"),
  description: productFields.description.min(1, "Add at least one description section"),
  variant: z.object({
    ...variantFields,
    imageUrlArabic: variantFields.imageUrlArabic.min(1, "Add at least one Arabic product image"),
  }).optional(),
  variants: createVariantsSchema.optional(),
});

// Errors that have a place in the form; anything else the API reports goes in the toast.
const FIELD_PATHS = [
  "category", "brand", "nameEnglish", "nameArabic", "shortDescriptionEnglish", "shortDescriptionArabic",
  "variant.color", "variant.price", "variant.mrp", "variant.stock", "variant.imageUrlEnglish", "variant.imageUrlArabic",
];

// "description.0.descriptionEnglish.2.description" and friends are rendered under
// their own input, so they are shown in place rather than repeated in the toast.
const hasFieldInForm = (path: string) =>
  FIELD_PATHS.includes(path) ||
  ["description", "variants"].some((group) => path === group || path.startsWith(`${group}.`));

const validate = (values: z.input<typeof createSchema>, mode: "create" | "edit"): Errors => {
  const errors: Errors = {};
  const result = (mode === "create" ? createSchema : editSchema).safeParse(values);
  for (const issue of result.success ? [] : result.error.issues) {
    errors[issue.path.join(".")] ??= issue.message;
  }
  // Checked outside the schema so it is reported together with the other errors,
  // and only when both prices are valid on their own.
  const comparePrices = (prefix: string, v?: { price?: unknown; mrp?: unknown }) => {
    if (!v || errors[`${prefix}.price`] || errors[`${prefix}.mrp`]) return;
    if (Number(v.price) > Number(v.mrp)) {
      errors[`${prefix}.price`] = "Selling price cannot be higher than the actual price";
    }
  };
  comparePrices("variant", values.variant);
  (values.variants ?? []).forEach((v, i) => comparePrices(`variants.${i}`, v));
  return errors;
};

const toImages = (list: any): ProductImage[] =>
  (Array.isArray(list) ? list : [])
    .map((img: any) => ({ imageUrl: img?.imageUrl || "", publicId: img?.publicId }))
    .filter((img: ProductImage) => img.imageUrl);

const refId = (ref: any): string => (typeof ref === "string" ? ref : ref?._id || ref?.id || "");


export default function ProductForm({ productId }: { productId?: string } = {}) {
  const router = useRouter();
  const [form, setForm] = useState<ProductFields>(() =>
    productId ? emptyProduct : { ...emptyProduct, description: [blankSection()] });
  const [loading, setLoading] = useState(!!productId);
  const [loadError, setLoadError] = useState("");
  const [busy, setBusy] = useState<"" | "Uploading images..." | "Saving...">("");
  const [errors, setErrors] = useState<Errors>({});
  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  // Every product is priced and pictured through its variants: one for a product
  // sold as a single item, several when it comes in choices. The admin adds them
  // with "Add Variant", so there is no separate mode to pick first.
  const [variants, setVariants] = useState<VariantDraft[]>([]);
  // publicIds the saved variant referenced when the form loaded
  const loadedPublicIds = useRef<string[]>([]);
  const submitting = useRef(false);

  useEffect(() => {
    if (!productId) return;
    const load = async () => {
      try {
        const [product, variants] = await Promise.all([
          api.get<any>(`/admin/product/${productId}`),
          api.get<any[]>(`/admin/product-variant/product/${productId}`),
        ]);
        setForm({
          category: refId(product.category),
          brand: refId(product.brand),
          nameEnglish: product.nameEnglish || "",
          nameArabic: product.nameArabic || "",
          shortDescriptionEnglish: product.shortDescriptionEnglish || "",
          shortDescriptionArabic: product.shortDescriptionArabic || "",
          isFeatured: !!product.isFeatured,
          isNew: !!product.isNew,
          status: product.status === "inactive" ? "inactive" : "active",
          description: (product.description || []).map((s: any) => ({
            titleEnglish: s.titleEnglish || "",
            titleArabic: s.titleArabic || "",
            descriptionEnglish: (s.descriptionEnglish || []).map((i: any) => ({ description: i?.description || "" })),
            descriptionArabic: (s.descriptionArabic || []).map((i: any) => ({ description: i?.description || "" })),
          })),
        });
        const saved = Array.isArray(variants) ? variants : [];
        // Images the saved variants reference now, so only the ones the admin
        // actually removes get deleted from Cloudinary when the product is saved.
        loadedPublicIds.current = saved
          .flatMap((sv: any) => [...toImages(sv.imageUrlEnglish), ...toImages(sv.imageUrlArabic)])
          .flatMap((img) => img.publicId || []);

        // Whatever the product already has — one variant or several — loads here.
        setVariants(saved.map(variantDraft));
      } catch (error) {
        setLoadError(error instanceof Error ? error.message : "Could not load this product.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [productId]);

  useEffect(() => {
    Promise.all([api.get<any[]>("/admin/category"), api.get<any[]>("/admin/brand")])
      .then(([categoryList, brandList]) => {
        setCategories(Array.isArray(categoryList) ? categoryList : []);
        setBrands(Array.isArray(brandList) ? brandList : []);
      })
      .catch((error) => {
        toast.error(`Could not load categories and brands. ${error instanceof Error ? error.message : ""}`);
      });
  }, []);

  const clearError = (...names: string[]) => {
    setErrors((e) => {
      if (!names.some((n) => n in e)) return e;
      const rest = { ...e };
      names.forEach((n) => delete rest[n]);
      return rest;
    });
  };

  const showErrors = (found: Errors) => {
    flushSync(() => setErrors(found));
    document.querySelector("[data-field-error]")?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
    clearError(name);
  };

  const handleCheckbox = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setForm((s) => ({ ...s, [name]: checked }));
  };

  const addDescriptionSection = () => {
    setForm((s) => ({
      ...s,
      description: [...s.description, blankSection()],
    }));
  };

  const removeDescriptionSection = (sectionIdx: number) => {
    setForm((s) => ({
      ...s,
      description: s.description.filter((_, i) => i !== sectionIdx),
    }));
  };

  const updateSectionField = (sectionIdx: number, field: "titleEnglish" | "titleArabic", value: string) => {
    setForm((s) => ({
      ...s,
      description: s.description.map((section, i) =>
        i === sectionIdx ? { ...section, [field]: value } : section
      ),
    }));
    clearError(`description.${sectionIdx}.${field}`);
  };

  const updateSectionItem = (
    sectionIdx: number,
    lang: "descriptionEnglish" | "descriptionArabic",
    itemIdx: number,
    value: string
  ) => {
    setForm((s) => ({
      ...s,
      description: s.description.map((section, i) => {
        if (i !== sectionIdx) return section;
        const items = [...(section[lang] || [])];
        items[itemIdx] = { ...items[itemIdx], description: value };
        return { ...section, [lang]: items };
      }),
    }));
    clearError(`description.${sectionIdx}.${lang}.${itemIdx}.description`, `description.${sectionIdx}.${lang}`);
  };

  const addSectionItem = (sectionIdx: number) => {
    setForm((s) => ({
      ...s,
      description: s.description.map((section, i) => {
        if (i !== sectionIdx) return section;
        return {
          ...section,
          descriptionEnglish: [...(section.descriptionEnglish || []), { description: "" }],
          descriptionArabic: [...(section.descriptionArabic || []), { description: "" }],
        };
      }),
    }));
  };

  const removeSectionItem = (sectionIdx: number, itemIdx: number) => {
    setForm((s) => ({
      ...s,
      description: s.description.map((section, i) => {
        if (i !== sectionIdx) return section;
        return {
          ...section,
          descriptionEnglish: (section.descriptionEnglish || []).filter((_, idx) => idx !== itemIdx),
          descriptionArabic: (section.descriptionArabic || []).filter((_, idx) => idx !== itemIdx),
        };
      }),
    }));
  };

  /** Names the oversize files, or null when every file is within the limit. */
  const oversizeError = (files: File[]) => {
    const tooLarge = oversizeFiles(files);
    if (!tooLarge.length) return null;
    return `${tooLarge.map((f) => `"${f.name}"`).join(", ")} ${tooLarge.length > 1 ? "are" : "is"} too large. ${OVERSIZE_MESSAGE}`;
  };

  /**
   * Files picked now are added to the ones already chosen, so the different
   * views of a variant can be gathered over several picks. The input is cleared
   * each time, both so re-picking the same file still fires and so the list
   * shown is the state, not the browser's last selection.
   */
  const addFiles = (
    current: { existing: ProductImage[]; files: File[] },
    picked: File[],
    field: string
  ): { files?: File[]; error?: string } => {
    const tooLarge = oversizeError(picked);
    if (tooLarge) return { error: tooLarge };
    const room = MAX_VARIANT_IMAGES - current.existing.length - current.files.length;
    if (picked.length > room) {
      return {
        error: room > 0
          ? `Only ${room} more image${room > 1 ? "s" : ""} can be added. Use ${MAX_VARIANT_IMAGES} images or fewer.`
          : `Use ${MAX_VARIANT_IMAGES} images or fewer. Remove one before adding another.`,
      };
    }
    return { files: [...current.files, ...picked] };
  };


  // ---- the same three handlers, for one variant of a multi-variant product
  const patchVariant = (idx: number, patch: Partial<VariantDraft>) =>
    setVariants((list) => list.map((v, i) => (i === idx ? { ...v, ...patch } : v)));

  const setVariantAt = (idx: number, name: keyof VariantFieldValues, value: string) => {
    patchVariant(idx, { [name]: value } as Partial<VariantDraft>);
    clearError(`variants.${idx}.${name}`, `variants.${idx}`, "variants");
  };

  const variantFilesAt = (idx: number, lang: Lang, e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files || []);
    e.target.value = "";
    const variant = variants[idx];
    const field = `variants.${idx}.${lang === "english" ? "imageUrlEnglish" : "imageUrlArabic"}`;
    const { files, error } = addFiles({ existing: variant.existing[lang], files: variant.files[lang] }, picked, field);
    if (error) {
      setErrors((s) => ({ ...s, [field]: error }));
      return;
    }
    patchVariant(idx, { files: { ...variant.files, [lang]: files! } });
    clearError(field, "variants");
  };

  const removeVariantFileAt = (idx: number, lang: Lang, fileIdx: number) =>
    patchVariant(idx, {
      files: { ...variants[idx].files, [lang]: variants[idx].files[lang].filter((_, i) => i !== fileIdx) },
    });

  const removeVariantImageAt = (idx: number, lang: Lang, imageIdx: number) =>
    patchVariant(idx, {
      existing: { ...variants[idx].existing, [lang]: variants[idx].existing[lang].filter((_, i) => i !== imageIdx) },
    });

  const addVariant = () => setVariants((list) => [...list, emptyVariantDraft()]);
  const removeVariant = (idx: number) => {
    setVariants((list) => list.filter((_, i) => i !== idx));
    // Messages are keyed by index, so those below the removed row would point at the wrong one.
    setErrors((e) => Object.fromEntries(Object.entries(e).filter(([path]) => !path.startsWith("variants"))));
  };

  const submit = async () => {
    if (submitting.current) return;

    // Images are validated as "what this variant will end up with": the ones it
    // already had plus the files just chosen, before any upload happens.
    const withImages = (v: VariantDraft) => ({
      ...v,
      imageUrlEnglish: [...v.existing.english, ...v.files.english],
      imageUrlArabic: [...v.existing.arabic, ...v.files.arabic],
    });
    const found = validate({
      ...form,
      variants: variants.map(withImages),
    }, productId ? "edit" : "create");
    if (Object.keys(found).length) {
      showErrors(found);
      toast.error("Please correct the highlighted fields.");
      return;
    }

    submitting.current = true;
    setErrors({});
    let uploaded: ProductImage[] = [];
    try {
      // Every variant's files go up in one batch, so a failure part-way rolls
      // all of them back rather than leaving orphans in Cloudinary.
      const pending = variants.flatMap((v) => [...v.files.english, ...v.files.arabic]);
      if (pending.length > 0) {
        setBusy("Uploading images...");
        uploaded = await uploadAll(pending);
      }
      setBusy("Saving...");

      // Hand each variant back the slice of uploads that belongs to it, in the
      // order they were queued above.
      let taken = 0;
      const variantPayloads = variants.map((v) => {
        const english = uploaded.slice(taken, taken + v.files.english.length);
        taken += v.files.english.length;
        const arabic = uploaded.slice(taken, taken + v.files.arabic.length);
        taken += v.files.arabic.length;
        return {
          ...(v._id && { _id: v._id }),
          // Blank names are left out, so the API falls back to the product's.
          ...(v.nameEnglish.trim() && { nameEnglish: v.nameEnglish }),
          ...(v.nameArabic.trim() && { nameArabic: v.nameArabic }),
          color: v.color,
          // Sent as typed. The API coerces a non-empty string itself, and
          // Number("") is 0 — which would turn an empty stock field into a
          // valid "0 in stock" instead of the error it should be.
          price: v.price,
          mrp: v.mrp,
          stock: v.stock,
          imageUrlEnglish: [...v.existing.english, ...english],
          imageUrlArabic: [...v.existing.arabic, ...arabic],
        };
      });

      // Saved together with the product, so the API can reject the whole thing
      // instead of storing half of it. hasVariants is derived there from the count.
      const payload = { ...form, variants: variantPayloads };

      if (productId) {
        await api.put(`/admin/product/${productId}`, payload);
      } else {
        await api.post("/admin/product", payload);
      }

      // Only now is it safe to drop images the admin removed: the saved variants no longer use them.
      const kept = new Set(variants.flatMap((v) => [...v.existing.english, ...v.existing.arabic]).map((img) => img.publicId));
      deleteImages(loadedPublicIds.current.filter((id) => !kept.has(id)));

      const count = variantPayloads.length;
      toast.success(
        productId ? "Product updated" : `Product created with ${count} variant${count > 1 ? "s" : ""}`
      );
      router.push("/admin/product");
    } catch (error) {
      // The API answered with a failure, so nothing references the images just uploaded.
      // (With no answer at all the save may have gone through, so they are kept.)
      if (error instanceof ApiError && error.status >= 400) {
        deleteImages(uploaded.map((img) => img.publicId));
      }
      submitting.current = false;
      setBusy("");

      if (error instanceof ApiError && Object.keys(error.errors).length) {
        const elsewhere = Object.entries(error.errors)
          .filter(([path]) => !hasFieldInForm(path))
          .map(([, message]) => message);
        showErrors(error.errors);
        toast.error([error.message, ...elsewhere].join("\n"));
      } else {
        toast.error(error instanceof Error ? error.message : "The product could not be saved. Please try again.");
      }
    }
  };

  if (loading) {
    return <div className="py-12 text-center text-muted-foreground">Loading product...</div>;
  }

  if (loadError) {
    return (
      <div className="py-12 text-center space-y-4">
        <div className="text-muted-foreground">Could not load this product: {loadError}</div>
        <Button type="button" variant="outline" onClick={() => router.push('/admin/product')}>Back to products</Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <FieldLabel errors={errors} name="category" htmlFor="category">Category</FieldLabel>
        <select id="category" name="category" value={form.category} onChange={handleChange} aria-invalid={!!errors.category} className={`w-full rounded-md border px-3 py-2 ${INVALID}`}>
          <option value="">-- Select category --</option>
          {categories.map((c) => (<option key={c._id} value={c._id}>{c.nameEnglish}</option>))}
        </select>
        <FieldError errors={errors} name="category" />
      </div>

      <div>
        <FieldLabel errors={errors} name="brand" htmlFor="brand">Brand</FieldLabel>
        <select id="brand" name="brand" value={form.brand} onChange={handleChange} aria-invalid={!!errors.brand} className={`w-full rounded-md border px-3 py-2 ${INVALID}`}>
          <option value="">-- Select brand --</option>
          {brands.map((b) => (<option key={b._id} value={b._id}>{b.nameEnglish}</option>))}
        </select>
        <FieldError errors={errors} name="brand" />
      </div>

      <div>
        <FieldLabel errors={errors} name="nameEnglish" htmlFor="nameEnglish">Name (English)</FieldLabel>
        <Input id="nameEnglish" name="nameEnglish" value={form.nameEnglish} onChange={handleChange} maxLength={200} aria-invalid={!!errors.nameEnglish} className={INVALID} />
        <FieldError errors={errors} name="nameEnglish" />
      </div>

      <div>
        <FieldLabel errors={errors} name="nameArabic" htmlFor="nameArabic">Name (Arabic)</FieldLabel>
        <Input id="nameArabic" name="nameArabic" value={form.nameArabic} onChange={handleChange} maxLength={200} aria-invalid={!!errors.nameArabic} dir="rtl" lang="ar" className={`text-right ${INVALID}`} />
        <FieldError errors={errors} name="nameArabic" />
      </div>

      <div>
        <FieldLabel errors={errors} name="shortDescriptionEnglish" htmlFor="shortDescriptionEnglish">Short Description (English)</FieldLabel>
        <Textarea id="shortDescriptionEnglish" name="shortDescriptionEnglish" value={form.shortDescriptionEnglish} onChange={handleChange} maxLength={500} aria-invalid={!!errors.shortDescriptionEnglish} className={INVALID} />
        <FieldError errors={errors} name="shortDescriptionEnglish" />
      </div>

      <div>
        <FieldLabel errors={errors} name="shortDescriptionArabic" htmlFor="shortDescriptionArabic">Short Description (Arabic)</FieldLabel>
        <Textarea id="shortDescriptionArabic" name="shortDescriptionArabic" value={form.shortDescriptionArabic} onChange={handleChange} maxLength={500} aria-invalid={!!errors.shortDescriptionArabic} dir="rtl" lang="ar" className={`text-right ${INVALID}`} />
        <FieldError errors={errors} name="shortDescriptionArabic" />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <FieldLabel errors={errors} name="description" className="mb-0">Description Sections</FieldLabel>
          <Button
            type="button"
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white"
            onClick={addDescriptionSection}
            disabled={form.description.length >= 20}
          >
            <Plus className="mr-1 h-4 w-4" />
            Add Section
          </Button>
        </div>
        <FieldError errors={errors} name="description" />

        {form.description.map((section, sectionIdx) => (
          <div key={sectionIdx} className="rounded-md border p-3 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">Section {sectionIdx + 1}</div>
              <Button
                type="button"
                size="sm"
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={() => removeDescriptionSection(sectionIdx)}
              >
                Remove
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel errors={errors} name={`description.${sectionIdx}.titleEnglish`}>Title (English)</FieldLabel>
                <Input
                  value={section.titleEnglish || ""}
                  maxLength={200}
                  onChange={(e) => updateSectionField(sectionIdx, "titleEnglish", e.target.value)}
                  aria-invalid={!!errors[`description.${sectionIdx}.titleEnglish`]}
                  className={INVALID}
                />
                <FieldError errors={errors} name={`description.${sectionIdx}.titleEnglish`} />
              </div>
              <div>
                <FieldLabel errors={errors} name={`description.${sectionIdx}.titleArabic`}>Title (Arabic)</FieldLabel>
                <Input
                  value={section.titleArabic || ""}
                  maxLength={200}
                  onChange={(e) => updateSectionField(sectionIdx, "titleArabic", e.target.value)}
                  dir="rtl"
                  lang="ar"
                  aria-invalid={!!errors[`description.${sectionIdx}.titleArabic`]}
                  className={`text-right ${INVALID}`}
                />
                <FieldError errors={errors} name={`description.${sectionIdx}.titleArabic`} />
              </div>
            </div>

            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-3">
                <FieldLabel errors={errors} name={`description.${sectionIdx}.descriptionEnglish`} className="mb-0">Description (English)</FieldLabel>
                <FieldLabel errors={errors} name={`description.${sectionIdx}.descriptionArabic`} className="mb-0">Description (Arabic)</FieldLabel>
              </div>
              {(section.descriptionEnglish || []).map((item, itemIdx) => (
                <div key={itemIdx} className="grid grid-cols-2 gap-3 items-start">
                  <div>
                    <Input
                      value={item.description || ""}
                      maxLength={1000}
                      onChange={(e) => updateSectionItem(sectionIdx, "descriptionEnglish", itemIdx, e.target.value)}
                      aria-invalid={!!errors[`description.${sectionIdx}.descriptionEnglish.${itemIdx}.description`]}
                      className={INVALID}
                    />
                    <FieldError errors={errors} name={`description.${sectionIdx}.descriptionEnglish.${itemIdx}.description`} />
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="flex-1">
                      <Input
                        value={((section.descriptionArabic || [])[itemIdx] || {}).description || ""}
                        maxLength={1000}
                        onChange={(e) => updateSectionItem(sectionIdx, "descriptionArabic", itemIdx, e.target.value)}
                        dir="rtl"
                        lang="ar"
                        aria-invalid={!!errors[`description.${sectionIdx}.descriptionArabic.${itemIdx}.description`]}
                        className={`text-right ${INVALID}`}
                      />
                      <FieldError errors={errors} name={`description.${sectionIdx}.descriptionArabic.${itemIdx}.description`} />
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      className="bg-red-600 hover:bg-red-700 text-white"
                      onClick={() => removeSectionItem(sectionIdx, itemIdx)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
              <FieldError errors={errors} name={`description.${sectionIdx}.descriptionEnglish`} />
            </div>

            <div className="flex justify-end">
              <Button
                type="button"
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => addSectionItem(sectionIdx)}
                disabled={(section.descriptionEnglish || []).length >= 50}
              >
                Add Item
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Variants. A product is priced and pictured through them: one for a
          product sold as a single item, several when it comes in choices. */}
      <div className="space-y-4 rounded-md border p-4">
        <div className="flex items-center justify-between">
          <div className={cn("text-sm font-medium", hasError(errors, "variants") && "text-red-600")}>
            Product Details{variants.length > 0 ? ` (${variants.length} variant${variants.length > 1 ? "s" : ""})` : ""}
          </div>
          <Button
            type="button"
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white"
            onClick={addVariant}
            disabled={variants.length >= 20}
          >
            <Plus className="mr-1 h-4 w-4" />
            Add Variant
          </Button>
        </div>

        {variants.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No variants yet. Add one for the price, stock and images of this product.
          </p>
        ) : (
          variants.map((variant, idx) => (
            <div key={variant._id || `new-${idx}`} className="space-y-4 rounded-md border p-3">
              <div className="flex items-center justify-between">
                <div className={cn("text-sm font-medium", hasError(errors, `variants.${idx}`) && "text-red-600")}>
                  Variant {idx + 1}
                </div>
                <Button
                  type="button"
                  size="sm"
                  className="bg-red-600 hover:bg-red-700 text-white"
                  onClick={() => removeVariant(idx)}
                >
                  Remove Variant
                </Button>
              </div>
              <VariantFields
                prefix={`variants.${idx}`}
                idPrefix={`variant-${idx}`}
                withNames
                values={variant}
                onChange={(field, value) => setVariantAt(idx, field, value)}
                existing={variant.existing}
                files={variant.files}
                onFiles={(lang, e) => variantFilesAt(idx, lang, e)}
                onRemoveExisting={(lang, imageIdx) => removeVariantImageAt(idx, lang, imageIdx)}
                onRemoveFile={(lang, fileIdx) => removeVariantFileAt(idx, lang, fileIdx)}
                errors={errors}
                disabled={!!busy}
              />
            </div>
          ))
        )}
        <FieldError errors={errors} name="variants" />

        {variants.length > 0 && (
          <div className="flex justify-end">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={addVariant}
              disabled={variants.length >= 20}
            >
              <Plus className="mr-1 h-4 w-4" />
              Add Variant
            </Button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-6">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="isFeatured"
            checked={form.isFeatured}
            onChange={handleCheckbox}
          />
          Featured
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="isNew"
            checked={form.isNew}
            onChange={handleCheckbox}
          />
          New Arrival
        </label>
      </div>

      <div className="flex items-center gap-2">
        <Button type="button" variant="outline" onClick={() => router.push('/admin/product')}>Cancel</Button>
        <Button type="button" onClick={submit} disabled={!!busy} aria-busy={!!busy}>{busy || 'Save'}</Button>
      </div>
    </div>
  );
}
