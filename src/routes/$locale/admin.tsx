import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import type { Session } from "@supabase/supabase-js";
import { Download, Loader2, LogOut, MessageCircle, Phone, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { AdminProducts } from "@/components/admin/AdminProducts";
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
import { formatDate, formatPercent, formatPrice } from "@/i18n";
import { useLocaleData } from "@/i18n/useLocale";
import { supabase } from "@/integrations/supabase/client";
import { getAdminStatus, listOrders, updateOrderStatus } from "@/lib/orders.functions";
import { ORDER_STATUSES, type OrderStatus } from "@/lib/validation/order";

export const Route = createFileRoute("/$locale/admin")({
  ssr: false,
  head: () => ({ meta: [{ name: "robots", content: "noindex, nofollow" }] }),
  component: AdminPage,
});

type OrderRow = {
  id: string;
  created_at: string;
  customer_name: string;
  phone: string;
  city: string;
  address: string;
  product_name: string | null;
  variant: string | null;
  quantity: number;
  total_price: number;
  status: string;
};

function AdminPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  if (!ready) {
    return (
      <div className="grid min-h-screen place-items-center bg-cream">
        <Loader2 className="h-6 w-6 animate-spin text-brass" />
      </div>
    );
  }

  return session ? <Dashboard /> : <LoginCard />;
}

function LoginCard() {
  const { t } = useLocaleData();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const signIn = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) toast.error(t.admin.loginError);
  };

  return (
    <div className="grid min-h-screen place-items-center bg-cream px-5">
      <form
        onSubmit={signIn}
        className="w-full max-w-sm rounded-[1.5rem] bg-background p-8 shadow-[var(--shadow-soft)]"
      >
        <span className="font-display block text-center text-2xl tracking-[0.32em] text-primary">
          {t.brand.name.toUpperCase()}
        </span>
        <h1 className="font-display mt-6 text-2xl">{t.admin.loginTitle}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t.admin.loginSubtitle}</p>

        <div className="mt-6 space-y-4">
          <div>
            <Label htmlFor="email">{t.admin.email}</Label>
            <Input
              id="email"
              type="email"
              required
              className="mt-2"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="password">{t.admin.password}</Label>
            <Input
              id="password"
              type="password"
              required
              className="mt-2"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>
        </div>

        <Button type="submit" className="mt-6 w-full rounded-full" disabled={loading}>
          {loading ? t.admin.signingIn : t.admin.signIn}
        </Button>
      </form>
    </div>
  );
}

