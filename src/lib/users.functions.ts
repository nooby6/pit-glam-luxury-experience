import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const SEED_ADMIN_EMAIL = "admin@pitglam.co.ke";
type Role = "admin" | "employee";

async function assertAdmin(userId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  // Allow seed admin via email
  const { data: u } = await supabaseAdmin.auth.admin.getUserById(userId);
  if (u?.user?.email?.toLowerCase() === SEED_ADMIN_EMAIL) return supabaseAdmin;
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden: admin only");
  return supabaseAdmin;
}

export const listUsers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const supabaseAdmin = await assertAdmin(context.userId);
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
    if (error) throw new Error(error.message);
    const ids = data.users.map((u) => u.id);
    const [{ data: roles }, { data: profiles }] = await Promise.all([
      supabaseAdmin.from("user_roles").select("user_id, role").in("user_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]),
      supabaseAdmin.from("profiles").select("id, display_name").in("id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]),
    ]);
    const roleMap = new Map<string, Role>();
    (roles ?? []).forEach((r: { user_id: string; role: Role }) => {
      const cur = roleMap.get(r.user_id);
      if (r.role === "admin" || !cur) roleMap.set(r.user_id, r.role);
    });
    const nameMap = new Map<string, string | null>();
    (profiles ?? []).forEach((p: { id: string; display_name: string | null }) => nameMap.set(p.id, p.display_name));
    return {
      users: data.users.map((u) => ({
        id: u.id,
        email: u.email ?? "",
        display_name: nameMap.get(u.id) ?? null,
        role: roleMap.get(u.id) ?? null,
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at ?? null,
      })),
    };
  });

export const createUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      email: z.string().email().max(320),
      password: z.string().min(8).max(72),
      display_name: z.string().max(120).optional(),
      role: z.enum(["admin", "employee"]).nullable().optional(),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const supabaseAdmin = await assertAdmin(context.userId);
    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: data.display_name ? { display_name: data.display_name } : undefined,
    });
    if (error || !created.user) throw new Error(error?.message ?? "Could not create user");
    if (data.role) {
      const { error: rErr } = await supabaseAdmin
        .from("user_roles")
        .insert({ user_id: created.user.id, role: data.role });
      if (rErr) throw new Error(rErr.message);
    }
    return { ok: true, user_id: created.user.id };
  });

export const deleteUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ user_id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    if (data.user_id === context.userId) throw new Error("You can't delete your own account.");
    const supabaseAdmin = await assertAdmin(context.userId);
    const { data: u } = await supabaseAdmin.auth.admin.getUserById(data.user_id);
    if (u?.user?.email?.toLowerCase() === SEED_ADMIN_EMAIL) {
      throw new Error("The seed admin account cannot be deleted.");
    }
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.user_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const setUserRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      user_id: z.string().uuid(),
      role: z.enum(["admin", "employee"]).nullable(),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const supabaseAdmin = await assertAdmin(context.userId);
    await supabaseAdmin.from("user_roles").delete().eq("user_id", data.user_id);
    if (data.role) {
      const { error } = await supabaseAdmin
        .from("user_roles")
        .insert({ user_id: data.user_id, role: data.role });
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });
