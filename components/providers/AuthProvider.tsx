// "use client";
// import React, { createContext, useContext, useEffect, useState } from "react";
// import type { AuthUser } from "@/types";

// interface AuthContextType {
//   user: AuthUser | null;
//   isLoading: boolean;
//   login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
//   logout: () => Promise<void>;
// }

// const AuthContext = createContext<AuthContextType | undefined>(undefined);

// export function AuthProvider({ children }: { children: React.ReactNode }) {
//   const [user, setUser] = useState<AuthUser | null>(null);
//   const [isLoading, setIsLoading] = useState(true);

//   // On mount, check if there's a valid session cookie
//   useEffect(() => {
//     fetch("/api/auth/me")
//       .then(r => r.ok ? r.json() : null)
//       .then(data => { setUser(data?.data ?? null); setIsLoading(false); })
//       .catch(() => { setUser(null); setIsLoading(false); });
//   }, []);

//   const login = async (email: string, password: string) => {
//     const res = await fetch("/api/auth/login", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ email, password }),
//     });
//     const data = await res.json();
//     if (res.ok) { setUser(data.data.user); return { success: true }; }
//     return { success: false, error: data.error };
//   };

//   const logout = async () => {
//     await fetch("/api/auth/logout", { method: "POST" });
//     setUser(null);
//     window.location.href = "/login";
//   };

//   return (
//     <AuthContext.Provider value={{ user, isLoading, login, logout }}>
//       {children}
//     </AuthContext.Provider>
//   );
// }

// export function useAuth() {
//   const ctx = useContext(AuthContext);
//   if (!ctx) throw new Error("useAuth must be inside AuthProvider");
//   return ctx;
// }






"use client";
import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { AuthUser } from "@/types";

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setUser(data.data);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setUser(data.data.user);
        return { success: true };
      }
      return { success: false, error: data.error ?? "Login failed" };
    } catch {
      return { success: false, error: "Network error. Please try again." };
    }
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}