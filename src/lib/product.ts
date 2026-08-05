export const PRODUCT_SLUG = "serva-signature";

export const PRODUCT = {
  slug: PRODUCT_SLUG,
  unitPrice: 179,
  compareAtPrice: 245,
  deliveryFee: 0,
  freeDeliveryFromQty: 1,
  bundleQty: 2,
  variants: [
    { key: "cream", fr: "Crème", ar: "كريمي", swatch: "oklch(0.93 0.02 90)" },
    { key: "black", fr: "Noir", ar: "أسود", swatch: "oklch(0.24 0.005 60)" },
    { key: "pink", fr: "Rose", ar: "وردي", swatch: "oklch(0.82 0.06 15)" },
  ],
} as const;

export type VariantKey = (typeof PRODUCT.variants)[number]["key"];

/** Pack pricing — delivery is always free. */
export const PACKS = [
  { qty: 1, price: 179 },
  { qty: 2, price: 299 },
  { qty: 3, price: 399 },
] as const;

export function packPriceFor(quantity: number): number {
  const qty = Math.min(Math.max(Math.trunc(quantity) || 1, 1), 10);
  const pack = PACKS.find((p) => p.qty === qty);
  if (pack) return pack.price;
  // Beyond the biggest pack: best pack + pack price for the remainder.
  const biggest = PACKS[PACKS.length - 1]!;
  const packs = Math.floor(qty / biggest.qty);
  const rest = qty % biggest.qty;
  return packs * biggest.price + (PACKS.find((p) => p.qty === rest)?.price ?? 0);
}

/** Full price of `quantity` bags bought separately (used to show the savings). */
export function listPriceFor(quantity: number): number {
  const qty = Math.min(Math.max(Math.trunc(quantity) || 1, 1), 10);
  return qty * PRODUCT.unitPrice;
}

export function savingsFor(quantity: number): number {
  return Math.max(0, listPriceFor(quantity) - packPriceFor(quantity));
}

export function deliveryFeeFor(_quantity: number): number {
  return 0;
}

export function computeTotal(quantity: number): number {
  return packPriceFor(quantity);
}
