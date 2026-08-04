/**
 * Owner notifications on a new COD order.
 *
 * Loaded only from server code (never bundled to the browser). We keep the
 * transport pluggable via env vars so the shop owner can flip on WhatsApp,
 * SMS, or a Slack/Discord/Zapier webhook without a redeploy.
 *
 * Env vars (all optional — missing means "skip this transport"):
 *   ORDER_NOTIFY_WEBHOOK_URL  → generic HTTPS POST (Slack/Discord/Zapier/…).
 *   ORDER_NOTIFY_WHATSAPP_TO  → WhatsApp number in E.164 (e.g. +212612345678).
 *   TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN / TWILIO_WHATSAPP_FROM
 *                            → Twilio credentials for the WhatsApp transport.
 */

type OrderNotice = {
  id: string | null;
  customer_name: string;
  phone: string;
  city: string;
  address: string;
  product_name: string;
  variant: string | null;
  quantity: number;
  total_price: number;
  locale: string;
};

function formatMessage(order: OrderNotice): string {
  const lines = [
    "🛍️  Nouvelle commande Serva",
    `${order.customer_name} — ${order.phone}`,
    `${order.city} · ${order.address}`,
    `${order.quantity} × ${order.product_name}${order.variant ? ` (${order.variant})` : ""}`,
    `Total: ${order.total_price} MAD`,
    order.id ? `Ref: ${order.id}` : "",
  ];
  return lines.filter(Boolean).join("\n");
}

async function postWebhook(url: string, text: string): Promise<void> {
  // Slack/Discord/Zapier all accept a JSON body with either { text } or
  // { content }. Sending both keeps everyone happy.
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ text, content: text }),
  });
  if (!res.ok) {
    throw new Error(`webhook ${res.status}: ${await res.text().catch(() => "")}`);
  }
}

async function postWhatsAppTwilio(to: string, text: string): Promise<void> {
  const sid = process.env["TWILIO_ACCOUNT_SID"];
  const token = process.env["TWILIO_AUTH_TOKEN"];
  const from = process.env["TWILIO_WHATSAPP_FROM"];
  if (!sid || !token || !from) {
    // TODO(notifications): wire real Twilio credentials to enable WhatsApp
    // delivery. Until then this transport is a no-op.
    return;
  }
  const body = new URLSearchParams({
    From: `whatsapp:${from}`,
    To: `whatsapp:${to}`,
    Body: text,
  });
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`,
      "content-type": "application/x-www-form-urlencoded",
    },
    body,
  });
  if (!res.ok) {
    throw new Error(`twilio ${res.status}: ${await res.text().catch(() => "")}`);
  }
}

/**
 * Fire-and-forget notification dispatch. Errors are logged but never surface
 * to the customer — a failed WhatsApp ping must not fail the order insert.
 */
export async function notifyNewOrder(order: OrderNotice): Promise<void> {
  const text = formatMessage(order);
  const webhookUrl = process.env["ORDER_NOTIFY_WEBHOOK_URL"];
  const whatsappTo = process.env["ORDER_NOTIFY_WHATSAPP_TO"];

  const tasks: Promise<void>[] = [];
  if (webhookUrl) tasks.push(postWebhook(webhookUrl, text));
  if (whatsappTo) tasks.push(postWhatsAppTwilio(whatsappTo, text));
  if (tasks.length === 0) return;

  const results = await Promise.allSettled(tasks);
  for (const result of results) {
    if (result.status === "rejected") {
      console.error("[notifyNewOrder]", result.reason);
    }
  }
}
