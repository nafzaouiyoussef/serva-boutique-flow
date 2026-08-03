import { z } from "zod";

/**
 * Moroccan mobile/landline: 06XXXXXXXX, 07XXXXXXXX, 05XXXXXXXX or +212 6/7/5XXXXXXXX.
 * Spaces, dots and dashes are tolerated and stripped before validation.
 */
export const MOROCCAN_PHONE_REGEX = /^(?:\+212|00212|0)([5-7])\d{8}$/;

export function normalizePhone(raw: string): string {
  return raw.replace(/[\s.\-()]/g, "");
}

export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "shipped",
  "delivered",
  "returned",
  "cancelled",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

/** Messages are error CODES; the UI maps them to the active locale. */
export const orderSchema = z.object({
  customer_name: z.string().trim().min(2, "name").max(80, "name"),
  phone: z
    .string()
    .trim()
    .transform(normalizePhone)
    .refine((value) => MOROCCAN_PHONE_REGEX.test(value), "phone"),
  city: z.string().trim().min(2, "city").max(60, "city"),
  address: z.string().trim().min(10, "address").max(400, "address"),
  variant: z.string().trim().max(40).optional(),
  quantity: z.coerce.number().int().min(1, "quantity").max(10, "quantity"),
  locale: z.enum(["fr", "ar"]).default("fr"),
  source: z.string().trim().max(40).optional(),
  /** Honeypot — must stay empty. */
  company: z.string().max(0).optional(),
});

export type OrderInput = z.input<typeof orderSchema>;
export type OrderPayload = z.output<typeof orderSchema>;
