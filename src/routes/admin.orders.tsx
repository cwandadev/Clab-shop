import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { listAdminOrders, updateOrderStatus } from "@/lib/products.functions";

const STATUSES = ["pending", "paid", "shipped", "delivered", "cancelled"] as const;

export const Route = createFileRoute("/admin/orders")({
  component: AdminOrders,
});

function AdminOrders() {
  const list = useServerFn(listAdminOrders);
  const update = useServerFn(updateOrderStatus);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["admin-orders"], queryFn: () => list() });
  const mut = useMutation({
    mutationFn: (v: { id: string; status: (typeof STATUSES)[number] }) => update({ data: v }),
    onSuccess: () => {
      toast.success("Order updated");
      qc.invalidateQueries({ queryKey: ["admin-orders"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;

  return (
    <div className="overflow-x-auto rounded-lg ring-1 ring-black/5">
      <table className="w-full text-left text-sm">
        <thead className="bg-secondary font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-medium">ID</th>
            <th className="px-4 py-3 font-medium">Customer</th>
            <th className="px-4 py-3 font-medium">City</th>
            <th className="px-4 py-3 font-medium">Items</th>
            <th className="px-4 py-3 font-medium">Total</th>
            <th className="px-4 py-3 font-medium">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border bg-background">
          {(data ?? []).map((o: any) => (
            <tr key={o.id}>
              <td className="px-4 py-4 font-mono text-xs text-muted-foreground">
                #{o.id.slice(0, 8)}
              </td>
              <td className="px-4 py-4">
                <p className="font-medium">{o.customer_name}</p>
                <p className="text-xs text-muted-foreground">{o.customer_email}</p>
              </td>
              <td className="px-4 py-4 text-muted-foreground">{o.city}</td>
              <td className="px-4 py-4 font-mono text-xs">
                {(o.order_items ?? []).reduce((s: number, i: any) => s + i.quantity, 0)} units
              </td>
              <td className="px-4 py-4 font-mono">${Number(o.total_usd).toFixed(2)}</td>
              <td className="px-4 py-4">
                <select
                  value={o.status}
                  onChange={(e) =>
                    mut.mutate({ id: o.id, status: e.target.value as (typeof STATUSES)[number] })
                  }
                  className="rounded border border-input bg-background px-2 py-1 text-xs font-mono"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s.toUpperCase()}
                    </option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
          {(data ?? []).length === 0 && (
            <tr>
              <td colSpan={6} className="px-4 py-12 text-center text-sm text-muted-foreground">
                No orders yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
