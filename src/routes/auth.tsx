import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Header } from "@/components/Header";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign in — Circuit Archive" }] }),
  validateSearch: (s: Record<string, unknown>) => ({
    redirect: typeof s.redirect === "string" ? s.redirect : "/",
  }),
  component: AuthPage,
});

function AuthPage() {
  const { redirect } = Route.useSearch();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: redirect as never, replace: true });
    });
  }, [navigate, redirect]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { display_name: name || email.split("@")[0] },
          },
        });
        if (error) throw error;
        toast.success("Account created. You're signed in!");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Signed in");
      }
      navigate({ to: redirect as never, replace: true });
    } catch (e: any) {
      toast.error(e.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-md px-4 py-16">
        <h1 className="text-2xl font-medium tracking-tight">
          {mode === "signin" ? "Sign in" : "Create account"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {mode === "signin"
            ? "Welcome back. Sign in to checkout and view orders."
            : "Create an account to place orders and track shipments."}
        </p>

        <form onSubmit={submit} className="mt-8 space-y-4">
          {mode === "signup" && (
            <Field label="Display name">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-base"
              />
            </Field>
          )}
          <Field label="Email">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-base"
            />
          </Field>
          <Field label="Password">
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-base"
            />
          </Field>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-foreground py-3 text-sm font-medium text-background disabled:opacity-50"
          >
            {loading ? "Working…" : mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>

        <button
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="mt-6 text-sm text-muted-foreground hover:text-foreground underline"
        >
          {mode === "signin" ? "Need an account? Create one" : "Already have an account? Sign in"}
        </button>

        <p className="mt-12 text-xs text-muted-foreground">
          Admins:{" "}
          <Link to="/admin-signup" className="underline">
            claim admin access
          </Link>{" "}
          with your team code.
        </p>
      </main>

      <style>{`.input-base{width:100%;border:1px solid var(--input);border-radius:6px;padding:0.5rem 0.75rem;font-size:0.875rem;background:var(--background)}`}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1">{label}</label>
      {children}
    </div>
  );
}
