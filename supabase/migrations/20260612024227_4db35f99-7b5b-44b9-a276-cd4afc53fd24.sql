
DROP POLICY "Anyone can create orders" ON public.orders;
DROP POLICY "Anyone can insert order items" ON public.order_items;
REVOKE INSERT ON public.orders FROM anon;
REVOKE INSERT ON public.order_items FROM anon;

CREATE POLICY "Authenticated users create their orders" ON public.orders
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Authenticated users add their order items" ON public.order_items
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS(SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.user_id = auth.uid())
  );

REVOKE EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) TO service_role;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
