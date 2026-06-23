import { Link } from "@tanstack/react-router";
import { ShoppingCart, User, Heart } from "lucide-react";
import { useStore } from "@/lib/store";
import { CURRENCIES } from "@/lib/currency";
import { Logo } from "./Logo";

export function Header() {
  const { cartCount, wishlistCount, currency, setCurrency } = useStore();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <nav className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-4 sm:gap-8">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <Logo className="size-8" />
            <div className="flex flex-col leading-none">
              <span className="font-mono text-sm font-bold tracking-tight">Clab</span>
              <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
                from tieflab · hardware
              </span>
            </div>
          </Link>
          <div className="hidden md:flex items-center gap-6">
            <Link
              to="/"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              activeProps={{ className: "text-sm font-medium text-foreground" }}
              activeOptions={{ exact: true }}
            >
              Shop
            </Link>
            <Link
              to="/wishlist"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground md:hidden lg:inline"
            >
              Wishlist
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <div className="hidden sm:flex items-center gap-1 rounded-md bg-secondary p-0.5 ring-1 ring-black/5">
            {CURRENCIES.map((c) => (
              <button
                key={c}
                onClick={() => setCurrency(c)}
                className={
                  "rounded px-2 py-1 font-mono text-[10px] transition-colors " +
                  (currency === c
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground")
                }
              >
                {c === "RWF" ? "FRW" : c}
              </button>
            ))}
          </div>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value as never)}
            className="sm:hidden rounded-md bg-secondary px-2 py-1 font-mono text-[10px] ring-1 ring-black/5"
          >
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c === "RWF" ? "FRW" : c}
              </option>
            ))}
          </select>
          <Link
            to="/wishlist"
            className="relative hidden sm:inline-flex size-9 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary"
            aria-label="Wishlist"
          >
            <Heart className="size-4" />
            {wishlistCount > 0 && (
              <span className="absolute -top-1 -right-1 grid h-4 min-w-4 place-items-center rounded-full bg-accent px-1 font-mono text-[9px] text-accent-foreground">
                {wishlistCount}
              </span>
            )}
          </Link>
          <Link
            to="/auth"
            className="hidden sm:inline-flex size-9 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary"
            aria-label="Account"
          >
            <User className="size-4" />
          </Link>
          <Link
            to="/cart"
            className="flex items-center gap-2 rounded-md bg-foreground py-2 pl-2 pr-3 text-sm font-medium text-background ring-1 ring-foreground"
          >
            <ShoppingCart className="size-4 shrink-0" />
            <span className="font-mono text-xs">
              [{String(cartCount).padStart(2, "0")}]
            </span>
          </Link>
        </div>
      </nav>
      <div className="bg-foreground py-1.5 text-background">
        <p className="text-center font-mono text-[10px] uppercase tracking-widest">
          Kigali Delivery: Free on all orders exceeding $10 USD
        </p>
      </div>
    </header>
  );
}
