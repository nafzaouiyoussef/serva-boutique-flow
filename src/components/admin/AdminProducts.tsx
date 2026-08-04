import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatPrice } from "@/i18n";
import { useLocaleData } from "@/i18n/useLocale";
import {
  deleteProduct,
  listAdminProducts,
  saveProduct,
  type ProductRecord,
  type ProductVariant,
} from "@/lib/products.functions";

type Draft = {
  id?: string;
  slug: string;
  name_fr: string;
  name_ar: string;
  description_fr: string;
  description_ar: string;
  price: string;
  compare_at_price: string;
  images: string;
  variants: string;
  active: boolean;
};

const emptyDraft: Draft = {
  slug: "",
  name_fr: "",
  name_ar: "",
  description_fr: "",
  description_ar: "",
  price: "399",
  compare_at_price: "",
  images: "",
  variants: "",
  active: true,
};

function toDraft(product: ProductRecord): Draft {
  return {
    id: product.id,
    slug: product.slug,
    name_fr: product.name_fr,
    name_ar: product.name_ar,
    description_fr: product.description_fr ?? "",
    description_ar: product.description_ar ?? "",
    price: String(product.price),
    compare_at_price: product.compare_at_price ? String(product.compare_at_price) : "",
    images: (product.images ?? []).join("\n"),
    variants: (product.variants ?? [])
      .map((variant) => [variant.key, variant.fr, variant.ar, variant.swatch ?? ""].join(" | "))
      .join("\n"),
    active: product.active,
  };
}

function parseVariants(value: string): ProductVariant[] {
  return value
    .split("\n")
    .map((line) => line.split("|").map((part) => part.trim()))
    .filter((parts) => parts[0])
    .map((parts) => ({
      key: parts[0]!,
      fr: parts[1] || parts[0]!,
      ar: parts[2] || parts[1] || parts[0]!,
      ...(parts[3] ? { swatch: parts[3] } : {}),
    }));
}

