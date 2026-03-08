import { createContext, useContext, useState, ReactNode } from "react";
import { useNavigate } from "react-router-dom";

interface AuthUser {
  name: string;
  email: string;
  company: string;
  role: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => void;
  signup: (data: { name: string; email: string; company: string; password: string }) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const stored = localStorage.getItem("vendorflow_user");
    return stored ? JSON.parse(stored) : null;
  });

  const login = (email: string, _password: string) => {
    const u: AuthUser = { name: "John Admin", email, company: "Acme Corp", role: "Admin" };
    setUser(u);
    localStorage.setItem("vendorflow_user", JSON.stringify(u));
  };

  const signup = (data: { name: string; email: string; company: string; password: string }) => {
    const u: AuthUser = { name: data.name, email: data.email, company: data.company, role: "Employee" };
    setUser(u);
    localStorage.setItem("vendorflow_user", JSON.stringify(u));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("vendorflow_user");
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
