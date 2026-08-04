import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const productVariantSchema = z.object({
  key: z.string().min(1),
  fr: z.string().min(1),
  ar: z.string().min(1),
  swatch: z.string().optional(),
});

export const productSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z
    .string()
    .min(2)
    .regex(/^[a-z0-9-]+$/),
  name_fr: z.string().min(2),
  name_ar: z.string().min(2),
  description_fr: z.string().optional().nullable(),
  description_ar: z.string().optional().nullable(),
  price: z.number().positive(),
  compare_at_price: z.number().positive().nullable().optional(),
  images: z.array(z.string().min(1)).default([]),
  variants: z.array(productVariantSchema).default([]),
  active: z.boolean().default(true),
});

export type ProductInput = z.infer<typeof productSchema>;
export type ProductVariant = z.infer<typeof productVariantSchema>;

export type ProductRecord = {
  id: string;
  slug: string;
  name_fr: string;
  name_ar: string;
  description_fr: string | null;
  description_ar: string | null;
  price: number;
  compare_at_price: number | null;
  images: string[];
  variants: ProductVariant[];
  active: boolean;
};

/** Public catalogue: active products only (anon RLS). */
export const listPublicProducts = createServerFn({ method: "GET" }).handler(async () => {
  const { createPublicServerClient } = await import("./supabase-public.server");
  const supabase = createPublicServerClient();

  const { data, error } = await supabase
    .from("products")
    .select(
      "id, slug, name_fr, name_ar, description_fr, description_ar, price, compare_at_price, images, variants, active",
    )
    .eq("active", true)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as ProductRecord[];
});

/** Admin-only: every product, active or not. */
export const listAdminProducts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) throw new Error(error.message);
    return (data ?? []) as unknown as ProductRecord[];
  });

/** Admin-only: create or update a product (RLS enforces the admin role). */
export const saveProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => productSchema.parse(input))
  .handler(async ({ data, context }) => {
    const payload = {
      slug: data.slug,
      name_fr: data.name_fr,
      name_ar: data.name_ar,
      description_fr: data.description_fr ?? null,
      description_ar: data.description_ar ?? null,
      price: data.price,
      compare_at_price: data.compare_at_price ?? null,
      images: data.images,
      variants: data.variants,
      active: data.active,
    };

    const query = data.id
      ? context.supabase.from("products").update(payload).eq("id", data.id)
      : context.supabase.from("products").insert(payload);

    const { error } = await query;
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

/** Admin-only: remove a product. */
export const deleteProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("products").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });
