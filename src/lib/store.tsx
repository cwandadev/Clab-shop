import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { detectCurrency, type Currency } from "./currency";

export type CartItem = {
  id: string;
  slug: string;
  name: string;
  price_usd: number;
  image_url: string | null;
  quantity: number;
};

export type WishlistItem = {
  id: string;
  slug: string;
  name: string;
  price_usd: number;
  image_url: string | null;
};

type StoreState = {
  cart: CartItem[];
  currency: Currency;
  wishlist: WishlistItem[];
  recentlyViewed: string[]; // product ids, most recent first
  addToCart: (item: Omit<CartItem, "quantity">, qty?: number) => void;
  removeFromCart: (id: string) => void;
  updateQty: (id: string, qty: number) => void;
  clearCart: () => void;
  setCurrency: (c: Currency) => void;
  toggleWishlist: (item: WishlistItem) => void;
  isWishlisted: (id: string) => boolean;
  trackView: (id: string) => void;
  cartCount: number;
  wishlistCount: number;
  subtotalUsd: number;
};

const StoreContext = createContext<StoreState | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<string[]>([]);
  const [currency, setCurrency] = useState<Currency>("RWF");

  useEffect(() => {
    try {
      const c = localStorage.getItem("tl_cart");
      const w = localStorage.getItem("tl_wishlist");
      const rv = localStorage.getItem("tl_recent");
      const cur = localStorage.getItem("tl_currency");
      if (c) setCart(JSON.parse(c));
      if (w) setWishlist(JSON.parse(w));
      if (rv) setRecentlyViewed(JSON.parse(rv));
      if (cur) setCurrency(cur as Currency);
      else setCurrency(detectCurrency());
    } catch {}
  }, []);

  useEffect(() => {
    localStorage.setItem("tl_cart", JSON.stringify(cart));
  }, [cart]);
  useEffect(() => {
    localStorage.setItem("tl_wishlist", JSON.stringify(wishlist));
  }, [wishlist]);
  useEffect(() => {
    localStorage.setItem("tl_recent", JSON.stringify(recentlyViewed));
  }, [recentlyViewed]);
  useEffect(() => {
    localStorage.setItem("tl_currency", currency);
  }, [currency]);

  const addToCart: StoreState["addToCart"] = (item, qty = 1) => {
    setCart((prev) => {
      const existing = prev.find((p) => p.id === item.id);
      if (existing) {
        return prev.map((p) => (p.id === item.id ? { ...p, quantity: p.quantity + qty } : p));
      }
      return [...prev, { ...item, quantity: qty }];
    });
  };

  const removeFromCart = (id: string) => setCart((p) => p.filter((i) => i.id !== id));
  const updateQty = (id: string, qty: number) =>
    setCart((p) => p.map((i) => (i.id === id ? { ...i, quantity: Math.max(1, qty) } : i)));
  const clearCart = () => setCart([]);

  const toggleWishlist = (item: WishlistItem) => {
    setWishlist((prev) =>
      prev.find((p) => p.id === item.id) ? prev.filter((p) => p.id !== item.id) : [...prev, item],
    );
  };
  const isWishlisted = (id: string) => wishlist.some((p) => p.id === id);

  const trackView = (id: string) =>
    setRecentlyViewed((prev) => [id, ...prev.filter((x) => x !== id)].slice(0, 20));

  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);
  const subtotalUsd = cart.reduce((s, i) => s + i.price_usd * i.quantity, 0);

  return (
    <StoreContext.Provider
      value={{
        cart,
        currency,
        wishlist,
        recentlyViewed,
        addToCart,
        removeFromCart,
        updateQty,
        clearCart,
        setCurrency,
        toggleWishlist,
        isWishlisted,
        trackView,
        cartCount,
        wishlistCount: wishlist.length,
        subtotalUsd,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}

// Free shipping rule: Kigali orders >= $10 USD
export function computeShippingUsd(city: string, subtotalUsd: number): number {
  const isKigali = city.trim().toLowerCase() === "kigali";
  if (isKigali && subtotalUsd >= 10) return 0;
  if (isKigali) return 2;
  return 8;
}

/** Categories considered "electronic components" — buttons say "Add to Kit". */
const COMPONENT_KEYWORDS = [
  "component",
  "led",
  "diode",
  "resistor",
  "capacit",
  "arduino",
  "raspberry",
  "microcontroller",
  "sensor",
  "module",
  "wire",
  "battery",
  "pcb",
  "transistor",
  "ic",
  "circuit",
  "magnet",
  "relay",
];

export function isComponentProduct(p: {
  category?: string | null;
  product_type?: string | null;
}): boolean {
  if (p.product_type === "digital_circuit") return true;
  const cat = (p.category || "").toLowerCase();
  return COMPONENT_KEYWORDS.some((k) => cat.includes(k));
}
