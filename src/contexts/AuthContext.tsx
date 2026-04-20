import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type AppRole = "admin" | "procurement_manager" | "finance_officer" | "employee";

interface Profile {
  id: string;
  name: string;
  company: string | null;
  phone: string | null;
  avatar_url: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  roles: AppRole[];
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  signup: (data: { name: string; email: string; company: string; password: string }) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  hasRole: (role: AppRole) => boolean;
  hasAnyRole: (roles: AppRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  const loadProfileAndRoles = async (uid: string) => {
    const [{ data: p }, { data: r }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", uid).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", uid),
    ]);
    setProfile(p as Profile | null);
    setRoles(((r ?? []) as { role: AppRole }[]).map((x) => x.role));
  };

  useEffect(() => {
    // Set up listener FIRST
    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
      setUser(sess?.user ?? null);
      if (sess?.user) {
        // Defer Supabase calls to avoid deadlock
        setTimeout(() => loadProfileAndRoles(sess.user.id), 0);
      } else {
        setProfile(null);
        setRoles([]);
      }
    });

    // THEN check existing session
    supabase.auth.getSession().then(({ data: { session: sess } }) => {
      setSession(sess);
      setUser(sess?.user ?? null);
      if (sess?.user) loadProfileAndRoles(sess.user.id);
      setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast.error(error.message);
      return { error: error.message };
    }
    toast.success("Welcome back!");
    return {};
  };

  const signup = async (data: { name: string; email: string; company: string; password: string }) => {
    const redirectUrl = `${window.location.origin}/`;
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        emailRedirectTo: redirectUrl,
        data: { name: data.name, company: data.company },
      },
    });
    if (error) {
      toast.error(error.message);
      return { error: error.message };
    }
    toast.success("Account created! You can sign in now.");
    return {};
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setRoles([]);
  };

  const refreshProfile = async () => {
    if (user) await loadProfileAndRoles(user.id);
  };

  const hasRole = (role: AppRole) => roles.includes(role);
  const hasAnyRole = (rs: AppRole[]) => rs.some((r) => roles.includes(r));

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        roles,
        loading,
        isAuthenticated: !!session,
        login,
        signup,
        logout,
        refreshProfile,
        hasRole,
        hasAnyRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