function Dashboard() {
  const { locale, t } = useLocaleData();
  const queryClient = useQueryClient();
  const fetchAdmin = useServerFn(getAdminStatus);
  const fetchOrders = useServerFn(listOrders);
  const mutateStatus = useServerFn(updateOrderStatus);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [cityFilter, setCityFilter] = useState<string>("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [tab, setTab] = useState<"orders" | "products">("orders");


  const adminQuery = useQuery({ queryKey: ["admin-status"], queryFn: () => fetchAdmin({}) });
  const ordersQuery = useQuery({
    queryKey: ["orders"],
    queryFn: () => fetchOrders({}) as Promise<OrderRow[]>,
    enabled: adminQuery.data?.isAdmin === true,
  });

  const update = useMutation({
    mutationFn: (input: { id: string; status: OrderStatus }) => mutateStatus({ data: input }),
    onSuccess: () => {
      toast.success(t.admin.updated);
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
    onError: () => toast.error(t.admin.updateError),
  });

  const orders = ordersQuery.data ?? [];
  const cities = useMemo(
    () => Array.from(new Set(orders.map((order) => order.city))).sort(),
    [orders],
  );

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return orders.filter((order) => {
      if (term && !`${order.customer_name} ${order.phone}`.toLowerCase().includes(term))
        return false;
      if (statusFilter !== "all" && order.status !== statusFilter) return false;
      if (cityFilter !== "all" && order.city !== cityFilter) return false;
      if (from && new Date(order.created_at) < new Date(from)) return false;
      if (to && new Date(order.created_at) > new Date(`${to}T23:59:59`)) return false;
      return true;
    });
  }, [orders, search, statusFilter, cityFilter, from, to]);

  const metrics = useMemo(() => {
    const count = (status: string) => orders.filter((order) => order.status === status).length;
    const today = new Date().toDateString();
    const delivered = count("delivered");
    return {
      total: orders.length,
      today: orders.filter((order) => new Date(order.created_at).toDateString() === today).length,
      confirmRate: orders.length
        ? (orders.length - count("pending") - count("cancelled")) / orders.length
        : 0,
      deliveryRate: orders.length ? delivered / orders.length : 0,
      returnRate: orders.length ? count("returned") / orders.length : 0,
      revenue: orders
        .filter((order) => order.status === "delivered")
        .reduce((sum, order) => sum + Number(order.total_price), 0),
    };
  }, [orders]);

  const exportCsv = () => {
    const header = [
      "date",
      "name",
      "phone",
      "city",
      "address",
      "product",
      "variant",
      "qty",
      "total",
      "status",
    ];
    const rows = filtered.map((order) => [
      order.created_at,
      order.customer_name,
      order.phone,
      order.city,
      order.address,
      order.product_name ?? "",
      order.variant ?? "",
      order.quantity,
      order.total_price,
      order.status,
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `serva-orders-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (adminQuery.isLoading) {
    return (
      <div className="grid min-h-screen place-items-center bg-cream">
        <Loader2 className="h-6 w-6 animate-spin text-brass" />
      </div>
    );
  }

  if (!adminQuery.data?.isAdmin) {
    return (
      <div className="grid min-h-screen place-items-center bg-cream px-5 text-center">
        <div>
          <p className="text-sm text-muted-foreground">{t.admin.forbidden}</p>
          <Button
            variant="outline"
            className="mt-4 rounded-full"
            onClick={() => supabase.auth.signOut()}
          >
            {t.admin.signOut}
          </Button>
        </div>
      </div>
    );
  }

  const metricCards = [
    { label: t.admin.metrics.total, value: String(metrics.total) },
    { label: t.admin.metrics.today, value: String(metrics.today) },
    { label: t.admin.metrics.confirmRate, value: formatPercent(metrics.confirmRate, locale) },
    { label: t.admin.metrics.deliveryRate, value: formatPercent(metrics.deliveryRate, locale) },
    { label: t.admin.metrics.returnRate, value: formatPercent(metrics.returnRate, locale) },
    { label: t.admin.metrics.revenue, value: formatPrice(metrics.revenue, locale) },
  ];

  return (
    <div className="min-h-screen bg-cream pb-16">
      <header className="border-b border-border bg-background">
        <div className="container-serva grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 py-4">
          <div className="min-w-0">
            <h1 className="font-display truncate text-2xl">{t.admin.title}</h1>
            <p className="truncate text-xs text-muted-foreground">{t.admin.subtitle}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="shrink-0 rounded-full"
            onClick={() => supabase.auth.signOut()}
          >
            <LogOut className="h-4 w-4" />
            {t.admin.signOut}
          </Button>
        </div>
      </header>

      <div className="container-serva mt-6 space-y-6">
        <div className="flex gap-2">
          {(["orders", "products"] as const).map((key) => (
            <Button
              key={key}
              size="sm"
              variant={tab === key ? "default" : "outline"}
              className="rounded-full"
              onClick={() => setTab(key)}
            >
              {t.admin.tabs[key]}
            </Button>
          ))}
        </div>

        {tab === "products" ? (
          <AdminProducts />
        ) : (
          <>
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {metricCards.map((card) => (
            <div key={card.label} className="rounded-2xl bg-background p-4">
              <p className="text-[0.65rem] uppercase tracking-widest text-muted-foreground">
                {card.label}
              </p>
              <p className="font-display mt-2 text-2xl">{card.value}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-3 rounded-2xl bg-background p-4 md:grid-cols-[minmax(0,1fr)_auto_auto_auto_auto_auto] md:items-center">
          <div className="relative min-w-0">
            <Search className="absolute inset-inline-start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t.admin.filters.search}
              className="ps-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="min-w-36">
              <SelectValue placeholder={t.admin.filters.status} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t.admin.filters.all}</SelectItem>
              {ORDER_STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {t.admin.status[status]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={cityFilter} onValueChange={setCityFilter}>
            <SelectTrigger className="min-w-36">
              <SelectValue placeholder={t.admin.filters.city} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t.admin.filters.all}</SelectItem>
              {cities.map((city) => (
                <SelectItem key={city} value={city}>
                  {city}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="date"
            value={from}
            onChange={(event) => setFrom(event.target.value)}
            aria-label={t.admin.filters.from}
          />
          <Input
            type="date"
            value={to}
            onChange={(event) => setTo(event.target.value)}
            aria-label={t.admin.filters.to}
          />
          <Button variant="outline" className="rounded-full" onClick={exportCsv}>
            <Download className="h-4 w-4" />
            {t.admin.filters.export}
          </Button>
        </div>

        <div className="overflow-x-auto rounded-2xl bg-background">
          <table className="w-full min-w-[56rem] text-sm">
            <thead className="border-b border-border text-start text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                {[
                  t.admin.table.date,
                  t.admin.table.customer,
                  t.admin.table.city,
                  t.admin.table.product,
                  t.admin.table.qty,
                  t.admin.table.total,
                  t.admin.table.status,
                ].map((label) => (
                  <th key={label} className="px-4 py-3 text-start font-medium">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ordersQuery.isLoading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center">
                    <Loader2 className="mx-auto h-5 w-5 animate-spin text-brass" />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                    {t.admin.table.empty}
                  </td>
                </tr>
              ) : (
                filtered.map((order) => (
                  <tr key={order.id} className="border-b border-border/60 last:border-0">
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground">
                      {formatDate(order.created_at, locale)}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{order.customer_name}</p>
                      <p dir="ltr" className="text-xs text-muted-foreground">
                        {order.phone}
                      </p>
                      <div className="mt-1 flex gap-2">
                        <a
                          href={`tel:${order.phone}`}
                          className="inline-flex items-center gap-1 text-xs text-brass"
                        >
                          <Phone className="h-3 w-3" />
                          {t.admin.table.call}
                        </a>
                        <a
                          href={`https://wa.me/${order.phone.replace(/^0/, "212").replace(/\D/g, "")}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-brass"
                        >
                          <MessageCircle className="h-3 w-3" />
                          {t.admin.table.whatsapp}
                        </a>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p>{order.city}</p>
                      <p className="max-w-52 truncate text-xs text-muted-foreground">
                        {order.address}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {order.product_name}
                      {order.variant ? ` · ${order.variant}` : ""}
                    </td>
                    <td className="px-4 py-3">{order.quantity}</td>
                    <td className="whitespace-nowrap px-4 py-3 font-medium">
                      {formatPrice(Number(order.total_price), locale)}
                    </td>
                    <td className="px-4 py-3">
                      <Select
                        value={order.status}
                        onValueChange={(value) =>
                          update.mutate({ id: order.id, status: value as OrderStatus })
                        }
                      >
                        <SelectTrigger className="min-w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ORDER_STATUSES.map((status) => (
                            <SelectItem key={status} value={status}>
                              {t.admin.status[status]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
          </>
        )}
      </div>
    </div>
  );
}
