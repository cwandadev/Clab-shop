import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { upsertProduct } from "@/lib/products.functions";

export const Route = createFileRoute("/admin/new")({
  component: NewProduct,
});

function NewProduct() {
  const navigate = useNavigate();
  const save = useServerFn(upsertProduct);
  const [form, setForm] = useState({
    slug: "",
    name: "",
    description: "",
    category: "Components",
    price_usd: 0,
    stock: 0,
    image_url: "",
    spec_1: "",
    spec_2: "",
    active: true,
  });
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await save({ data: form });
      toast.success("Product added");
      navigate({ to: "/admin" });
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="max-w-2xl space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Slug (url id)">
          <input
            required
            pattern="[a-z0-9-]+"
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value })}
            className="inp font-mono"
          />
        </Field>
        <Field label="Category">
          <input
            required
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="inp"
          />
        </Field>
      </div>
      <Field label="Name">
        <input
          required
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="inp"
        />
      </Field>
      <Field label="Description">
        <textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          rows={3}
          className="inp"
        />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Price (USD)">
          <input
            required
            type="number"
            min={0}
            step="0.01"
            value={form.price_usd}
            onChange={(e) => setForm({ ...form, price_usd: Number(e.target.value) })}
            className="inp font-mono"
          />
        </Field>
        <Field label="Stock">
          <input
            required
            type="number"
            min={0}
            value={form.stock}
            onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })}
            className="inp font-mono"
          />
        </Field>
      </div>
      <Field label="Image URL (optional)">
        <input
          type="url"
          value={form.image_url}
          onChange={(e) => setForm({ ...form, image_url: e.target.value })}
          className="inp"
        />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Spec 1 (e.g. 5V)">
          <input
            value={form.spec_1}
            onChange={(e) => setForm({ ...form, spec_1: e.target.value })}
            className="inp"
          />
        </Field>
        <Field label="Spec 2 (e.g. USB-C)">
          <input
            value={form.spec_2}
            onChange={(e) => setForm({ ...form, spec_2: e.target.value })}
            className="inp"
          />
        </Field>
      </div>
      <button
        type="submit"
        disabled={saving}
        className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-50"
      >
        {saving ? "Saving…" : "Create product"}
      </button>
      <style>{`.inp{width:100%;border:1px solid var(--input);border-radius:6px;padding:0.5rem 0.75rem;font-size:0.875rem;background:var(--background)}`}</style>
    </form>
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
