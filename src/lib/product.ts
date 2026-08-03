export const PRODUCT_SLUG = "serva-signature";

export const PRODUCT = {
  slug: PRODUCT_SLUG,
  unitPrice: 399,
  compareAtPrice: 599,
  deliveryFee: 30,
  freeDeliveryFromQty: 2,
  bundleQty: 2,
  variants: [
    { key: "burgundy", fr: "Bordeaux", ar: "عنابي", swatch: "oklch(0.375 0.106 12.5)" },
    { key: "sand", fr: "Sable", ar: "رملي", swatch: "oklch(0.82 0.045 78)" },
    { key: "black", fr: "Noir", ar: "أسود", swatch: "oklch(0.24 0.005 60)" },
  ],
} as const;

export type VariantKey = (typeof PRODUCT.variants)[number]["key"];

export function deliveryFeeFor(quantity: number): number {
  return quantity >= PRODUCT.freeDeliveryFromQty ? 0 : PRODUCT.deliveryFee;
}

export function computeTotal(quantity: number): number {
  const qty = Math.min(Math.max(Math.trunc(quantity) || 1, 1), 10);
  return qty * PRODUCT.unitPrice + deliveryFeeFor(qty);
}