export function AdminProducts() {
  const { locale, t } = useLocaleData();
  const copy = t.admin.products;
  const queryClient = useQueryClient();
  const fetchProducts = useServerFn(listAdminProducts);
  const persist = useServerFn(saveProduct);
  const remove = useServerFn(deleteProduct);

  const [draft, setDraft] = useState<Draft | null>(null);

  const productsQuery = useQuery({
    queryKey: ["admin-products"],
    queryFn: () => fetchProducts({}),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    queryClient.invalidateQueries({ queryKey: ["public-products"] });
  };

  const save = useMutation({
    mutationFn: (input: Draft) =>
      persist({
        data: {
          ...(input.id ? { id: input.id } : {}),
          slug: input.slug.trim(),
          name_fr: input.name_fr.trim(),
          name_ar: input.name_ar.trim(),
          description_fr: input.description_fr.trim() || null,
          description_ar: input.description_ar.trim() || null,
          price: Number(input.price),
          compare_at_price: input.compare_at_price ? Number(input.compare_at_price) : null,
          images: input.images
            .split("\n")
            .map((line) => line.trim())
            .filter(Boolean),
          variants: parseVariants(input.variants),
          active: input.active,
        },
      }),
    onSuccess: () => {
      toast.success(copy.saved);
      setDraft(null);
      invalidate();
    },
    onError: () => toast.error(copy.saveError),
  });

  const destroy = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => {
      toast.success(copy.deleted);
      invalidate();
    },
    onError: () => toast.error(copy.deleteError),
  });

  const products = productsQuery.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl">{copy.title}</h2>
          <p className="text-sm text-muted-foreground">{copy.subtitle}</p>
        </div>
        <Button className="rounded-full" onClick={() => setDraft({ ...emptyDraft })}>
          <Plus className="h-4 w-4" />
          {copy.add}
        </Button>
      </div>

      {draft ? (
        <form
          className="grid gap-4 rounded-2xl bg-background p-5 md:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            save.mutate(draft);
          }}
        >
          <div>
            <Label htmlFor="slug">{copy.slug}</Label>
            <Input
              id="slug"
              required
              className="mt-2"
              value={draft.slug}
              onChange={(event) => setDraft({ ...draft, slug: event.target.value })}
            />
          </div>
          <div className="flex items-end gap-3">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={draft.active}
                onChange={(event) => setDraft({ ...draft, active: event.target.checked })}
              />
              {copy.active}
            </label>
          </div>
          <div>
            <Label htmlFor="name_fr">{copy.nameFr}</Label>
            <Input
              id="name_fr"
              required
              className="mt-2"
              value={draft.name_fr}
              onChange={(event) => setDraft({ ...draft, name_fr: event.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="name_ar">{copy.nameAr}</Label>
            <Input
              id="name_ar"
              required
              dir="rtl"
              className="mt-2"
              value={draft.name_ar}
              onChange={(event) => setDraft({ ...draft, name_ar: event.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="description_fr">{copy.descFr}</Label>
            <Textarea
              id="description_fr"
              className="mt-2"
              value={draft.description_fr}
              onChange={(event) => setDraft({ ...draft, description_fr: event.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="description_ar">{copy.descAr}</Label>
            <Textarea
              id="description_ar"
              dir="rtl"
              className="mt-2"
              value={draft.description_ar}
              onChange={(event) => setDraft({ ...draft, description_ar: event.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="price">{copy.price}</Label>
            <Input
              id="price"
              type="number"
              min="1"
              required
              className="mt-2"
              value={draft.price}
              onChange={(event) => setDraft({ ...draft, price: event.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="compare">{copy.compareAt}</Label>
            <Input
              id="compare"
              type="number"
              min="0"
              className="mt-2"
              value={draft.compare_at_price}
              onChange={(event) => setDraft({ ...draft, compare_at_price: event.target.value })}
            />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="images">{copy.images}</Label>
            <Textarea
              id="images"
              rows={3}
              className="mt-2"
              value={draft.images}
              onChange={(event) => setDraft({ ...draft, images: event.target.value })}
            />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="variants">{copy.variants}</Label>
            <Textarea
              id="variants"
              rows={3}
              className="mt-2"
              value={draft.variants}
              onChange={(event) => setDraft({ ...draft, variants: event.target.value })}
            />
          </div>
          <div className="flex gap-3 md:col-span-2">
            <Button type="submit" className="rounded-full" disabled={save.isPending}>
              {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {copy.save}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              onClick={() => setDraft(null)}
            >
              {copy.cancel}
            </Button>
          </div>
        </form>
      ) : null}

      {productsQuery.isLoading ? (
        <div className="grid place-items-center rounded-2xl bg-background py-10">
          <Loader2 className="h-5 w-5 animate-spin text-brass" />
        </div>
      ) : products.length === 0 ? (
        <p className="rounded-2xl bg-background p-10 text-center text-muted-foreground">
          {copy.empty}
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <article key={product.id} className="overflow-hidden rounded-2xl bg-background">
              {product.images?.[0] ? (
                <img
                  src={product.images[0]}
                  alt={product.name_fr}
                  loading="lazy"
                  className="aspect-square w-full object-cover"
                />
              ) : (
                <div className="aspect-square w-full bg-sand" />
              )}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-medium">
                    {locale === "ar" ? product.name_ar : product.name_fr}
                  </h3>
                  <span
                    className={
                      product.active
                        ? "rounded-full bg-brass/20 px-2 py-0.5 text-[0.65rem] text-brass"
                        : "rounded-full bg-muted px-2 py-0.5 text-[0.65rem] text-muted-foreground"
                    }
                  >
                    {product.active ? copy.visible : copy.hidden}
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {formatPrice(Number(product.price), locale)}
                </p>
                <div className="mt-4 flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-full"
                    onClick={() => setDraft(toDraft(product))}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    {copy.edit}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="rounded-full text-destructive"
                    disabled={destroy.isPending}
                    onClick={() => {
                      if (window.confirm(copy.confirmDelete)) destroy.mutate(product.id);
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    {copy.delete}
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
