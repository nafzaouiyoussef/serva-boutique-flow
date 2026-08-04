import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowDown,
  ArrowUp,
  Copy,
  Eye,
  EyeOff,
  ImagePlus,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
  Upload,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { formatPrice } from "@/i18n";
import { useLocaleData } from "@/i18n/useLocale";
import { supabase } from "@/integrations/supabase/client";
import {
  deleteProduct,
  duplicateProduct,
  listAdminProducts,
  saveProduct,
  setProductActive,
  type ProductRecord,
  type ProductVariant,
} from "@/lib/products.functions";

const BUCKET = "product-images";

type Draft = {
  id?: string;
  slug: string;
  name_fr: string;
  name_ar: string;
  description_fr: string;
  description_ar: string;
  price: string;
  compare_at_price: string;
  images: string[];
  variants: ProductVariant[];
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
  images: [],
  variants: [],
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
    images: product.images ?? [],
    variants: (product.variants ?? []).map((variant) => ({
      key: variant.key,
      fr: variant.fr,
      ar: variant.ar,
      swatch: variant.swatch ?? "",
    })),
    active: product.active,
  };
}

function slugifyFileName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\.[a-z0-9]+$/i, (ext) => ext) // keep extension
    .replace(/[^a-z0-9.]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function uploadToStorage(file: File, slug: string): Promise<string> {
  const path = `${slug || "unfiled"}/${Date.now()}-${slugifyFileName(file.name)}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type || "application/octet-stream",
  });
  if (error) throw new Error(error.message);
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

export function AdminProducts() {
  const { locale, t } = useLocaleData();
  const copy = t.admin.products;
  const queryClient = useQueryClient();
  const fetchProducts = useServerFn(listAdminProducts);
  const persist = useServerFn(saveProduct);
  const remove = useServerFn(deleteProduct);
  const toggleActive = useServerFn(setProductActive);
  const duplicate = useServerFn(duplicateProduct);

  const [draft, setDraft] = useState<Draft | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "visible" | "hidden">("all");
  const [pendingDelete, setPendingDelete] = useState<ProductRecord | null>(null);
  const [duplicateSource, setDuplicateSource] = useState<ProductRecord | null>(null);
  const [duplicateSlug, setDuplicateSlug] = useState("");

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
          images: input.images,
          variants: input.variants
            .filter((v) => v.key.trim())
            .map((v) => ({
              key: v.key.trim(),
              fr: v.fr.trim() || v.key.trim(),
              ar: v.ar.trim() || v.fr.trim() || v.key.trim(),
              ...(v.swatch?.trim() ? { swatch: v.swatch.trim() } : {}),
            })),
          active: input.active,
        },
      }),
    onSuccess: () => {
      toast.success(copy.saved);
      setDraft(null);
      invalidate();
    },
    onError: (err) => toast.error((err as Error).message || copy.saveError),
  });

  const destroy = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => {
      toast.success(copy.deleted);
      setPendingDelete(null);
      invalidate();
    },
    onError: () => toast.error(copy.deleteError),
  });

  const setActive = useMutation({
    mutationFn: (input: { id: string; active: boolean }) => toggleActive({ data: input }),
    onSuccess: () => {
      toast.success(copy.saved);
      invalidate();
    },
    onError: () => toast.error(copy.saveError),
  });

  const duplicateMutation = useMutation({
    mutationFn: (input: { sourceId: string; newSlug: string }) => duplicate({ data: input }),
    onSuccess: () => {
      toast.success(copy.duplicated);
      setDuplicateSource(null);
      setDuplicateSlug("");
      invalidate();
    },
    onError: (err) => toast.error((err as Error).message || copy.saveError),
  });

  const products = productsQuery.data ?? [];
  const counts = useMemo(
    () => ({
      total: products.length,
      visible: products.filter((p) => p.active).length,
      hidden: products.filter((p) => !p.active).length,
    }),
    [products],
  );
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return products.filter((product) => {
      if (statusFilter === "visible" && !product.active) return false;
      if (statusFilter === "hidden" && product.active) return false;
      if (term) {
        const hay = `${product.name_fr} ${product.name_ar} ${product.slug}`.toLowerCase();
        if (!hay.includes(term)) return false;
      }
      return true;
    });
  }, [products, search, statusFilter]);

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

      <div className="grid gap-3 rounded-2xl bg-background p-4 md:grid-cols-[minmax(0,1fr)_auto_auto] md:items-center">
        <div className="relative min-w-0">
          <Search className="absolute inset-inline-start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={copy.filters.search}
            className="ps-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
          <SelectTrigger className="min-w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{copy.filters.all}</SelectItem>
            <SelectItem value="visible">{copy.filters.visible}</SelectItem>
            <SelectItem value="hidden">{copy.filters.hidden}</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <CountPill label={copy.filters.total} value={counts.total} tone="neutral" />
          <CountPill label={copy.visible} value={counts.visible} tone="brass" />
          <CountPill label={copy.hidden} value={counts.hidden} tone="muted" />
        </div>
      </div>

      {productsQuery.isLoading ? (
        <div className="grid place-items-center rounded-2xl bg-background py-10">
          <Loader2 className="h-5 w-5 animate-spin text-brass" />
        </div>
      ) : filtered.length === 0 ? (
        <p className="rounded-2xl bg-background p-10 text-center text-muted-foreground">
          {copy.empty}
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              locale={locale}
              copy={copy}
              busy={setActive.isPending || duplicateMutation.isPending}
              onEdit={() => setDraft(toDraft(product))}
              onDuplicate={() => {
                setDuplicateSource(product);
                setDuplicateSlug(`${product.slug}-copy`);
              }}
              onToggleActive={(next) => setActive.mutate({ id: product.id, active: next })}
              onDelete={() => setPendingDelete(product)}
            />
          ))}
        </div>
      )}

      {draft ? (
        <DraftForm
          draft={draft}
          setDraft={setDraft}
          onCancel={() => setDraft(null)}
          onSubmit={() => save.mutate(draft)}
          saving={save.isPending}
          copy={copy}
        />
      ) : null}

      <AlertDialog open={pendingDelete !== null} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{copy.confirmDeleteTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {copy.confirmDelete}
              {pendingDelete ? (
                <span className="mt-2 block font-medium text-foreground">
                  {locale === "ar" ? pendingDelete.name_ar : pendingDelete.name_fr}
                </span>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{copy.cancel}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => pendingDelete && destroy.mutate(pendingDelete.id)}
              disabled={destroy.isPending}
            >
              {destroy.isPending ? (
                <Loader2 className="me-1 h-4 w-4 animate-spin" />
              ) : null}
              {copy.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={duplicateSource !== null} onOpenChange={(open) => !open && setDuplicateSource(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{copy.duplicateTitle}</DialogTitle>
            <DialogDescription>{copy.duplicateHint}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="dup-slug">{copy.slug}</Label>
            <Input
              id="dup-slug"
              dir="ltr"
              value={duplicateSlug}
              onChange={(e) => setDuplicateSlug(e.target.value)}
              autoFocus
              placeholder="serva-signature-copy"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDuplicateSource(null)}>
              {copy.cancel}
            </Button>
            <Button
              onClick={() =>
                duplicateSource &&
                duplicateMutation.mutate({
                  sourceId: duplicateSource.id,
                  newSlug: duplicateSlug.trim(),
                })
              }
              disabled={
                duplicateMutation.isPending ||
                !/^[a-z0-9-]{2,}$/.test(duplicateSlug.trim())
              }
            >
              {duplicateMutation.isPending ? (
                <Loader2 className="me-1 h-4 w-4 animate-spin" />
              ) : null}
              {copy.duplicate}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

type Copy = ReturnType<typeof useLocaleData>["t"]["admin"]["products"];

function ProductCard({
  product,
  locale,
  copy,
  busy,
  onEdit,
  onDuplicate,
  onToggleActive,
  onDelete,
}: {
  product: ProductRecord;
  locale: "fr" | "ar";
  copy: Copy;
  busy: boolean;
  onEdit: () => void;
  onDuplicate: () => void;
  onToggleActive: (next: boolean) => void;
  onDelete: () => void;
}) {
  return (
    <article className="overflow-hidden rounded-2xl bg-background">
      <div className="relative">
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
        <span
          className={
            (product.active
              ? "bg-brass/20 text-brass"
              : "bg-muted text-muted-foreground") +
            " absolute end-2 top-2 rounded-full px-2 py-0.5 text-[0.65rem]"
          }
        >
          {product.active ? copy.visible : copy.hidden}
        </span>
      </div>
      <div className="p-4">
        <h3 className="font-medium">
          {locale === "ar" ? product.name_ar : product.name_fr}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {formatPrice(Number(product.price), locale)}
        </p>

        <label className="mt-3 flex items-center justify-between rounded-xl bg-cream px-3 py-2 text-xs">
          <span className="flex items-center gap-2">
            {product.active ? (
              <Eye className="h-3.5 w-3.5 text-brass" />
            ) : (
              <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
            )}
            {product.active ? copy.visible : copy.hidden}
          </span>
          <Switch
            checked={product.active}
            onCheckedChange={onToggleActive}
            disabled={busy}
          />
        </label>

        <div className="mt-3 flex flex-wrap gap-2">
          <Button size="sm" variant="outline" className="rounded-full" onClick={onEdit}>
            <Pencil className="h-3.5 w-3.5" />
            {copy.edit}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="rounded-full"
            onClick={onDuplicate}
          >
            <Copy className="h-3.5 w-3.5" />
            {copy.duplicate}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="rounded-full text-destructive"
            onClick={onDelete}
          >
            <Trash2 className="h-3.5 w-3.5" />
            {copy.delete}
          </Button>
        </div>
      </div>
    </article>
  );
}

function DraftForm({
  draft,
  setDraft,
  onCancel,
  onSubmit,
  saving,
  copy,
}: {
  draft: Draft;
  setDraft: (next: Draft) => void;
  onCancel: () => void;
  onSubmit: () => void;
  saving: boolean;
  copy: Copy;
}) {
  return (
    <form
      className="grid gap-4 rounded-2xl bg-background p-5 md:grid-cols-2"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <div>
        <Label htmlFor="slug">{copy.slug}</Label>
        <Input
          id="slug"
          required
          dir="ltr"
          className="mt-2"
          value={draft.slug}
          onChange={(event) => setDraft({ ...draft, slug: event.target.value })}
        />
      </div>
      <div className="flex items-end gap-3">
        <label className="flex items-center gap-3">
          <Switch
            checked={draft.active}
            onCheckedChange={(v) => setDraft({ ...draft, active: v })}
          />
          <span className="text-sm">{copy.active}</span>
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
        <ImagesEditor draft={draft} setDraft={setDraft} copy={copy} />
      </div>

      <div className="md:col-span-2">
        <VariantsEditor draft={draft} setDraft={setDraft} copy={copy} />
      </div>

      <div className="flex gap-3 md:col-span-2">
        <Button type="submit" className="rounded-full" disabled={saving}>
          {saving ? <Loader2 className="me-1 h-4 w-4 animate-spin" /> : null}
          {copy.save}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="rounded-full"
          onClick={onCancel}
        >
          {copy.cancel}
        </Button>
      </div>
    </form>
  );
}

function ImagesEditor({
  draft,
  setDraft,
  copy,
}: {
  draft: Draft;
  setDraft: (next: Draft) => void;
  copy: Copy;
}) {
  const [urlInput, setUrlInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const setImages = (images: string[]) => setDraft({ ...draft, images });

  const onFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const uploaded: string[] = [];
      for (const file of Array.from(files)) {
        // eslint-disable-next-line no-await-in-loop
        uploaded.push(await uploadToStorage(file, draft.slug));
      }
      setImages([...draft.images, ...uploaded]);
      toast.success(copy.imageUploaded);
    } catch (err) {
      toast.error((err as Error).message || copy.imageUploadError);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const addUrl = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    try {
      new URL(trimmed);
    } catch {
      toast.error(copy.imageUrlInvalid);
      return;
    }
    setImages([...draft.images, trimmed]);
    setUrlInput("");
  };

  const move = (index: number, delta: number) => {
    const next = [...draft.images];
    const target = index + delta;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target]!, next[index]!];
    setImages(next);
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <Label>{copy.imagesLabel}</Label>
        <span className="text-xs text-muted-foreground">{copy.imagesHint}</span>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <input
          ref={fileRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={(e) => onFiles(e.target.files)}
        />
        <Button
          type="button"
          variant="outline"
          className="rounded-full"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? (
            <>
              <Loader2 className="me-1 h-4 w-4 animate-spin" />
              {copy.imageUploading}
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" />
              {copy.imageUpload}
            </>
          )}
        </Button>
        <div className="flex flex-1 items-center gap-2">
          <Input
            dir="ltr"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://…"
          />
          <Button type="button" variant="secondary" className="rounded-full" onClick={addUrl}>
            <ImagePlus className="h-4 w-4" />
            {copy.imageAddUrl}
          </Button>
        </div>
      </div>

      {draft.images.length === 0 ? (
        <p className="mt-3 text-xs text-muted-foreground">{copy.imagesEmpty}</p>
      ) : (
        <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {draft.images.map((url, index) => (
            <li
              key={`${url}-${index}`}
              className="group relative overflow-hidden rounded-xl bg-cream"
            >
              <img
                src={url}
                alt=""
                className="aspect-square w-full object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.opacity = "0.3";
                }}
              />
              <div className="absolute inset-x-2 top-2 flex justify-between opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                <div className="flex gap-1">
                  <IconButton
                    onClick={() => move(index, -1)}
                    disabled={index === 0}
                    label={copy.imageMoveUp}
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </IconButton>
                  <IconButton
                    onClick={() => move(index, 1)}
                    disabled={index === draft.images.length - 1}
                    label={copy.imageMoveDown}
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </IconButton>
                </div>
                <IconButton
                  destructive
                  onClick={() => setImages(draft.images.filter((_, i) => i !== index))}
                  label={copy.imageRemove}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </IconButton>
              </div>
              {index === 0 ? (
                <span className="absolute bottom-2 start-2 rounded-full bg-brass px-2 py-0.5 text-[0.6rem] font-semibold text-brass-foreground">
                  {copy.imagePrimary}
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function VariantsEditor({
  draft,
  setDraft,
  copy,
}: {
  draft: Draft;
  setDraft: (next: Draft) => void;
  copy: Copy;
}) {
  const setVariants = (variants: ProductVariant[]) => setDraft({ ...draft, variants });
  const update = (index: number, patch: Partial<ProductVariant>) => {
    const next = [...draft.variants];
    next[index] = { ...next[index]!, ...patch };
    setVariants(next);
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <Label>{copy.variantsLabel}</Label>
        <span className="text-xs text-muted-foreground">{copy.variantsHint}</span>
      </div>

      {draft.variants.length === 0 ? (
        <p className="mt-2 text-xs text-muted-foreground">{copy.variantsEmpty}</p>
      ) : (
        <ul className="mt-2 space-y-2">
          {draft.variants.map((variant, index) => (
            <li
              key={index}
              className="grid gap-2 rounded-xl bg-cream p-3 md:grid-cols-[8rem_minmax(0,1fr)_minmax(0,1fr)_9rem_auto] md:items-end"
            >
              <div>
                <Label className="text-[0.7rem]">{copy.variantKey}</Label>
                <Input
                  dir="ltr"
                  className="mt-1 h-9 bg-background"
                  placeholder="burgundy"
                  value={variant.key}
                  onChange={(e) => update(index, { key: e.target.value })}
                />
              </div>
              <div>
                <Label className="text-[0.7rem]">{copy.variantFr}</Label>
                <Input
                  className="mt-1 h-9 bg-background"
                  value={variant.fr}
                  onChange={(e) => update(index, { fr: e.target.value })}
                />
              </div>
              <div>
                <Label className="text-[0.7rem]">{copy.variantAr}</Label>
                <Input
                  dir="rtl"
                  className="mt-1 h-9 bg-background"
                  value={variant.ar}
                  onChange={(e) => update(index, { ar: e.target.value })}
                />
              </div>
              <div>
                <Label className="text-[0.7rem]">{copy.variantSwatch}</Label>
                <div className="mt-1 flex items-center gap-1">
                  <input
                    type="color"
                    className="h-9 w-9 shrink-0 cursor-pointer rounded-lg border border-border bg-background"
                    value={hexOrDefault(variant.swatch)}
                    onChange={(e) => update(index, { swatch: e.target.value })}
                    aria-label={copy.variantSwatch}
                  />
                  <Input
                    dir="ltr"
                    className="h-9 bg-background"
                    placeholder="#6E2B3A"
                    value={variant.swatch ?? ""}
                    onChange={(e) => update(index, { swatch: e.target.value })}
                  />
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-destructive"
                onClick={() => setVariants(draft.variants.filter((_, i) => i !== index))}
                aria-label={copy.variantRemove}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <Button
        type="button"
        variant="outline"
        className="mt-3 rounded-full"
        onClick={() =>
          setVariants([...draft.variants, { key: "", fr: "", ar: "", swatch: "" }])
        }
      >
        <Plus className="h-4 w-4" />
        {copy.variantAdd}
      </Button>
    </div>
  );
}

function CountPill({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "neutral" | "brass" | "muted";
}) {
  const cls =
    tone === "brass"
      ? "bg-brass/15 text-brass"
      : tone === "muted"
        ? "bg-muted text-muted-foreground"
        : "bg-primary/10 text-primary";
  return (
    <span className={`rounded-full px-3 py-1 font-medium ${cls}`}>
      {label} · {value}
    </span>
  );
}

function IconButton({
  children,
  onClick,
  disabled,
  destructive,
  label,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  destructive?: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className={`grid h-7 w-7 place-items-center rounded-full bg-background/95 shadow disabled:opacity-40 ${
        destructive ? "text-destructive" : "text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function hexOrDefault(value: string | undefined): string {
  if (!value) return "#c9a45a";
  const trimmed = value.trim();
  return /^#[0-9a-fA-F]{6}$/.test(trimmed) ? trimmed : "#c9a45a";
}
