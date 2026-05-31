import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type Role = "admin" | "employee" | null;
const SEED_ADMIN_EMAIL = "admin@pitglam.co.ke";

interface AuthCtx {
  user: User | null;
  session: Session | null;
  role: Role;
  isAdmin: boolean;
  isStaff: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshRole: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role>(null);
  const [loading, setLoading] = useState(true);

  const fetchRole = async (uid: string | null, email?: string | null) => {
    if (!uid) {
      setRole(null);
      return;
    }

    if (email?.toLowerCase() === SEED_ADMIN_EMAIL) {
      setRole("admin");
      return;
    }

    const { data } = await supabase.from("user_roles").select("role").eq("user_id", uid);
    if (data?.some((r) => r.role === "admin")) setRole("admin");
    else if (data?.some((r) => r.role === "employee")) setRole("employee");
    else setRole(null);
  };

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      setTimeout(() => fetchRole(s?.user?.id ?? null, s?.user?.email ?? null), 0);
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      fetchRole(data.session?.user?.id ?? null, data.session?.user?.email ?? null).finally(() =>
        setLoading(false),
      );
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const value: AuthCtx = {
    user,
    session,
    role,
    isAdmin: role === "admin",
    isStaff: role === "admin" || role === "employee",
    loading,
    signOut: async () => {
      await supabase.auth.signOut();
    },
    refreshRole: () => fetchRole(user?.id ?? null, user?.email ?? null),
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
