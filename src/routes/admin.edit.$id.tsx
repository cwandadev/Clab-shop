import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { upsertProduct, listAdminProducts } from "@/lib/products.functions";

export const Route = createFileRoute("/admin/edit/$id")({
  component: EditProduct,
});

function EditProduct() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const save = useServerFn(upsertProduct);
  const list = useServerFn(listAdminProducts);
  const [form, setForm] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    list().then((products) => {
      const p = products.find((x) => x.id === id);
      if (p) setForm({ ...p, image_url: p.image_url || "", description: p.description || "" });
    });
  }, [id, list]);

  if (!form) return <p className="text-sm text-muted-foreground">Loading…</p>;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await save({
        data: {
          id: form.id,
          slug: form.slug,
          name: form.name,
          description: form.description,
          category: form.category,
          price_usd: Number(form.price_usd),
          stock: Number(form.stock),
          image_url: form.image_url,
          spec_1: form.spec_1 || "",
          spec_2: form.spec_2 || "",
          active: form.active,
        },
      });
      toast.success("Product updated");
      navigate({ to: "/admin" });
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="max-w-2xl space-y-4">
      <h2 className="text-lg font-medium">Edit {form.name}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <F label="Slug">
          <input
            required
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value })}
            className="inp font-mono"
          />
        </F>
        <F label="Category">
          <input
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="inp"
          />
        </F>
      </div>
      <F label="Name">
        <input
          required
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="inp"
        />
      </F>
      <F label="Description">
        <textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          rows={3}
          className="inp"
        />
      </F>
      <div className="grid grid-cols-2 gap-4">
        <F label="Price USD">
          <input
            type="number"
            min={0}
            step="0.01"
            value={form.price_usd}
            onChange={(e) => setForm({ ...form, price_usd: e.target.value })}
            className="inp font-mono"
          />
        </F>
        <F label="Stock">
          <input
            type="number"
            min={0}
            value={form.stock}
            onChange={(e) => setForm({ ...form, stock: e.target.value })}
            className="inp font-mono"
          />
        </F>
      </div>
      <F label="Image URL">
        <input
          value={form.image_url}
          onChange={(e) => setForm({ ...form, image_url: e.target.value })}
          className="inp"
        />
      </F>
      <div className="grid grid-cols-2 gap-4">
        <F label="Spec 1">
          <input
            value={form.spec_1 || ""}
            onChange={(e) => setForm({ ...form, spec_1: e.target.value })}
            className="inp"
          />
        </F>
        <F label="Spec 2">
          <input
            value={form.spec_2 || ""}
            onChange={(e) => setForm({ ...form, spec_2: e.target.value })}
            className="inp"
          />
        </F>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.active}
          onChange={(e) => setForm({ ...form, active: e.target.checked })}
        />
        Active (visible in store)
      </label>
      <button
        type="submit"
        disabled={saving}
        className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save changes"}
      </button>
      <style>{`.inp{width:100%;border:1px solid var(--input);border-radius:6px;padding:0.5rem 0.75rem;font-size:0.875rem;background:var(--background)}`}</style>
    </form>
  );
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1">{label}</label>
      {children}
    </div>
  );
}
