import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Header } from "@/components/Header";
import { getProductBySlug } from "@/lib/products.functions";
import { useStore } from "@/lib/store";
import { formatPrice } from "@/lib/currency";

export const Route = createFileRoute("/products/$slug")({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(
      queryOptions({
        queryKey: ["product", params.slug],
        queryFn: () => getProductBySlug({ data: { slug: params.slug } }),
      }),
    ),
  head: ({ params }) => ({
    meta: [
      { title: `${params.slug.replace(/-/g, " ")} — Circuit Archive` },
      { name: "description", content: `Buy ${params.slug.replace(/-/g, " ")} at Circuit Archive.` },
    ],
  }),
  component: ProductPage,
  errorComponent: ({ error }) => (
    <div className="p-8 text-center text-sm text-muted-foreground">{error.message}</div>
  ),
  notFoundComponent: () => (
    <div className="p-8 text-center text-sm text-muted-foreground">Product not found.</div>
  ),
});

function ProductPage() {
  const { slug } = Route.useParams();
  const { data: product } = useSuspenseQuery(
    queryOptions({
      queryKey: ["product", slug],
      queryFn: () => getProductBySlug({ data: { slug } }),
    }),
  );
  if (!product) throw notFound();
  const { addToCart, currency } = useStore();
  const [qty, setQty] = useState(1);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <Link to="/" className="font-mono text-xs uppercase text-muted-foreground hover:text-foreground">
          ← Back to inventory
        </Link>
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="aspect-square rounded-lg bg-secondary outline-1 -outline-offset-1 outline-black/5 grid place-items-center overflow-hidden">
            {product.image_url ? (
              <img src={product.image_url} alt={product.name} className="size-full object-cover" />
            ) : (
              <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                {product.category}
              </span>
            )}
          </div>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-accent mb-3">
              {product.category}
            </p>
            <h1 className="text-3xl font-medium tracking-tight text-balance">{product.name}</h1>
            <p className="mt-4 text-3xl font-mono">{formatPrice(Number(product.price_usd), currency)}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {product.spec_1 && (
                <span className="rounded bg-secondary px-2 py-1 font-mono text-[10px] text-muted-foreground ring-1 ring-black/5">
                  {product.spec_1}
                </span>
              )}
              {product.spec_2 && (
                <span className="rounded bg-secondary px-2 py-1 font-mono text-[10px] text-muted-foreground ring-1 ring-black/5">
                  {product.spec_2}
                </span>
              )}
            </div>
            <p className="mt-6 text-sm text-muted-foreground leading-relaxed">
              {product.description}
            </p>
            <p className="mt-6 font-mono text-xs text-muted-foreground">
              Stock: {product.stock} units available
            </p>
            <div className="mt-8 flex items-center gap-4">
              <div className="flex items-center rounded-md border border-border">
                <button
                  className="px-3 py-2 text-sm"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                >
                  −
                </button>
                <span className="w-10 text-center font-mono text-sm">{qty}</span>
                <button
                  className="px-3 py-2 text-sm"
                  onClick={() => setQty((q) => Math.min(product.stock, q + 1))}
                >
                  +
                </button>
              </div>
              <button
                disabled={product.stock === 0}
                onClick={() => {
                  addToCart(
                    {
                      id: product.id,
                      slug: product.slug,
                      name: product.name,
                      price_usd: Number(product.price_usd),
                      image_url: product.image_url,
                    },
                    qty,
                  );
                  toast.success(`Added ${qty} × ${product.name} to kit`);
                }}
                className="flex-1 rounded-md bg-foreground py-3 text-sm font-medium text-background hover:bg-accent transition-colors disabled:opacity-50"
              >
                {product.stock === 0 ? "Out of stock" : "Add to Kit"}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
