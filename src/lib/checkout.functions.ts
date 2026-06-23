import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const cartItemSchema = z.object({
  product_id: z.string().uuid(),
  quantity: z.number().int().positive().max(999),
});

const checkoutSchema = z.object({
  customer_name: z.string().trim().min(1).max(120),
  customer_email: z.string().trim().email().max(255),
  customer_phone: z.string().trim().max(40).optional().nullable(),
  city: z.string().trim().min(1).max(80),
  address: z.string().trim().min(1).max(400),
  display_currency: z.enum(["USD", "RWF", "EUR", "GBP"]).default("USD"),
  items: z.array(cartItemSchema).min(1).max(50),
  success_url: z.string().url(),
  cancel_url: z.string().url(),
});

function computeShippingUsd(city: string, subtotalUsd: number) {
  const isKigali = city.trim().toLowerCase() === "kigali";
  if (isKigali && subtotalUsd >= 10) return 0;
  if (isKigali) return 2;
  return 8;
}

/**
 * Creates a Stripe Checkout Session. Charges in USD regardless of display currency.
 * Server is the only place that decides prices — never trust client-passed prices.
 */
export const createCheckoutSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => checkoutSchema.parse(d))
  .handler(async ({ data, context }) => {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) throw new Error("Stripe is not configured. Please add STRIPE_SECRET_KEY.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Fetch authoritative product info
    const ids = data.items.map((i) => i.product_id);
    const { data: products, error: pErr } = await supabaseAdmin
      .from("products")
      .select("id, name, price_usd, stock, active")
      .in("id", ids);
    if (pErr) throw new Error(pErr.message);
    if (!products || products.length === 0) throw new Error("No products found");

    const lineItems: Array<{
      product_id: string;
      product_name: string;
      unit_price_usd: number;
      quantity: number;
    }> = [];
    let subtotalUsd = 0;
    for (const item of data.items) {
      const p = products.find((x) => x.id === item.product_id);
      if (!p || !p.active) throw new Error(`Product unavailable`);
      if (p.stock < item.quantity) throw new Error(`Not enough stock for ${p.name}`);
      lineItems.push({
        product_id: p.id,
        product_name: p.name,
        unit_price_usd: Number(p.price_usd),
        quantity: item.quantity,
      });
      subtotalUsd += Number(p.price_usd) * item.quantity;
    }

    const shippingUsd = computeShippingUsd(data.city, subtotalUsd);
    const totalUsd = subtotalUsd + shippingUsd;

    // Create the order in pending state
    const { data: order, error: oErr } = await supabaseAdmin
      .from("orders")
      .insert({
        user_id: context.userId,
        customer_name: data.customer_name,
        customer_email: data.customer_email,
        customer_phone: data.customer_phone || null,
        city: data.city,
        address: data.address,
        subtotal_usd: Number(subtotalUsd.toFixed(2)),
        shipping_usd: Number(shippingUsd.toFixed(2)),
        total_usd: Number(totalUsd.toFixed(2)),
        display_currency: data.display_currency,
        status: "pending",
      })
      .select()
      .single();
    if (oErr || !order) throw new Error(oErr?.message || "Could not create order");

    await supabaseAdmin.from("order_items").insert(
      lineItems.map((l) => ({
        order_id: order.id,
        product_id: l.product_id,
        product_name: l.product_name,
        unit_price_usd: Number(l.unit_price_usd.toFixed(2)),
        quantity: l.quantity,
      })),
    );

    // Build Stripe Checkout Session via REST API (no SDK needed)
    const form = new URLSearchParams();
    form.append("mode", "payment");
    form.append("success_url", `${data.success_url}?order=${order.id}`);
    form.append("cancel_url", data.cancel_url);
    form.append("customer_email", data.customer_email);
    form.append("metadata[order_id]", order.id);

    lineItems.forEach((l, i) => {
      form.append(`line_items[${i}][price_data][currency]`, "usd");
      form.append(`line_items[${i}][price_data][product_data][name]`, l.product_name);
      form.append(
        `line_items[${i}][price_data][unit_amount]`,
        String(Math.round(l.unit_price_usd * 100)),
      );
      form.append(`line_items[${i}][quantity]`, String(l.quantity));
    });
    if (shippingUsd > 0) {
      const i = lineItems.length;
      form.append(`line_items[${i}][price_data][currency]`, "usd");
      form.append(`line_items[${i}][price_data][product_data][name]`, "Shipping");
      form.append(
        `line_items[${i}][price_data][unit_amount]`,
        String(Math.round(shippingUsd * 100)),
      );
      form.append(`line_items[${i}][quantity]`, "1");
    }
    form.append("payment_method_types[0]", "card");

    const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: form,
    });
    const json: any = await res.json();
    if (!res.ok) {
      console.error("Stripe error", json);
      throw new Error(json?.error?.message || "Stripe checkout failed");
    }

    await supabaseAdmin
      .from("orders")
      .update({ payment_intent_id: json.payment_intent || json.id })
      .eq("id", order.id);

    return { url: json.url as string, order_id: order.id };
  });

/** Called after redirect from Stripe — verifies the session is paid and marks order. */
export const confirmOrderPaid = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ order_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) throw new Error("Stripe is not configured.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: order } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("id", data.order_id)
      .maybeSingle();
    if (!order || order.user_id !== context.userId) throw new Error("Order not found");
    if (order.status === "paid") return { status: "paid" };
    if (!order.payment_intent_id) return { status: order.status };

    // payment_intent_id may actually be a checkout session id (cs_...) — retrieve session.
    const sessionId = order.payment_intent_id;
    if (sessionId.startsWith("cs_")) {
      const res = await fetch(`https://api.stripe.com/v1/checkout/sessions/${sessionId}`, {
        headers: { Authorization: `Bearer ${stripeKey}` },
      });
      const json: any = await res.json();
      if (json.payment_status === "paid") {
        await supabaseAdmin.from("orders").update({ status: "paid" }).eq("id", order.id);
        // Decrement stock
        const { data: items } = await supabaseAdmin
          .from("order_items")
          .select("product_id, quantity")
          .eq("order_id", order.id);
        for (const it of items ?? []) {
          if (!it.product_id) continue;
          (await supabaseAdmin.rpc) as any; // no rpc; manual update
          const { data: prod } = await supabaseAdmin
            .from("products")
            .select("stock")
            .eq("id", it.product_id)
            .maybeSingle();
          if (prod) {
            await supabaseAdmin
              .from("products")
              .update({ stock: Math.max(0, prod.stock - it.quantity) })
              .eq("id", it.product_id);
          }
        }
        return { status: "paid" };
      }
    }
    return { status: order.status };
  });
