import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Header } from "@/components/Header";
import { supabase } from "@/integrations/supabase/client";
import { claimAdminWithCode } from "@/lib/admin.functions";

export const Route = createFileRoute("/admin-signup")({
  head: () => ({ meta: [{ title: "Claim admin — Circuit Archive" }] }),
  component: AdminSignup,
});

function AdminSignup() {
  const navigate = useNavigate();
  const claim = useServerFn(claimAdminWithCode);
  const [authed, setAuthed] = useState(false);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setAuthed(!!data.user));
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await claim({ data: { code } });
      toast.success("Admin access granted");
      navigate({ to: "/admin" });
    } catch (err: any) {
      toast.error(err.message || "Could not claim admin");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-md px-4 py-16">
        <h1 className="text-2xl font-medium tracking-tight">Claim admin access</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Enter the team code provided by Circuit Archive to upgrade your account.
        </p>

        {!authed ? (
          <p className="mt-8 rounded-md border border-border p-4 text-sm">
            You need to{" "}
            <a href="/auth?redirect=/admin-signup" className="underline">
              sign in
            </a>{" "}
            first.
          </p>
        ) : (
          <form onSubmit={submit} className="mt-8 space-y-4">
            <input
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Admin code"
              className="w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-accent py-3 text-sm font-medium text-accent-foreground disabled:opacity-50"
            >
              {loading ? "Verifying…" : "Claim admin"}
            </button>
          </form>
        )}
      </main>
    </div>
  );
}
