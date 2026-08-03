import { zodResolver } from "@hookform/resolvers/zod";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, Loader2, Minus, Plus, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatPrice } from "@/i18n";
import { useLocaleData } from "@/i18n/useLocale";
import { MOROCCAN_CITIES } from "@/lib/cities";
import { createOrder } from "@/lib/orders.functions";
import { PRODUCT, computeTotal, deliveryFeeFor } from "@/lib/product";
import { cn } from "@/lib/utils";
import { orderSchema, type OrderInput } from "@/lib/validation/order";

type ErrorCode = keyof ReturnType<typeof useLocaleData>["t"]["form"]["errors"];

export function OrderForm() {
  const { locale, t } = useLocaleData();
  const submitOrder = useServerFn(createOrder);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [otherCity, setOtherCity] = useState(false);

  const form = useForm<OrderInput>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      customer_name: "",
      phone: "",
      city: "",
      address: "",
      variant: PRODUCT.variants[0].key,
      quantity: 1,
      locale,
      source: "landing",
      company: "",
    },
  });

  const quantity = Number(form.watch("quantity") ?? 1);
  const variant = form.watch("variant");
  const total = computeTotal(quantity);
  const delivery = deliveryFeeFor(quantity);

  const errorText = (code?: string) =>
    code && code in t.form.errors ? t.form.errors[code as ErrorCode] : undefined;

  const onSubmit = form.handleSubmit(async (values) => {
    setStatus("idle");
    try {
      await submitOrder({ data: { ...values, locale } });
      setStatus("success");
      form.reset({ ...form.getValues(), customer_name: "", phone: "", address: "" });
    } catch {
      setStatus("error");
    }
  });

  const setQuantity = (next: number) =>
    form.setValue("quantity", Math.min(10, Math.max(1, next)), { shouldValidate: true });

  if (status === "success") {
    return (
      <section id="order" className="scroll-mt-24 bg-background py-16 md:py-24">
        <div className="container-serva max-w-xl">
          <div className="rounded-[1.75rem] bg-cream p-10 text-center shadow-[var(--shadow-soft)]">
            <CheckCircle2 className="mx-auto h-12 w-12 text-brass" />
            <h2 className="font-display mt-4 text-3xl">{t.form.successTitle}</h2>
            <p className="mt-3 text-sm text-muted-foreground">{t.form.successText}</p>
            <Button className="mt-8 rounded-full px-8" onClick={() => setStatus("idle")}>
              {t.form.successAgain}
            </Button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="order" className="scroll-mt-24 bg-background py-16 md:py-24">
      <div className="container-serva max-w-2xl">
        <p className="eyebrow text-center">{t.form.eyebrow}</p>
        <h2 className="font-display mt-3 text-center text-3xl sm:text-4xl">{t.form.title}</h2>
        <p className="mx-auto mt-3 max-w-md text-center text-sm text-muted-foreground">
          {t.form.subtitle}
        </p>

        <form
          onSubmit={onSubmit}
          noValidate
          className="mt-10 space-y-5 rounded-[1.75rem] bg-cream p-6 shadow-[var(--shadow-soft)] sm:p-8"
        >
          <input
            type="text"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            className="hidden"
            {...form.register("company")}
          />

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <Label htmlFor="customer_name">{t.form.name}</Label>
              <Input
                id="customer_name"
                className="mt-2 bg-background"
                placeholder={t.form.namePlaceholder}
                autoComplete="name"
                {...form.register("customer_name")}
              />
              <FieldError message={errorText(form.formState.errors.customer_name?.message)} />
            </div>

            <div>
              <Label htmlFor="phone">{t.form.phone}</Label>
              <Input
                id="phone"
                dir="ltr"
                inputMode="tel"
                className="mt-2 bg-background"
                placeholder={t.form.phonePlaceholder}
                autoComplete="tel"
                {...form.register("phone")}
              />
              <FieldError message={errorText(form.formState.errors.phone?.message)} />
            </div>
          </div>

          <div>
            <Label>{t.form.city}</Label>
            {otherCity ? (
              <Input
                className="mt-2 bg-background"
                placeholder={t.form.cityCustom}
                {...form.register("city")}
              />
            ) : (
              <Select
                onValueChange={(value) => {
                  if (value === "__other__") {
                    setOtherCity(true);
                    form.setValue("city", "");
                    return;
                  }
                  form.setValue("city", value, { shouldValidate: true });
                }}
              >
                <SelectTrigger className="mt-2 w-full bg-background">
                  <SelectValue placeholder={t.form.cityPlaceholder} />
                </SelectTrigger>
                <SelectContent>
                  {MOROCCAN_CITIES.map((city) => (
                    <SelectItem key={city.fr} value={locale === "ar" ? city.ar : city.fr}>
                      {locale === "ar" ? city.ar : city.fr}
                    </SelectItem>
                  ))}
                  <SelectItem value="__other__">{t.form.cityOther}</SelectItem>
                </SelectContent>
              </Select>
            )}
            <FieldError message={errorText(form.formState.errors.city?.message)} />
          </div>

          <div>
            <Label htmlFor="address">{t.form.address}</Label>
            <Textarea
              id="address"
              rows={3}
              className="mt-2 bg-background"
              placeholder={t.form.addressPlaceholder}
              {...form.register("address")}
            />
            <FieldError message={errorText(form.formState.errors.address?.message)} />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <Label>{t.form.variant}</Label>
              <div className="mt-2 flex gap-2">
                {PRODUCT.variants.map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => form.setValue("variant", option.key)}
                    aria-label={locale === "ar" ? option.ar : option.fr}
                    className={cn(
                      "flex items-center gap-2 rounded-full border px-3 py-2 text-xs transition-colors",
                      variant === option.key
                        ? "border-brass bg-background"
                        : "border-border hover:border-brass/60",
                    )}
                  >
                    <span
                      className="h-4 w-4 rounded-full border border-border"
                      style={{ backgroundColor: option.swatch }}
                    />
                    {locale === "ar" ? option.ar : option.fr}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label>{t.form.quantity}</Label>
              <div className="mt-2 flex w-fit items-center gap-1 rounded-full border border-border bg-background p-1">
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 rounded-full"
                  onClick={() => setQuantity(quantity - 1)}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-8 text-center text-sm font-semibold">{quantity}</span>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 rounded-full"
                  onClick={() => setQuantity(quantity + 1)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <dl className="space-y-2 rounded-2xl bg-background p-4 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">
                {quantity} × {formatPrice(PRODUCT.unitPrice, locale)}
              </dt>
              <dd>{formatPrice(PRODUCT.unitPrice * quantity, locale)}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">{t.offer.delivery}</dt>
              <dd className={delivery === 0 ? "text-brass" : undefined}>
                {delivery === 0 ? t.offer.deliveryFree : formatPrice(delivery, locale)}
              </dd>
            </div>
            <div className="flex items-center justify-between border-t border-border pt-2">
              <dt className="font-semibold">{t.form.total}</dt>
              <dd className="font-display text-2xl">{formatPrice(total, locale)}</dd>
            </div>
          </dl>

          {status === "error" ? (
            <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm">
              <p className="font-semibold text-destructive">{t.form.errorTitle}</p>
              <p className="mt-1 text-muted-foreground">{t.form.errorText}</p>
            </div>
          ) : null}

          <Button
            type="submit"
            size="lg"
            className="w-full rounded-full"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t.form.submitting}
              </>
            ) : status === "error" ? (
              t.form.retry
            ) : (
              t.form.submit
            )}
          </Button>

          <p className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="h-4 w-4 shrink-0 text-brass" />
            {t.hero.badge1} · {t.hero.badge3}
          </p>
        </form>
      </div>
    </section>
  );
}

function FieldError({ message }: { message?: string | undefined }) {
  if (!message) return null;
  return <p className="mt-1.5 text-xs text-destructive">{message}</p>;
}
