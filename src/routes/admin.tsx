import { createFileRoute, Link, Outlet, redirect, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { isCurrentUserAdmin } from "@/lib/products.functions";

export const Route = createFileRoute("/admin")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth", search: { redirect: "/admin" } as never });
  },
  component: AdminLayout,
});

function AdminLayout() {
  const checkAdmin = useServerFn(isCurrentUserAdmin);
  const [status, setStatus] = useState<"loading" | "admin" | "denied">("loading");
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    checkAdmin()
      .then((r) => setStatus(r.isAdmin ? "admin" : "denied"))
      .catch(() => setStatus("denied"));
  }, [checkAdmin]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <p className="p-12 text-center text-sm text-muted-foreground">Checking access…</p>
      </div>
    );
  }
  if (status === "denied") {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="mx-auto max-w-md px-4 py-16 text-center">
          <h1 className="text-xl font-medium">Admin access required</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your account does not have admin permissions. Ask an existing tieflab admin to grant you
            access.
          </p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex items-end justify-between border-b border-border pb-4 gap-4 flex-wrap">
          <div>
            <h1 className="text-lg font-medium tracking-tight">Admin Console</h1>
            <p className="font-mono text-xs text-muted-foreground">
              Operational // Warehouse Kigali
            </p>
          </div>
          <nav className="flex gap-1 rounded-md bg-secondary p-0.5 ring-1 ring-black/5">
            <TabLink to="/admin" exact pathname={pathname} label="Products" />
            <TabLink to="/admin/orders" pathname={pathname} label="Orders" />
            <TabLink to="/admin/new" pathname={pathname} label="+ New Product" />
          </nav>
        </div>
        <Outlet />
      </div>
    </div>
  );
}

function TabLink({
  to,
  label,
  pathname,
  exact,
}: {
  to: string;
  label: string;
  pathname: string;
  exact?: boolean;
}) {
  const active = exact ? pathname === to : pathname.startsWith(to);
  return (
    <Link
      to={to}
      className={
        "rounded px-3 py-1.5 text-xs font-medium transition-colors " +
        (active ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground")
      }
    >
      {label}
    </Link>
  );
}
