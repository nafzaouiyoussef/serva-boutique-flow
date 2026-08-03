import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { computeTotal, PRODUCT_SLUG } from "./product";
import { ORDER_STATUSES, orderSchema } from "./validation/order";

/** Public COD order submission — anon insert only, protected by RLS. */
export const createOrder = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => orderSchema.parse(input))
  .handler(async ({ data }) => {
    if (data.company) {
      // Honeypot tripped: pretend success, store nothing.
      return { ok: true as const, id: null };
    }

    const { createPublicServerClient } = await import("./supabase-public.server");
    const supabase = createPublicServerClient();

    const { data: product } = await supabase
      .from("products")
      .select("id, name_fr, name_ar, price")
      .eq("slug", PRODUCT_SLUG)
      .maybeSingle();

    const total = computeTotal(data.quantity);



    const { data: inserted, error } = await supabase
      .from("orders")
      .insert({
        product_id: product?.id ?? null,
        product_name: (data.locale === "ar" ? product?.name_ar : product?.name_fr) ?? "Serva",
        variant: data.variant ?? null,
        quantity: data.quantity,
        customer_name: data.customer_name,
        phone: data.phone,
        city: data.city,
        address: data.address,
        total_price: total,
        locale: data.locale,
        source: data.source ?? null,
      })
      .select("id")
      .single();

    if (error) throw new Error(error.message);

    // TODO(notifications): send a WhatsApp/SMS alert to the shop owner here.
    return { ok: true as const, id: inserted.id };
  });

/** Is the signed-in user an admin? */
export const getAdminStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();

    if (error) throw new Error(error.message);
    return { isAdmin: Boolean(data) };
  });

/** Admin-only: full order list (RLS enforces the admin role). */
export const listOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1000);

    if (error) throw new Error(error.message);
    return data;
  });

/** Admin-only: move an order through the COD lifecycle. */
export const updateOrderStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ id: z.string().uuid(), status: z.enum(ORDER_STATUSES) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("orders")
      .update({ status: data.status })
      .eq("id", data.id);

    if (error) throw new Error(error.message);
    return { ok: true as const };
  });
