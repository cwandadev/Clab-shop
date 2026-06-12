import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Header } from "@/components/Header";
import { useStore, computeShippingUsd } from "@/lib/store";
import { formatPrice } from "@/lib/currency";
import { createCheckoutSession, confirmOrderPaid } from "@/lib/checkout.functions";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/checkout")({
  head: () => ({ meta: [{ title: "Checkout — Circuit Archive" }] }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const { cart, currency, subtotalUsd, clearCart } = useStore();
  const navigate = useNavigate();
  const createSession = useServerFn(createCheckoutSession);
  const confirmPaid = useServerFn(confirmOrderPaid);

  const [city, setCity] = useState("Kigali");
  const [form, setForm] = useState({
    customer_name: "",
    customer_email: "",
    customer_phone: "",
    address: "",
  });
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);

  const shipping = computeShippingUsd(city, subtotalUsd);
  const total = subtotalUsd + shipping;

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setAuthed(!!data.user);
      if (data.user?.email) setForm((f) => ({ ...f, customer_email: data.user!.email! }));
    });
  }, []);

  // Handle Stripe success redirect (?order=...)
  useEffect(() => {
    const url = new URL(window.location.href);
    const orderId = url.searchParams.get("order");
    if (orderId) {
      confirmPaid({ data: { order_id: orderId } })
        .then((r) => {
          if (r.status === "paid") {
            toast.success("Payment confirmed. Order placed!");
            clearCart();
          }
          navigate({ to: "/", replace: true });
        })
        .catch((e) => toast.error(e.message));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="mx-auto max-w-2xl px-4 py-24 text-center">
          <p className="text-sm text-muted-foreground">Your cart is empty.</p>
          <Link to="/" className="mt-4 inline-block underline">
            Continue shopping
          </Link>
        </main>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!authed) {
      navigate({ to: "/auth", search: { redirect: "/checkout" } as never });
      return;
    }
    setLoading(true);
    try {
      const origin = window.location.origin;
      const res = await createSession({
        data: {
          ...form,
          customer_phone: form.customer_phone || null,
          city,
          display_currency: currency,
          items: cart.map((i) => ({ product_id: i.id, quantity: i.quantity })),
          success_url: `${origin}/checkout`,
          cancel_url: `${origin}/cart`,
        },
      });
      window.location.href = res.url;
    } catch (err: any) {
      toast.error(err.message || "Checkout failed");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <h1 className="text-2xl font-medium tracking-tight">Checkout</h1>

        {authed === false && (
          <div className="mt-6 rounded-md border border-accent/30 bg-accent/5 p-4 text-sm">
            Please{" "}
            <Link to="/auth" search={{ redirect: "/checkout" } as never} className="font-medium underline">
              sign in
            </Link>{" "}
            to complete your order.
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">
          <div className="space-y-6">
            <fieldset className="space-y-4">
              <legend className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                Delivery_Info
              </legend>
              <Input
                label="Full name"
                required
                value={form.customer_name}
                onChange={(v) => setForm({ ...form, customer_name: v })}
              />
              <Input
                label="Email"
                type="email"
                required
                value={form.customer_email}
                onChange={(v) => setForm({ ...form, customer_email: v })}
              />
              <Input
                label="Phone (optional)"
                value={form.customer_phone}
                onChange={(v) => setForm({ ...form, customer_phone: v })}
              />
              <div>
                <label className="block text-xs font-medium mb-1">City</label>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option>Kigali</option>
                  <option>Other (Rwanda)</option>
                  <option>International</option>
                </select>
              </div>
              <Input
                label="Address"
                required
                value={form.address}
                onChange={(v) => setForm({ ...form, address: v })}
              />
            </fieldset>
          </div>

          <aside className="h-fit rounded-lg border border-border bg-background p-6">
            <h2 className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-4">
              Order_Summary
            </h2>
            <ul className="space-y-2 text-sm">
              {cart.map((i) => (
                <li key={i.id} className="flex justify-between gap-2">
                  <span className="truncate">
                    {i.name}{" "}
                    <span className="font-mono text-muted-foreground">×{i.quantity}</span>
                  </span>
                  <span className="font-mono">{formatPrice(i.price_usd * i.quantity, currency)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 border-t border-border pt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-mono">{formatPrice(subtotalUsd, currency)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping</span>
                <span className="font-mono">
                  {shipping === 0 ? "FREE" : formatPrice(shipping, currency)}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-border font-medium text-base">
                <span>Total</span>
                <span className="font-mono">{formatPrice(total, currency)}</span>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="mt-6 w-full rounded-md bg-accent py-3 text-sm font-medium text-accent-foreground disabled:opacity-50"
            >
              {loading ? "Redirecting to Stripe…" : "Pay with Card"}
            </button>
            <p className="mt-2 text-[10px] text-muted-foreground text-center">
              Secure payment by Stripe. Charged in USD.
            </p>
          </aside>
        </form>
      </main>
    </div>
  );
}

function Input(props: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1">{props.label}</label>
      <input
        type={props.type || "text"}
        required={props.required}
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      />
    </div>
  );
}
