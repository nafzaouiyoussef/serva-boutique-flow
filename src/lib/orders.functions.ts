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

    // Fire-and-forget owner notification (WhatsApp / webhook). Never fails the order.
    try {
      const { notifyNewOrder } = await import("./notifications.server");
      await notifyNewOrder({
        id: inserted.id,
        customer_name: data.customer_name,
        phone: data.phone,
        city: data.city,
        address: data.address,
        product_name:
          (data.locale === "ar" ? product?.name_ar : product?.name_fr) ?? "Serva",
        variant: data.variant ?? null,
        quantity: data.quantity,
        total_price: total,
        locale: data.locale,
      });
    } catch (notifyErr) {
      console.error("[createOrder] notification failed:", notifyErr);
    }

    return { ok: true as const, id: inserted.id };
  });

/**
 * Is the signed-in user an admin?
 *
 * Goes through the SECURITY DEFINER `public.has_role` function rather than
 * SELECT-ing user_roles directly, because relying on the anon/authenticated
 * client's RLS view of user_roles was flaky in production (row visible in the
 * SQL editor but the same query via PostgREST returned nothing — likely a
 * JWT/RLS edge case). The RPC bypasses RLS and always returns the right
 * answer as long as the JWT is valid.
 */
export const getAdminStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    // Admin whitelist via Vercel env (ADMIN_EMAILS) — bypasses the user_roles table.
    const adminEmails = (process.env["ADMIN_EMAILS"] ?? "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
    if (adminEmails.length > 0) {
        const currentEmail = String(context.claims?.email ?? "").toLowerCase();
      if (currentEmail && adminEmails.includes(currentEmail)) {
        return { isAdmin: true };
      }
    }
    const { data, error } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (error) throw new Error(error.message);
    return { isAdmin: data === true };
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
