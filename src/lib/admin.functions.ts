import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Grants admin role to the currently signed-in user if they provide the
 * correct secret ADMIN_SIGNUP_CODE. This is the bootstrap for new admins.
 */
export const claimAdminWithCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ code: z.string().min(4).max(200) }).parse(d))
  .handler(async ({ data, context }) => {
    const expected = process.env.ADMIN_SIGNUP_CODE;
    if (!expected) throw new Error("Admin signup is not configured");
    if (data.code !== expected) throw new Error("Invalid admin code");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: context.userId, role: "admin" });
    // Ignore duplicate insertions (already admin)
    if (error && !/duplicate/i.test(error.message)) throw new Error(error.message);
    return { ok: true };
  });
