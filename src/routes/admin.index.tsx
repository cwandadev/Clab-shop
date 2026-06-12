import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { listAdminProducts, deleteProduct } from "@/lib/products.functions";

export const Route = createFileRoute("/admin/")({
  component: AdminProducts,
});

function AdminProducts() {
  const list = useServerFn(listAdminProducts);
  const del = useServerFn(deleteProduct);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["admin-products"], queryFn: () => list() });

  const deleteMut = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => {
      toast.success("Product deleted");
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      qc.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;

  return (
    <div className="overflow-x-auto rounded-lg ring-1 ring-black/5">
      <table className="w-full text-left text-sm">
        <thead className="bg-secondary font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-medium">Slug</th>
            <th className="px-4 py-3 font-medium">Name</th>
            <th className="px-4 py-3 font-medium">Category</th>
            <th className="px-4 py-3 font-medium">Stock</th>
            <th className="px-4 py-3 font-medium">Price</th>
            <th className="px-4 py-3 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border bg-background">
          {(data ?? []).map((p) => (
            <tr key={p.id}>
              <td className="px-4 py-4 font-mono text-xs text-muted-foreground">{p.slug}</td>
              <td className="px-4 py-4 font-medium">{p.name}</td>
              <td className="px-4 py-4 text-muted-foreground">{p.category}</td>
              <td className={"px-4 py-4 font-mono " + (p.stock < 10 ? "text-destructive" : "")}>
                {p.stock}
              </td>
              <td className="px-4 py-4 font-mono">${Number(p.price_usd).toFixed(2)}</td>
              <td className="px-4 py-4 text-right space-x-3">
                <Link to="/admin/edit/$id" params={{ id: p.id }} className="text-xs underline">
                  Edit
                </Link>
                <button
                  onClick={() => {
                    if (confirm(`Delete "${p.name}"?`)) deleteMut.mutate(p.id);
                  }}
                  className="text-xs text-destructive underline"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
