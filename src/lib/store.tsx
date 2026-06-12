import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Currency } from "./currency";

export type CartItem = {
  id: string;
  slug: string;
  name: string;
  price_usd: number;
  image_url: string | null;
  quantity: number;
};

type StoreState = {
  cart: CartItem[];
  currency: Currency;
  addToCart: (item: Omit<CartItem, "quantity">, qty?: number) => void;
  removeFromCart: (id: string) => void;
  updateQty: (id: string, qty: number) => void;
  clearCart: () => void;
  setCurrency: (c: Currency) => void;
  cartCount: number;
  subtotalUsd: number;
};

const StoreContext = createContext<StoreState | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [currency, setCurrency] = useState<Currency>("USD");

  useEffect(() => {
    try {
      const c = localStorage.getItem("ca_cart");
      const cur = localStorage.getItem("ca_currency");
      if (c) setCart(JSON.parse(c));
      if (cur) setCurrency(cur as Currency);
    } catch {}
  }, []);

  useEffect(() => {
    localStorage.setItem("ca_cart", JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem("ca_currency", currency);
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

  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);
  const subtotalUsd = cart.reduce((s, i) => s + i.price_usd * i.quantity, 0);

  return (
    <StoreContext.Provider
      value={{
        cart,
        currency,
        addToCart,
        removeFromCart,
        updateQty,
        clearCart,
        setCurrency,
        cartCount,
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
