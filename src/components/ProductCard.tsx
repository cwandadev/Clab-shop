import { Link } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { formatPrice } from "@/lib/currency";
import { toast } from "sonner";

export type ProductCardData = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  price_usd: number;
  image_url: string | null;
  spec_1: string | null;
  spec_2: string | null;
  stock: number;
};

export function ProductCard({ product }: { product: ProductCardData }) {
  const { addToCart, currency } = useStore();

  return (
    <div className="flex flex-col bg-background p-6 group">
      <Link
        to="/products/$slug"
        params={{ slug: product.slug }}
        className="mb-6 grid aspect-square w-full place-items-center rounded-[min(1vw,12px)] bg-secondary outline-1 -outline-offset-1 outline-black/5 overflow-hidden"
      >
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="size-full object-cover transition-transform group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
            {product.slug.slice(0, 12)}
          </span>
        )}
      </Link>
      <div className="flex-1">
        <div className="mb-1 flex justify-between items-start gap-3">
          <Link
            to="/products/$slug"
            params={{ slug: product.slug }}
            className="text-sm font-medium hover:text-accent"
          >
            {product.name}
          </Link>
          <span className="font-mono text-sm whitespace-nowrap">
            {formatPrice(product.price_usd, currency)}
          </span>
        </div>
        <div className="mb-4 flex flex-wrap gap-2">
          {product.spec_1 && (
            <span className="rounded bg-secondary px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground ring-1 ring-black/5">
              {product.spec_1}
            </span>
          )}
          {product.spec_2 && (
            <span className="rounded bg-secondary px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground ring-1 ring-black/5">
              {product.spec_2}
            </span>
          )}
        </div>
        {product.description && (
          <p className="mb-6 text-sm text-muted-foreground text-pretty leading-relaxed line-clamp-2">
            {product.description}
          </p>
        )}
      </div>
      <button
        onClick={() => {
          addToCart(
            {
              id: product.id,
              slug: product.slug,
              name: product.name,
              price_usd: product.price_usd,
              image_url: product.image_url,
            },
            1,
          );
          toast.success(`${product.name} added to kit`);
        }}
        disabled={product.stock === 0}
        className="w-full rounded bg-secondary px-3 py-2 text-sm font-medium ring-1 ring-black/5 transition-colors hover:bg-foreground hover:text-background disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {product.stock === 0 ? "Out of stock" : "Add to Kit"}
      </button>
    </div>
  );
}
